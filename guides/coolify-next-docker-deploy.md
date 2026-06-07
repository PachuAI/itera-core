# Coolify + Next.js Docker — guia operativa

> Guia para desplegar apps Next.js con `output: "standalone"` en Coolify usando Dockerfile.
> Caso validado: deploy de `iteralat/itera-lex-tools-web` en `herramientas.iteralex.com`
> el 2026-05-21.

## Cuando usarla

- Crear un recurso Coolify nuevo para una app Next.js.
- Corregir deploys que compilan localmente pero fallan en Coolify.
- Diagnosticar healthchecks fallidos en apps Dockerfile.
- Publicar subdominios nuevos detras de Cloudflare.

## Checklist rapido

Antes de crear o redeployar:

- `next.config.*` usa `output: "standalone"`.
- El Dockerfile copia `pnpm-workspace.yaml` antes de `pnpm install` si el proyecto usa pnpm 11 y `allowBuilds`.
- Las variables publicas necesarias durante `next build` estan declaradas como `ARG` y luego `ENV` en la etapa `builder`.
- En apps Next + BetterAuth, `APP_URL` es la URL canonica server-side; `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben coincidir con `APP_URL` cuando el producto vive en un solo dominio.
- El runtime debe ejecutar un preflight de env antes de `node server.js` para bloquear `localhost`, URLs internas de Coolify o trusted origins incompletos.
- El runner define `HOSTNAME=0.0.0.0`.
- La imagen final tiene `curl` o `wget` real para que Coolify pueda ejecutar healthcheck.
- El healthcheck de Coolify apunta a `/` o a una ruta simple que no dependa de servicios externos fragiles.
- El DNS existe en Cloudflare autoritativo, no solo "creo que esta creado".

## Dockerfile canonico

```Dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
ARG APP_URL
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV APP_URL=$APP_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV TZ=America/Argentina/Buenos_Aires
RUN apk add --no-cache curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -fsS http://localhost:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
```

Notas:

- `pnpm-workspace.yaml` puede contener `allowBuilds`. Si no se copia antes de `pnpm install`, pnpm 11 puede fallar con `ERR_PNPM_IGNORED_BUILDS`.
- `NEXT_PUBLIC_*` se embebe durante `next build`; en Docker no alcanza con definirlas solo en runtime.
- `APP_URL` debe ser la fuente de verdad server-side para emails y links transaccionales. No usar `NEXT_PUBLIC_APP_URL` para emails.
- `BETTER_AUTH_TRUSTED_ORIGINS` es runtime y debe incluir `APP_URL`.
- `HOSTNAME=0.0.0.0` evita que el server standalone escuche en un hostname interno que Coolify no pueda chequear como `localhost`.
- Coolify avisa: "Dockerfile or Docker Image based deployment detected. The healthcheck needs a curl or wget command". En Alpine, instalar `curl` elimina ambiguedades.

## Crear app con Coolify CLI

Listar datos base:

```bash
coolify context list --format json
coolify server list --format json
coolify project list --format json
coolify github list --format json
```

Crear app privada via GitHub App:

```bash
coolify app create github \
  --server-uuid <server_uuid> \
  --project-uuid <project_uuid> \
  --environment-name production \
  --github-app-uuid <github_app_uuid> \
  --git-repository owner/repo \
  --git-branch master \
  --build-pack dockerfile \
  --ports-exposes 3000 \
  --domains https://subdominio.example.com \
  --name "Nombre App" \
  --health-check-enabled \
  --health-check-path /
```

Agregar env vars:

```bash
coolify app env create <app_uuid> \
  --key APP_URL \
  --value https://subdominio.example.com \
  --is-literal

coolify app env create <app_uuid> \
  --key BETTER_AUTH_URL \
  --value https://subdominio.example.com \
  --is-literal

coolify app env create <app_uuid> \
  --key BETTER_AUTH_TRUSTED_ORIGINS \
  --value https://subdominio.example.com \
  --is-literal

coolify app env create <app_uuid> \
  --key NEXT_PUBLIC_API_URL \
  --value https://api.example.com \
  --is-literal

coolify app env create <app_uuid> \
  --key NEXT_PUBLIC_APP_URL \
  --value https://subdominio.example.com \
  --is-literal
```

Verificar que queden disponibles en build/runtime:

```bash
coolify app env list <app_uuid> --format json \
  | jq -r '.[] | [.key,.is_build_time,.is_runtime] | @tsv'
```

Deploy:

```bash
coolify deploy uuid <app_uuid> --force --format json
coolify app deployments list <app_uuid> --format json
coolify app deployments logs <app_uuid> <deployment_uuid> --format json
```

## Smoke test local antes de redeploy

Antes de empujar otro fix a Coolify, reproducir Docker local:

```bash
docker build \
  --build-arg APP_URL=https://subdominio.example.com \
  --build-arg BETTER_AUTH_URL=https://subdominio.example.com \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_APP_URL=https://subdominio.example.com \
  -t app-deploy-test .

docker rm -f app-deploy-test >/dev/null 2>&1 || true
docker run -d \
  --name app-deploy-test \
  -p 3099:3000 \
  -e APP_URL=https://subdominio.example.com \
  -e BETTER_AUTH_URL=https://subdominio.example.com \
  -e BETTER_AUTH_TRUSTED_ORIGINS=https://subdominio.example.com \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  -e NEXT_PUBLIC_APP_URL=https://subdominio.example.com \
  app-deploy-test

sleep 4
docker exec app-deploy-test curl -fsS http://localhost:3000/ >/tmp/app-health.html
curl -fsSI http://localhost:3099/ | sed -n '1,12p'
```

Si esto falla, no redeployar todavia: el problema esta en el Dockerfile o en env vars de build.

## DNS Cloudflare

No asumir que el record existe. Verificar contra Cloudflare autoritativo:

```bash
dig +short subdominio.example.com @1.1.1.1
dig +trace subdominio.example.com | tail -n 30
```

Crear record A proxied:

```bash
CF_TOKEN="$(cat ~/.config/cloudflare/token)"
ZONE_ID="$(curl -fsS -H "Authorization: Bearer $CF_TOKEN" \
  'https://api.cloudflare.com/client/v4/zones?name=example.com' \
  | jq -r '.result[0].id')"

curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "subdominio",
    "content": "65.108.148.79",
    "proxied": true,
    "ttl": 1
  }'
```

Listar record:

```bash
curl -fsS -H "Authorization: Bearer $CF_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=subdominio.example.com" \
  | jq '{success, count:(.result|length), records:[.result[] | {id,type,name,content,proxied,ttl}]}'
```

Si el resolver local sigue con NXDOMAIN pero `dig @1.1.1.1` ya devuelve IPs, testear forzando Cloudflare:

```bash
curl -fsSI --resolve subdominio.example.com:443:<cloudflare_ip> \
  https://subdominio.example.com/
```

## Renombrar proyecto Coolify

La CLI puede no exponer `coolify project update`. Usar API directa:

```bash
COOLIFY_FQDN="$(jq -r '.instances[] | select(.default==true).fqdn' ~/.config/coolify/config.json)"
COOLIFY_TOKEN="$(jq -r '.instances[] | select(.default==true).token' ~/.config/coolify/config.json)"

curl -fsS -X PATCH "$COOLIFY_FQDN/api/v1/projects/<project_uuid>" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"Nuevo nombre","description":"Descripcion"}'
```

## Diagnostico por sintomas

### `ERR_PNPM_IGNORED_BUILDS`

Causa habitual: Dockerfile copia `package.json` y `pnpm-lock.yaml`, pero no `pnpm-workspace.yaml` con `allowBuilds`.

Fix:

```Dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
```

### `NEXT_PUBLIC_* no esta configurada` durante `next build`

Causa: env definida en Coolify runtime, pero no disponible como build arg en Docker.

Fix:

```Dockerfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

### Build OK, container "Ready", healthcheck falla

Revisar logs de deploy. Si aparece:

```txt
Healthcheck URL (inside the container): GET: http://localhost:3000/
curl: not found
wget: can't connect to remote host: Connection refused
```

Fixes:

- `ENV HOSTNAME=0.0.0.0` en runner.
- `RUN apk add --no-cache curl` en runner.
- `HEALTHCHECK ... curl -fsS http://localhost:3000/`.

### Dominio no resuelve

Si Coolify esta `running:healthy` pero `curl` devuelve `Could not resolve host`, el problema es DNS, no deploy.

Verificar Cloudflare autoritativo:

```bash
dig +short subdominio.example.com @1.1.1.1
```

Si no devuelve IPs, crear o corregir el record.

### App responde pero una integracion externa falla

Separar deploy de upstream. Probar endpoint interno y logs:

```bash
curl -fsS https://api.example.com/health
coolify app logs <api_uuid> -n 180
```

Si el upstream bloquea por IP/WAF, confirmarlo desde el VPS:

```bash
ssh root@<vps_ip> 'curl -sS -o /tmp/up.out -w "%{http_code} %{content_type}\n" https://upstream.example.com/'
```

No seguir ajustando Docker/Coolify si el bloqueo se reproduce desde el host.
