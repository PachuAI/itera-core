# Coolify + Next.js Docker — guia operativa

> Guia para desplegar apps Next.js con `output: "standalone"` en Coolify usando Dockerfile.
> Casos validados: app Next.js publica (`itera-lex-tools-web`, 2026-05-21) y app Next.js
>
> - runner privado Compose (`itera-lex`, Coolify 4.1.2 / CLI 1.6.2, 2026-07-14).

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
- La GitHub App elegida puede leer efectivamente `owner/repo`; dos integraciones con nombres parecidos
  no son intercambiables.
- Antes de hacer push, confirmar si auto-deploy esta activo. Un push puede empezar un build aunque la
  intencion fuera solamente publicar commits.
- En un worktree nuevo, correr `pnpm install --offline --frozen-lockfile` y el generador de Prisma del
  repo antes de interpretar imports o clientes generados faltantes como defectos de codigo.

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
coolify deploy get <deployment_uuid> --format json
coolify app deployments list <app_uuid> --format json
coolify app deployments logs <app_uuid> <deployment_uuid> --lines 200
```

`coolify app deploy <app_uuid>` es alias de `app start`. La respuesta humana contiene el UUID del
deploy aunque `--format json` no siempre produzca JSON parseable; capturar la salida y extraer la linea
`Deployment UUID:`. En CLI 1.6.2 son válidos tanto `coolify deploy get` como
`coolify app deployments list|logs`; el segundo carril permite filtrar por app y seguir logs. No
inventar nombres de comando: confirmar con `--help` de la versión instalada.

## Variables: runtime, build, preview y secretos

- `~/.config/coolify/config.json` contiene tokens reutilizables de todos los contextos. Nunca
  mostrarlo completo con `cat`, `sed`, un editor volcado a stdout ni un trace `set -x`.
- Para API directa, seleccionar el contexto con `jq` y asignar FQDN/token a variables de proceso sin
  imprimirlas. No loguear el header `Authorization`, el body sensible ni la expansión del comando.
- Si un token aparece en salida, considerarlo expuesto aunque no se haya publicado fuera de la
  sesión. El default es rollback seguro y rotación. Un operador único puede aceptar explícitamente
  diferirla hasta el cierre para terminar un canary interno ya contenido; registrar la excepción,
  mantener tenants/servicios acotados y no volver a imprimir el valor.
- No usar `-s/--show-sensitive` salvo que el valor sea estrictamente necesario. Para inventarios,
  reportar key, presencia y flags.
- `NEXT_PUBLIC_*` suele necesitar build-time; claves privadas, passwords, HMAC y URLs de DB deben ser
  runtime-only.
- En variables existentes, `coolify app env update <app> <uuid|key> --value ...` preservo correctamente
  `is_build_time=false` en CLI 1.6.2. Verificar siempre el resultado con `env list`; no confiar en los
  defaults impresos por `--help`.
- En create/update complejos, la CLI puede no poder expresar un booleano `false` o recibir 422. La API
  acepta `is_buildtime:false`, `is_runtime:true`, `is_preview:false`, `is_literal:true`; usarla solo con
  el token del contexto ya configurado y sin imprimir payloads secretos.
- Coolify puede crear un par production/preview para una key. Inspeccionar ambas filas y no asumir que
  actualizar una modifico la otra.
- Algunas respuestas de update serializan settings como `null` aunque hayan persistido. La prueba es
  el recurso reconsultado y, despues del redeploy, el env efectivo del container; no el body del PATCH.

## Runner o servicio privado con Docker Compose

Para un servicio interno sin HTTP publico, preferir Compose cuando se necesiten controles de
hardening. En Coolify 4.1.2, la conversion de `docker run` a Compose puede omitir silenciosamente
`read_only`, `tmpfs` y `pids_limit`.

Contrato minimo:

```yaml
services:
  runner:
    build:
      context: .
      dockerfile: services/runner/Dockerfile
    restart: unless-stopped
    read_only: true
    user: "10001:10001"
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64m
    pids_limit: 128
    cpus: 1
    mem_limit: 1g
    volumes:
      - runner-home:/home/runner/.runner
    networks:
      coolify:
        aliases:
          - private-runner

volumes:
  runner-home:

networks:
  coolify:
    external: true
```

Guardrails comprobados:

- Coolify resuelve el Compose desde la raiz del repo. Si el archivo esta anidado, `build.context` sigue
  siendo `.` cuando el Dockerfile necesita el repo completo; no usar una ruta relativa al YAML por
  intuicion.
- Declarar explicitamente la red externa `coolify`. Coolify tambien agrega su red de proyecto; eso es
  esperado.
- No fijar una IP estatica dentro de la red global `coolify` auto-IPAM y nunca recrear esa red: puede
  romper todos los recursos del host. Usar alias DNS privado y resolverlo desde la app.
- Crear el recurso sin dominio ni puerto publico. `app create` puede asignar un dominio temporal
  `sslip.io`; limpiarlo con `coolify app update <uuid> --domains ''` y verificar `fqdn` vacio.
- La API rechaza algunos `null` (por ejemplo `ports_exposes:null`). Omitir el campo o usar el comando
  CLI que representa el estado deseado.
- Si Compose declara el volumen, borrar metadatos de storage stale de intentos anteriores y dejar que
  Compose sea el unico owner. Montar solo el directorio persistente necesario: no repo, Docker socket,
  DB ni secretos de otras apps.
- `app create`/`app start` pueden poner el recurso en marcha sin `--instant-deploy`. Mirar deploys y
  containers antes de volver a ejecutar el comando.
- Coolify ejecuta el healthcheck dentro de la imagen. Instalar el cliente real (`curl` o `wget`) y sus
  certificados CA. `curl` sin `ca-certificates` falla TLS aunque DNS y egress esten bien.
- Un runtime minimalista puede no tener `curl`; para probes ad-hoc de una app Node usar `node -e` con
  `fetch`. No instalar herramientas en caliente para maquillar la imagen.

Para CLIs autenticadas dentro del runner:

- Hacer device auth dentro del container/volumen productivo y con el usuario no-root; no copiar auth
  desde el desktop.
- Comprobar primero el comando soportado por la version pinneada.
- No asumir que el binario esta en `PATH`: invocar la variable declarada por la imagen, por ejemplo
  `"$CODEX_BIN" login status`.
- Validar el JSON/body del smoke, no solo HTTP. Un modelo inexistente puede responder HTTP 200 con un
  resultado interno `failed`.
- Las reglas de egress aplicadas con iptables en vivo no sobreviven necesariamente a un redeploy o
  reboot. Documentar hosts y reaplicarlas antes de reactivar el servicio; no declararlas persistentes
  si no lo son.

### Egress allowlist: dos redes e IPv6

Un Compose Coolify queda normalmente conectado a la red externa `coolify` y a una red de proyecto.
La ruta default puede salir por cualquiera: una regla `DOCKER-USER` ligada sólo a la IPv4 del alias
privado no cubre necesariamente el tráfico real. Además, Docker puede asignar IPv6 global; bloquear
sólo con `iptables` deja abierta esa ruta mediante `ip6tables`.

Después de cada deploy/restart:

1. Obtener con `docker inspect` todas las IPv4 y `GlobalIPv6Address` actuales del container.
2. Reemplazar —no acumular— los saltos `/32` hacia la cadena allowlist IPv4 y los `/128` hacia la
   cadena IPv6. Conservar `RELATED,ESTABLISHED`, destinos TCP/443 resueltos de los hosts autorizados y
   un `DROP` final.
3. Resolver nuevamente los A/AAAA de cada host autorizado y comparar el conjunto exacto con las
   reglas. Los CDN cambian; una regla vieja puede bloquear auth o dejar destinos obsoletos.
4. Probar auth/smoke contra un host permitido.
5. Probar un host no listado con `curl -4` y `curl -6`; ambos deben fallar. Un `curl` sin flag puede
   ocultar que IPv4 está bloqueado pero IPv6 continúa abierto.

Automatizar ese bloque con dos modos explícitos: `--apply` reemplaza reglas y `--check` sólo compara
container/DNS/reglas y hace probes. El handler de error de `--check` tampoco puede ejecutar
contención, stop o rollback. En un piloto real, un `catch` compartido convirtió un fallo de sintaxis
del probe en un stop involuntario del runner y obligó a reiniciar la ventana de observación.

Para el host de auth, comprobar que el código HTTP sea distinto de `000`; no usar `curl -f`. Un 401 o
403 demuestra DNS, ruta, TLS y respuesta del destino, aunque no sea una página pública exitosa.

Comprobación mínima, sin imprimir destinos ni credenciales:

```bash
C=<container>
docker inspect "$C" --format \
  '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{.GlobalIPv6Address}}{{"\n"}}{{end}}'

if timeout 8 docker exec "$C" curl -4 -fsS --max-time 5 https://example.com >/dev/null 2>&1; then
  echo 'NO-GO: IPv4 no listado accesible'; exit 1
fi
if timeout 8 docker exec "$C" curl -6 -fsS --max-time 5 https://example.com >/dev/null 2>&1; then
  echo 'NO-GO: IPv6 no listado accesible'; exit 1
fi
```

No persistir una IP de container en documentación ni asignar IP estática en la red global. Persistir
el procedimiento/hosts y regenerar las reglas a partir del estado efectivo.

En ÍTERA Lex R9, el procedimiento quedó versionado en
`.planning/build-week/scripts/configure-r9-runner-egress.sh --apply|--check`; usarlo en vez de copiar
comandos iptables desde el historial de shell.

Para una observación larga, no depender de `systemd-run` transitorio con `Restart=no`. Versionar una
unit de usuario con `Restart=on-failure`, habilitarla sólo durante la ventana y hacer que NO-GO/fin
normal salgan con código cero. Al cerrar, deshabilitar/detener la unit y conservar el template. Así
un crash del recolector reinicia sin convertir deliberadamente un rollback en un nuevo arranque.

## GitHub App, auto-deploy y builds largos

- Validar acceso al repo con la integracion elegida. Un 404 al clonar puede significar GitHub App
  equivocada, no repo inexistente. En el host Modern, `coolify-itera-lat` fue la integracion correcta;
  la integracion `modern` no podia leer `iteralat/itera-lex`.
- `coolify github repos <uuid>` en CLI 1.6.2 puede tratar un UUID como bigint y devolver HTML/500; no
  usar ese fallo como prueba de permisos. La prueba final es `git ls-remote`/clone del deploy.
- Desactivar auto-deploy antes de un push operacional que aun no debe salir. Verificar el setting
  releyendo Coolify y comprobar que no aparecio un deploy nuevo.
- Que un recurso trackee la rama pusheada no prueba que auto-deploy esté activo. Después de un push,
  consultar `app deployments list` y comparar UUID/commit antes de apagar o reconstruir por
  inferencia; en el runner R9 la rama coincidía pero no nació ningún deployment.
- Cancelar un deploy puede cambiar su estado a `cancelled` y aun devolver HTTP 500 (`Undefined variable
$application`). Verificar el estado y el container real antes de reintentar.
- `app stop` puede quedar queued o mostrar estado stale. La fuente final es `docker ps`/health del
  container en el servidor.
- `app start --instant-deploy` no es un simple start del container anterior: puede iniciar un build
  nuevo. Durante ese build `app get` llegó a mostrar `exited:unhealthy`; verificar
  `app deployments list` y esperar `finished` antes de declarar fallo o disparar otro deploy.
- Despues de un deploy `finished`, `app get` puede seguir mostrando el SHA anterior y
  `running:unknown`. Cruzar commit del deployment, tag de la imagen del container activo, env efectivo
  y HTTP; la metadata stale no demuestra que el switch haya fallado.
- Un build Next grande puede consumir ~7.6 GiB de RAM, llenar 4 GiB de swap y dejar CLI/SSH lentos. Si
  el helper, `docker build`/Buildx o los workers siguen activos, esperar: no disparar un segundo deploy.
  El container anterior sigue sirviendo hasta el switch saludable. Revisar `uptime`, `free -m`, helper,
  procesos de build y ultimo timestamp del log.
- Coolify puede quedar varios minutos sin log visible durante `COPY node_modules`, TypeScript o page
  data. Silencio no equivale a hang.
- El executor puede terminar `docker exec ... build.sh` con exit 255 despues de que Next completo
  compile/typecheck/static pages, sin OOM y con disco disponible. Confirmar kernel, Docker, espacio y
  que la imagen no llego a exportarse. Si fue un corte transitorio del canal remoto, hacer un solo retry
  sin `--force` para reutilizar cache; `--force` agrega `docker build --no-cache` y repite toda la carga.
- El warning generico sobre `NODE_ENV=production` en build-time no es fatal si el Dockerfile multi-stage
  instala dependencias del builder y la metadata final confirma un build correcto.

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

Las asignaciones anteriores no producen salida. Ejecutarlas con `set +x`; nunca anteponer `echo`,
volcar el JSON completo ni pegar el header expandido en logs o documentación.

## Diagnostico por sintomas

### Smoke Node por stdin falla antes de llamar al servicio

En Node 22, `node` leyendo stdin no puede decidir el formato si el mismo script mezcla `require()` y
`top-level await`; devuelve `ERR_AMBIGUOUS_MODULE_SYNTAX`. No diagnosticarlo como fallo de red o del
runner: envolver el harness CommonJS en `async function main()` o usar imports ESM consistentes.

### Timestamps productivos aparecen corridos tres horas

Prisma suele mapear `DateTime` a `timestamp without time zone`. Si el proceso tiene
`TZ=America/Argentina/Buenos_Aires`, `pg` puede reserializar el valor como `Date` agregando tres horas
aunque PostgreSQL tenga `TimeZone=UTC`. Para una ventana operacional, capturar el epoch/UTC del evento
y contrastar `current_setting('TimeZone')`, `now()` y `to_char(createdAt, ...)`; no copiar el ISO de un
objeto `Date` sin esa verificación.

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
