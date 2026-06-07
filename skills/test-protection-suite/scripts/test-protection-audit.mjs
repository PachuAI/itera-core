/* eslint-disable no-console */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

// Adapt these constants per repository.
const CONFIG = {
  srcDirs: ['src'],
  apiDirs: ['src/app/api', 'app/api', 'routes', 'api'],
  serviceDirs: ['src/lib/services', 'src/services', 'services', 'lib/services'],
  routeFileNames: ['route.ts', 'route.tsx', 'handler.ts', 'handler.tsx'],
  testFileRe: /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/,
  codeFileRe: /\.(ts|tsx|js|jsx|mjs|cjs)$/,
  authGuardRe: /\b(requireApiAccess|requireAuth|authGuard|getSessionOrRedirect|authorize)\b/,
  authNegativeRe:
    /(?:status\)?\s*\.\s*toBe\s*\(\s*(?:401|403)\s*\)|status\s*:\s*(?:401|403)|UNAUTHENTICATED|UNAUTHORIZED|FORBIDDEN|No autenticado|Forbidden|Unauthorized)/i,
  writeRe: /\.(?:create|createMany|update|updateMany|delete|deleteMany|upsert|insert|save)\s*\(/,
  ownershipFieldRe:
    /\b(?:userId|tenantId|organizationId|orgId|accountId|projectId|workspaceId|teamId|ownerId|customerId|clientId|profileId|fileId|documentId|tokenId)\b/,
  ownershipTestRe:
    /cross[- ]tenant|tenant ajeno|otro tenant|otro usuario|foreign|forbidden|ownership|not_found|not found|no encontrado|404|403|belongs|owner|propiedad/i,
  auditWriteRe:
    /\b(?:audit|activity|actividad|ledger|logEvent|eventLog)\b\s*(?:\.|\[['"])(?:create|insert|write|log|record)/,
  auditTestRe: /\b(?:audit|activity|actividad|ledger|transaction|\$transaction|atomic)\b/i,
  allowlistedRoutes: new Map([
    // ['src/app/api/auth/[...all]/route.ts', 'Framework passthrough, no business logic.'],
  ]),
}

const JSON_OUTPUT = process.argv.includes('--json')

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll('\\', '/')
}

function exists(filePath) {
  return fs.existsSync(filePath)
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function walk(dirPath, visitor) {
  if (!exists(dirPath)) return
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    const relative = rel(fullPath)
    if (entry.isDirectory()) {
      if (
        ['node_modules', '.next', 'dist', 'build', 'coverage', 'playwright-report', 'test-results'].includes(
          entry.name,
        )
      ) {
        continue
      }
      walk(fullPath, visitor)
      continue
    }
    if (!relative.includes('/node_modules/')) visitor(fullPath)
  }
}

function listFiles(dirs, predicate) {
  const files = []
  for (const dir of dirs) {
    const full = path.join(ROOT, dir)
    walk(full, (filePath) => {
      if (predicate(filePath)) files.push(filePath)
    })
  }
  return [...new Set(files)].sort((a, b) => rel(a).localeCompare(rel(b)))
}

function listTests() {
  return listFiles(CONFIG.srcDirs, (filePath) => CONFIG.testFileRe.test(filePath))
}

function listRoutes() {
  return listFiles(CONFIG.apiDirs, (filePath) => CONFIG.routeFileNames.includes(path.basename(filePath)))
}

function listServices() {
  return listFiles(
    CONFIG.serviceDirs,
    (filePath) =>
      CONFIG.codeFileRe.test(filePath) &&
      !CONFIG.testFileRe.test(filePath) &&
      !rel(filePath).includes('/__tests__/') &&
      !filePath.endsWith('.d.ts'),
  )
}

function nearbyTestsFor(filePath, testEntries) {
  const fileRel = rel(filePath)
  const dirRel = rel(path.dirname(filePath))
  const base = path.basename(filePath).replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '')
  const importHint = fileRel.replace(/^src\//, '@/').replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '')

  return testEntries
    .filter(({ filePath: testPath, content }) => {
      const testRel = rel(testPath)
      const testDir = rel(path.dirname(testPath))
      return (
        testDir.startsWith(dirRel) ||
        testRel.includes(`/${base}.test.`) ||
        content.includes(fileRel) ||
        content.includes(importHint) ||
        content.includes(`../${base}`) ||
        content.includes(`./${base}`)
      )
    })
    .map(({ filePath: testPath }) => rel(testPath))
}

function lineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length
}

function findSuspiciousAssertions(testEntries) {
  const findings = []

  for (const { filePath, content } of testEntries) {
    const file = rel(filePath)
    content.split(/\r?\n/).forEach((line, index) => {
      if (/expect\s*\(\s*true\s*\)/.test(line)) {
        findings.push({ file, line: index + 1, type: 'expect-true', detail: line.trim() })
      }
      if (/\.toBeTruthy\s*\(\s*\)/.test(line)) {
        findings.push({ file, line: index + 1, type: 'toBeTruthy', detail: line.trim() })
      }
    })

    const successOnlyRe =
      /\b(?:it|test)\s*\([\s\S]{0,3000}?expect\s*\([^)]*(?:body|json|result|response)[^)]*\.(?:ok|success)\s*\)\s*\.\s*toBe\s*\(\s*true\s*\)/g
    for (const match of content.matchAll(successOnlyRe)) {
      const block = match[0]
      if (!/(toHaveBeenCalledWith|toEqual|toMatchObject|not\.|status|create|update|delete|transaction|audit|ledger)/i.test(block)) {
        findings.push({
          file,
          line: lineNumber(content, match.index ?? 0),
          type: 'success-only',
          detail: 'success/ok assertion without observable contract nearby',
        })
      }
    }
  }

  return findings
}

function buildAudit() {
  const testEntries = listTests().map((filePath) => ({ filePath, content: read(filePath) }))
  const testContent = new Map(testEntries.map(({ filePath, content }) => [rel(filePath), content]))

  const routeFindings = {
    missingDedicatedTests: [],
    allowlistedMissingDedicatedTests: [],
    sensitiveMissingAuthNegative: [],
  }
  const serviceFindings = {
    writesOwnershipGaps: [],
    auditWithoutAtomicEvidence: [],
  }

  for (const routeFile of listRoutes()) {
    const file = rel(routeFile)
    const content = read(routeFile)
    const tests = nearbyTestsFor(routeFile, testEntries)
    const sensitive = CONFIG.authGuardRe.test(content)
    const allowlistReason = CONFIG.allowlistedRoutes.get(file)

    if (tests.length === 0) {
      const item = { file, sensitive, reason: allowlistReason }
      if (allowlistReason) routeFindings.allowlistedMissingDedicatedTests.push(item)
      else routeFindings.missingDedicatedTests.push(item)
    }

    if (sensitive && tests.length > 0) {
      const joined = tests.map((testFile) => testContent.get(testFile) ?? '').join('\n')
      if (!CONFIG.authNegativeRe.test(joined)) {
        routeFindings.sensitiveMissingAuthNegative.push({ file, tests })
      }
    }
  }

  for (const serviceFile of listServices()) {
    const file = rel(serviceFile)
    const content = read(serviceFile)
    const tests = nearbyTestsFor(serviceFile, testEntries)
    const joined = tests.map((testFile) => testContent.get(testFile) ?? '').join('\n')

    if (CONFIG.writeRe.test(content) && CONFIG.ownershipFieldRe.test(content) && !CONFIG.ownershipTestRe.test(joined)) {
      serviceFindings.writesOwnershipGaps.push({ file, tests })
    }

    if (CONFIG.auditWriteRe.test(content) && !CONFIG.auditTestRe.test(joined)) {
      serviceFindings.auditWithoutAtomicEvidence.push({ file, tests })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      routes: listRoutes().length,
      services: listServices().length,
      tests: testEntries.length,
    },
    routeFindings,
    serviceFindings,
    suspiciousAssertions: findSuspiciousAssertions(testEntries),
  }
}

function printSection(title, items, format, limit = 50) {
  console.log(`\n${title} (${items.length})`)
  if (items.length === 0) {
    console.log('- OK')
    return
  }
  for (const item of items.slice(0, limit)) console.log(`- ${format(item)}`)
  if (items.length > limit) console.log(`- ... ${items.length - limit} more`)
}

function printHuman(audit) {
  console.log('TEST PROTECTION AUDIT')
  console.log(`Generated: ${audit.generatedAt}`)
  console.log(
    `Scanned: ${audit.totals.routes} routes, ${audit.totals.services} services, ${audit.totals.tests} tests`,
  )
  printSection('Routes without dedicated tests', audit.routeFindings.missingDedicatedTests, (item) => item.file)
  printSection(
    'Allowlisted routes without dedicated tests',
    audit.routeFindings.allowlistedMissingDedicatedTests,
    (item) => `${item.file} - ${item.reason}`,
  )
  printSection(
    'Sensitive routes without detectable 401/403 tests',
    audit.routeFindings.sensitiveMissingAuthNegative,
    (item) => `${item.file} -> ${item.tests.join(', ')}`,
  )
  printSection(
    'Services with writes/owner fields lacking ownership evidence',
    audit.serviceFindings.writesOwnershipGaps,
    (item) => `${item.file}${item.tests.length ? ` -> ${item.tests.join(', ')}` : ''}`,
  )
  printSection(
    'Services with audit/log writes lacking atomic evidence',
    audit.serviceFindings.auditWithoutAtomicEvidence,
    (item) => `${item.file}${item.tests.length ? ` -> ${item.tests.join(', ')}` : ''}`,
  )
  printSection(
    'Suspicious assertions',
    audit.suspiciousAssertions,
    (item) => `${item.file}:${item.line} [${item.type}] ${item.detail}`,
  )
  console.log('\nExit code: 0. Treat this as an audit baseline until the repo chooses to enforce thresholds.')
}

const audit = buildAudit()
if (JSON_OUTPUT) console.log(JSON.stringify(audit, null, 2))
else printHuman(audit)
