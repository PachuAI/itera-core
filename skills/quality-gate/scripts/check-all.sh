#!/usr/bin/env bash

set -u -o pipefail

MODE="${1:-full}"
OUT_DIR_INPUT="${2:-}"

if [[ "$MODE" != "full" && "$MODE" != "fast" ]]; then
  echo "Uso: $0 [full|fast] [out-dir]" >&2
  exit 1
fi

ROOT_DIR="$(pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${OUT_DIR_INPUT:-$ROOT_DIR/.planning/quality-gate-artifacts/$STAMP}"
LOG_DIR="$OUT_DIR/logs"
SCAN_DIR="$OUT_DIR/scans"
SUMMARY_FILE="$OUT_DIR/summary.md"
STATUS_FILE="$OUT_DIR/status.tsv"

mkdir -p "$LOG_DIR" "$SCAN_DIR"

touch "$STATUS_FILE"

echo "# Quality Gate Artifacts" >"$SUMMARY_FILE"
echo >>"$SUMMARY_FILE"
echo "- Fecha: $(date --iso-8601=seconds)" >>"$SUMMARY_FILE"
echo "- Root: $ROOT_DIR" >>"$SUMMARY_FILE"
echo "- Mode: $MODE" >>"$SUMMARY_FILE"
echo "- Artifacts: $OUT_DIR" >>"$SUMMARY_FILE"
echo >>"$SUMMARY_FILE"

OVERALL_STATUS=0
RG_DEFAULT_EXCLUDES=(
  -g '!**/.next/**'
  -g '!**/node_modules/**'
  -g '!**/coverage/**'
  -g '!**/test-results/**'
  -g '!**/playwright-report/**'
  -g '!**/__tests__/**'
  -g '!**/*.test.*'
  -g '!**/*.spec.*'
  -g '!**/generated/**'
)

sanitize_filename() {
  printf '%s' "$1" | sed -E 's/[^A-Za-z0-9._-]+/-/g'
}

write_skip_step() {
  local display_name="$1"
  local reason="$2"
  echo "### $display_name" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
  echo "- Estado: SKIP ($reason)" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
  printf '%s\t-\t-\tskip\n' "$display_name" >>"$STATUS_FILE"
}

write_no_applicable_scan() {
  local name="$1"
  echo "# sin directorios aplicables" >"$SCAN_DIR/${name}.txt"
}

run_step() {
  local name="$1"
  shift

  local safe_name
  safe_name="$(sanitize_filename "$name")"
  local log_file="$LOG_DIR/${safe_name}.log"

  echo "== $name =="
  echo "### $name" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
  echo '```text' >>"$SUMMARY_FILE"
  echo "\$ $*" >>"$SUMMARY_FILE"
  echo '```' >>"$SUMMARY_FILE"

  if "$@" >"$log_file" 2>&1; then
    printf '%s\t%s\t%s\n' "$name" "0" "$log_file" >>"$STATUS_FILE"
    echo "- Estado: OK" >>"$SUMMARY_FILE"
  else
    local exit_code=$?
    printf '%s\t%s\t%s\n' "$name" "$exit_code" "$log_file" >>"$STATUS_FILE"
    echo "- Estado: FAIL ($exit_code)" >>"$SUMMARY_FILE"
    OVERALL_STATUS=1
  fi

  echo "- Log: \`$log_file\`" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
}

run_step_nonfatal() {
  local name="$1"
  shift

  local safe_name
  safe_name="$(sanitize_filename "$name")"
  local log_file="$LOG_DIR/${safe_name}.log"

  echo "== $name (non-fatal) =="
  echo "### $name" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
  echo '```text' >>"$SUMMARY_FILE"
  echo "\$ $*" >>"$SUMMARY_FILE"
  echo '```' >>"$SUMMARY_FILE"

  if "$@" >"$log_file" 2>&1; then
    printf '%s\t%s\t%s\n' "$name" "0" "$log_file" >>"$STATUS_FILE"
    echo "- Estado: OK" >>"$SUMMARY_FILE"
  else
    local exit_code=$?
    printf '%s\t%s\t%s\tnonfatal\n' "$name" "$exit_code" "$log_file" >>"$STATUS_FILE"
    echo "- Estado: WARN non-fatal ($exit_code)" >>"$SUMMARY_FILE"
  fi

  echo "- Log: \`$log_file\`" >>"$SUMMARY_FILE"
  echo >>"$SUMMARY_FILE"
}

capture_rg() {
  local name="$1"
  shift
  local out_file="$SCAN_DIR/${name}.txt"
  if rg -n "${RG_DEFAULT_EXCLUDES[@]}" "$@" >"$out_file" 2>&1; then
    :
  else
    local exit_code=$?
    if [[ $exit_code -gt 1 ]]; then
      echo "rg failure for $name" >>"$out_file"
      OVERALL_STATUS=1
    fi
  fi
}

capture_rg_or_note() {
  local name="$1"
  local pattern="$2"
  shift 2

  if [[ $# -eq 0 ]]; then
    write_no_applicable_scan "$name"
    return
  fi

  capture_rg "$name" "$pattern" "$@"
}

# Post-filtra findmany.txt: mantiene solo hits donde NO hay `take: <N>` ni
# shorthand `take,` en las siguientes 45 lineas del archivo. Convierte un
# checklist en un verdict.
filter_findmany_no_take() {
  local src_file="$SCAN_DIR/findmany.txt"
  local out_file="$SCAN_DIR/findmany-no-take.txt"
  : >"$out_file"

  if [[ ! -s "$src_file" ]] || grep -q '^#' "$src_file"; then
    echo "# sin hits de findMany en el repo" >"$out_file"
    return
  fi

  while IFS=: read -r file line _; do
    [[ -z "$file" || -z "$line" ]] && continue
    [[ "$file" == "#"* ]] && continue
    [[ ! -f "$file" ]] && continue
    local window
    window=$(sed -n "${line},$((line + 45))p" "$file" 2>/dev/null)
    if ! grep -qE 'take\s*(:\s*[0-9A-Za-z_]|,)' <<<"$window"; then
      echo "$file:$line" >>"$out_file"
    fi
  done < "$src_file"

  if [[ ! -s "$out_file" ]]; then
    echo "# sin hits (todos los findMany tienen take cercano)" >"$out_file"
  fi
}

# Post-filtra toLocaleDateString: dentro del bloque de opciones (hasta cerrar
# con '}' o ')'), busca si falta `timeZone:`. Solo reporta los que realmente
# carecen del timezone explicito. Convierte un checklist ruidoso en verdict.
filter_locale_date_without_timezone() {
  local out_file="$SCAN_DIR/locale-date-without-timezone.txt"
  : >"$out_file"

  if [[ ${#CODE_ROOTS[@]} -eq 0 ]]; then
    echo "# sin directorios aplicables" >"$out_file"
    return
  fi

  # Primero juntar todos los hits crudos de toLocaleDateString en los roots.
  local raw
  raw=$(rg -n "${RG_DEFAULT_EXCLUDES[@]}" 'toLocaleDateString\(' "${CODE_ROOTS[@]}" 2>/dev/null || true)

  if [[ -z "$raw" ]]; then
    echo "# sin hits de toLocaleDateString" >"$out_file"
    return
  fi

  while IFS=: read -r file line _; do
    [[ -z "$file" || -z "$line" ]] && continue
    [[ ! -f "$file" ]] && continue
    local window
    window=$(sed -n "${line},$((line + 15))p" "$file" 2>/dev/null)
    if ! grep -q 'timeZone' <<<"$window"; then
      echo "$file:$line" >>"$out_file"
    fi
  done <<<"$raw"

  if [[ ! -s "$out_file" ]]; then
    echo "# sin hits (toLocaleDateString siempre con timeZone explicito)" >"$out_file"
  fi
}

capture_find_lines() {
  local name="$1"
  shift
  local out_file="$SCAN_DIR/${name}.txt"
  local targets=()

  for p in "$@"; do
    [[ -d "$p" ]] && targets+=("$p")
  done

  if [[ ${#targets[@]} -eq 0 ]]; then
    echo "# sin directorios aplicables" >"$out_file"
    return
  fi

  find "${targets[@]}" \
    \( -path '*/generated/*' -o -path '*/__tests__/*' \) -prune -o \
    -type f \( -name '*.ts' -o -name '*.tsx' \) \
    ! -name '*.test.ts' ! -name '*.test.tsx' ! -name '*.spec.ts' ! -name '*.spec.tsx' \
    -print0 \
    | xargs -0 wc -l \
    | sort -nr >"$out_file" 2>/dev/null || true
}

existing() {
  for p in "$@"; do
    [[ -e "$p" ]] && echo "$p"
  done
}

has_pnpm_script() {
  local script="$1"
  [[ -f package.json ]] || return 1
  node -e "const p=require(process.cwd()+'/package.json');process.exit((p.scripts&&p.scripts['$script'])?0:1)" 2>/dev/null
}

run_step_if_script() {
  local script="$1"
  if has_pnpm_script "$script"; then
    run_step "$script" pnpm run "$script"
  else
    write_skip_step "$script" "script \`$script\` no definido en package.json"
  fi
}

find_client_files() {
  if [[ ${#CLIENT_SCAN_ROOTS[@]} -eq 0 ]]; then
    return 0
  fi

  rg -l --glob '*.{ts,tsx,js,jsx,mjs,cjs}' "^['\"]use client['\"]" "${CLIENT_SCAN_ROOTS[@]}" 2>/dev/null || true
}

capture_client_env_leaks() {
  local out_file="$SCAN_DIR/client-env-leak.txt"
  : >"$out_file"

  local client_files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && client_files+=("$f")
  done < <(find_client_files)

  if [[ ${#CLIENT_SCAN_ROOTS[@]} -eq 0 ]]; then
    echo "# sin directorios aplicables" >"$out_file"
    return
  fi

  if [[ ${#client_files[@]} -eq 0 ]]; then
    echo "# no se encontraron archivos con 'use client'" >"$out_file"
    return
  fi

  for file in "${client_files[@]}"; do
    rg -n 'process\.env\.[A-Z_]+' "$file" 2>/dev/null \
      | grep -vE 'process\.env\.(NEXT_PUBLIC_[A-Z0-9_]*|NODE_ENV)\b' >>"$out_file" || true
  done

  if [[ ! -s "$out_file" ]]; then
    echo "# sin hits (ningun leak detectado)" >"$out_file"
  fi
}

capture_client_secret_names() {
  local out_file="$SCAN_DIR/client-secret-names.txt"
  : >"$out_file"

  local client_files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && client_files+=("$f")
  done < <(find_client_files)

  if [[ ${#CLIENT_SCAN_ROOTS[@]} -eq 0 ]]; then
    echo "# sin directorios aplicables" >"$out_file"
    return
  fi

  if [[ ${#client_files[@]} -eq 0 ]]; then
    echo "# no se encontraron archivos con 'use client'" >"$out_file"
    return
  fi

  for file in "${client_files[@]}"; do
    rg -n -i 'api[_-]?key|secret[_-]?key|private[_-]?key|auth[_-]?token|service[_-]?role|BETTER_AUTH_SECRET|DATABASE_URL' "$file" 2>/dev/null >>"$out_file" || true
  done

  if [[ ! -s "$out_file" ]]; then
    echo "# sin hits" >"$out_file"
  fi
}

run_step_if_script "typecheck"
run_step_if_script "lint"
run_step_if_script "quality:check"

if [[ "$MODE" == "full" ]]; then
  run_step_if_script "test:run"
  run_step_if_script "build"
  run_step_nonfatal "audit" pnpm audit --audit-level high
fi

CODE_ROOTS=($(existing src app lib components hooks actions tests e2e))
PRISMA_ROOTS=($(existing prisma))
SCRIPT_ROOTS=($(existing scripts))
NEXT_ROOTS=($(existing src/app src/lib src/actions app lib actions))
UI_ROOTS=($(existing src/components src/app components app))
CLIENT_SCAN_ROOTS=($(existing src app lib components hooks))
SCAN_ROOTS=("${CODE_ROOTS[@]}" "${PRISMA_ROOTS[@]}" "${SCRIPT_ROOTS[@]}")
TENANT_ROOTS=("${CODE_ROOTS[@]}" "${PRISMA_ROOTS[@]}")

capture_rg_or_note "silent-catches" 'catch\s*\{\s*\}' "${SCAN_ROOTS[@]}"
capture_rg_or_note "ts-escape-hatches" '@ts-ignore|@ts-expect-error|eslint-disable' "${CODE_ROOTS[@]}" "${PRISMA_ROOTS[@]}"
capture_rg_or_note "barrel-exports" '^export\s+\*' "${CODE_ROOTS[@]}"
capture_rg_or_note "findmany" '\.findMany\(' "${CODE_ROOTS[@]}"
capture_rg_or_note "prisma-raw" '\$queryRaw|\$executeRaw|Prisma\.sql' "${CODE_ROOTS[@]}"
capture_rg_or_note "transactions" '\$transaction' "${CODE_ROOTS[@]}"
capture_rg_or_note "next-dynamic-apis" 'headers\(|cookies\(|searchParams|params' "${NEXT_ROOTS[@]}"
capture_rg_or_note "next-revalidation" 'revalidatePath|revalidateTag|updateTag|router\.refresh' "${CODE_ROOTS[@]}"
capture_rg_or_note "next-cache-signatures" 'revalidateTag\([^(,)]*\)|revalidateTag\([^)]*,[^)]*,' "${NEXT_ROOTS[@]}"
capture_rg_or_note "client-components" "^['\"]use client['\"]" "${UI_ROOTS[@]}"
capture_rg_or_note "icon-buttons" 'size=["'\'']icon["'\'']' "${UI_ROOTS[@]}"
capture_rg_or_note "date-parsing" 'new Date\(' "${CODE_ROOTS[@]}"
capture_rg_or_note "tenant-scope" '\b(storeId|tenantId|workspaceId|orgId|organizationId|accountId)\b|require[A-Za-z]*(Tenant|Workspace|Organization)|resolve[A-Za-z]*(Tenant|Workspace|Organization)|scopedDb|tenantDb|requireAdminStoreContext|requireAdminStoreWriteContext|resolveActiveStore' "${TENANT_ROOTS[@]}"
capture_rg_or_note "browser-storage" 'localStorage|sessionStorage' "${CODE_ROOTS[@]}"
capture_rg_or_note "console-calls" 'console\.(log|warn|error)' "${CODE_ROOTS[@]}"
capture_rg_or_note "any-types" ':\s*any\b|<any>|\bas any\b' "${CODE_ROOTS[@]}"
capture_rg_or_note "img-tags" '<img\b' "${CODE_ROOTS[@]}"
capture_rg_or_note "env-usage" 'process\.env\.[A-Z_]+' "${CODE_ROOTS[@]}"

capture_client_env_leaks
capture_client_secret_names
capture_find_lines "largest-tsx" "${CODE_ROOTS[@]}"

# Post-filtros (verdict-grade: cada hit en estos files es un finding real,
# no un "revisa contexto"). Ver la columna Tipo en la tabla Scan->Phase.
filter_findmany_no_take
filter_locale_date_without_timezone

echo "Artifact generation finished: $OUT_DIR"
exit "$OVERALL_STATUS"
