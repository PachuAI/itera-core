# Commands

## Git Delta

```bash
git status --short
git branch --show-current
git log --oneline --decorate -n 25
git diff --name-status <base>..HEAD
git log --oneline --name-only -n 20 -- prisma/schema.prisma prisma/manual src/lib/db/tenant.ts
git log --oneline --name-only -n 20 -- src/lib/seeds src/app/api/admin/seed scripts/cron docs/codebase/OPERATIONS.md .planning/STATE.md
git log --oneline --name-only -n 20 -- .env.example next.config.ts Dockerfile package.json pnpm-lock.yaml packages scripts
```

## Local Schema Verify

```bash
pnpm db:schema:verify
```

`scripts/manual-schema-rollout.ts` currently supports only `apply` and `verify`. Do not rely on a `plan` subcommand unless the runner has been extended.

## Coolify Deployment Status

```bash
coolify app deployments list r40kockgo40wowg4w84soc4s --format json
coolify app deployments logs r40kockgo40wowg4w84soc4s <deployment_uuid> -n 120
```

Interpretation:

- Latest `finished` commit is the production app version.
- Latest `failed` or `in_progress` commit is not production code yet.
- `JavaScript heap out of memory` during `next build` is a build/deploy capacity issue, separate from DB rollout.

## Production Schema Verify Through Tunnel

Use the repo-specific values from `.planning/guides/SCHEMA-ROLLOUT.md`:

```bash
set -euo pipefail
VPS=65.108.148.79
PG_UUID=jcsokwcw0ks08k8wwwk4wwc0
APP_UUID=r40kockgo40wowg4w84soc4s
DB_NAME=iteralex
PORT=55433

CONTAINER_IP=$(ssh root@$VPS "docker inspect $PG_UUID --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
APP_NAME=$(ssh root@$VPS "docker ps --format '{{.Names}}' | grep $APP_UUID | head -1")
RAW_DATABASE_URL=$(ssh root@$VPS "docker inspect $APP_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DATABASE_URL=' | sed 's/^DATABASE_URL=//'")

ssh -fNL $PORT:$CONTAINER_IP:5432 root@$VPS
cleanup() { pkill -f "ssh -fNL $PORT:$CONTAINER_IP:5432" 2>/dev/null || true; }
trap cleanup EXIT

for i in 1 2 3 4 5 6 7 8 9 10; do
  nc -z localhost $PORT 2>/dev/null && break
  sleep 0.3
done

PROD_DATABASE_URL=$(RAW_DATABASE_URL="$RAW_DATABASE_URL" PORT="$PORT" DB_NAME="$DB_NAME" node - <<'NODE'
const raw = process.env.RAW_DATABASE_URL
const url = new URL(raw)
url.hostname = 'localhost'
url.port = process.env.PORT
url.pathname = `/${process.env.DB_NAME}`
console.log(url.toString())
NODE
)

DATABASE_URL="$PROD_DATABASE_URL" pnpm db:schema:verify
```

This command must not print the database URL. If it hangs, kill the verify process and use the focal history query below.

## Focal Production History Query

Use when the full production verify is unavailable or slow. Replace the SQL file list with the recent manifest files from the commit delta.

```bash
PGPASSWORD="$DB_PASS" psql -h localhost -p "$PORT" -U postgres -d "$DB_NAME" \
  -v ON_ERROR_STOP=1 -P pager=off \
  -c "SELECT file_path, applied_at
      FROM schema_rollout_history
      WHERE file_path IN (
        'prisma/manual/executable/20260612_app_experience_config.sql',
        'prisma/manual/executable/20260612_copilot_usage_operational_trace.sql',
        'prisma/manual/executable/20260612_copilot_user_preferences.sql'
      )
      ORDER BY file_path;"
```

If needed, derive `DB_PASS` from `RAW_DATABASE_URL` without printing it:

```bash
DB_PASS=$(RAW_DATABASE_URL="$RAW_DATABASE_URL" node - <<'NODE'
const url = new URL(process.env.RAW_DATABASE_URL)
console.log(decodeURIComponent(url.password))
NODE
)
```

## Applying Production Schema

Only after explicit user approval and a fresh backup:

```bash
DATABASE_URL="$PROD_DATABASE_URL" pnpm db:migrate:prod
DATABASE_URL="$PROD_DATABASE_URL" pnpm db:schema:verify
```

Record date, DB target, backup path, SQL files applied, and verify result in `.planning/STATE.md` or the current operational memory.
