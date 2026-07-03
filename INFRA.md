# Infraestructura ITERA — Indice de Deploy

> Referencia centralizada de URLs, Coolify UUIDs, puertos, DBs y env vars por proyecto.
> Datos obtenidos via Coolify CLI (`coolify app list` + `coolify app env list`).
> Ultima actualizacion: 2026-06-04 (egress AR durable + autofill RN productivo en Hetzner).

> **Snapshot del audit 2026-05-22** (`reports/vps-health-audit-2026-05-22.md`):
> - Modern (`65.108.148.79`): 12 apps + 7 DBs PostgreSQL, todas healthy. No queda MySQL en este VPS.
> - Hallazgo P0 (MySQL 3306 público) **cerrado** al decomisionar `sistema-gestion-juridico-rer` + `itera-modern-mysql-databases`.
> - Pendientes P1: reboot + apt full-upgrade (kernel 6.8.0-71 vs 6.8.0-117 disponible), 430 zombies de Shopear (`t1ect6gnjp8068ccu7lah6n8`) por `next-server` sin reaper de hijos `ssl_client`, SSH con `PermitRootLogin yes` + `PasswordAuthentication yes`.

---

## Servidores

### itera-modern (proyectos ITERA)
| Campo | Valor |
|-------|-------|
| **IP** | 65.108.148.79 |
| **Hostname** | itera-modern |
| **Plan** | Hetzner CX32 (8 GB RAM, 76 GB disco) |
| **OS** | Ubuntu 24.04.3 LTS (kernel 6.8.0-71, reboot pendiente — ver audit 2026-05-22) |
| **Docker** | 27.0.3 (upgrade pendiente a 29.5.2) |
| **Coolify** | v4.0.0 |
| **Panel** | Coolify — https://coolify-modern.itera.world (también accesible vía `http://65.108.148.79:8000` para CLI) |
| **SSL** | Let's Encrypt via Traefik |
| **Network Docker** | `coolify` (`br-9543db3b28c1`, subnet `10.0.1.0/24`) |
| **Egress tunnel** | `10.0.1.1:18767` (reverse SSH desde el VPS AR `38.180.185.41` / `itera-egress`, solo accesible desde el bridge `coolify`; **NO** exponer el bind a `0.0.0.0`) |
| **Scheduler RN Tools** | systemd de host en Hetzner: wrapper `/opt/itera-rio-negro-autofill/run.sh`, timers `itera-rio-negro-autofill-canary.timer` y `itera-rio-negro-recientes-diario.timer`; ejecuta el runner dentro del contenedor API y llama `http://127.0.0.1:8000`, no Cloudflare |

### itera-alquimica (proyectos Alquimica/Bambu)
| Campo | Valor |
|-------|-------|
| **IP** | 89.167.29.201 |
| **Panel** | Coolify — https://coolify-alquimica.itera.world |

### itera-static (sitios estaticos, WordPress, servicios internos)
| Campo | Valor |
|-------|-------|
| **IP** | 37.27.248.173 |
| **Plan** | Hetzner CX23 (4 GB RAM, 40 GB disco) |
| **OS** | Ubuntu 24.04 LTS |
| **Panel** | Coolify — https://coolify-static.itera.world |

### itera-egress (VPS AR — egress worker, sin Coolify)
| Campo | Valor |
|-------|-------|
| **IP** | 38.180.185.41 |
| **Proveedor** | is\*hosting (Buenos Aires, AR) — VPS #419614, AS58061 Scalaxy B.V. |
| **OS** | Ubuntu 24.04.4 LTS |
| **SSH** | alias `itera-egress` (root) / `itera-egress-ops` (iteraops, sudo) — `~/.ssh/id_ed25519` |
| **Rol** | Worker FastAPI del egress jurisprudencial (SAIJ/RAULI/PJ Río Negro/PUMA) en `127.0.0.1:8765`, expuesto a Hetzner por reverse SSH tunnel `10.0.1.1:18767`. Reemplazó a la PC del dev (cutover 2026-06-02). |
| **Servicios** | systemd user `itera-egress-worker.service` + `itera-egress-tunnel.service` (enabled/active, linger on) |
| **Hardening** | UFW (inbound solo `22/tcp`) + fail2ban (jail sshd). Worker solo en loopback. |
| **Docs** | `itera-lex-tools/egress/README.md`, `egress/docs/runbooks/`, `egress/docs/production-hardening-checklist.md`. Inventario completo: `itera-context/infra/vps-overview.md` (VPS 4). |

---

## Proyectos Deployados — Contexto Modern

### itera-lex
| Campo | Valor |
|-------|-------|
| **URL app** | https://app.iteralex.com |
| **URL marketing** | https://iteralex.com |
| **Puerto dev** | 3000 |
| **Coolify UUID app** | `r40kockgo40wowg4w84soc4s` |
| **Coolify UUID PG** | `jcsokwcw0ks08k8wwwk4wwc0` |
| **Notas** | Multi-dominio via `src/proxy.ts`. También: www.iteralex.com |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| BETTER_AUTH_URL | URL base para auth (app.iteralex.com) |
| BETTER_AUTH_SECRET | Firma de sesiones |
| BETTER_AUTH_TRUSTED_ORIGINS | Origenes permitidos (marketing + app) |
| NEXT_PUBLIC_APP_URL | URL de la app (client-side) |
| NEXT_PUBLIC_MARKETING_URL | URL del sitio marketing |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | Google Analytics |
| SUPERADMIN_EMAIL | Email del superadmin para seed |
| SUPERADMIN_PASSWORD | Password del superadmin para seed |
| SUPERADMIN_NAME | Nombre del superadmin |
| ADMIN_SEED_SECRET | Secret para ejecutar seed via API |
| GOOGLE_CLIENT_ID | OAuth Google (Calendar sync) |
| GOOGLE_CLIENT_SECRET | OAuth Google (Calendar sync) |
| GOOGLE_GENERATIVE_AI_API_KEY | Gemini API para Copilot |
| ELEVENLABS_API_KEY | TTS/STT para transcripciones |
| R2_ACCOUNT_ID | Cloudflare R2 storage |
| R2_ACCESS_KEY_ID | R2 auth |
| R2_SECRET_ACCESS_KEY | R2 auth |
| R2_BUCKET_NAME | R2 bucket |
| AUDIO_STORAGE_PATH | Path local para audio temporal |
| CRON_SECRET | Auth para cron jobs |
| DEMO_USER_EMAIL | Credenciales demo para testing |
| DEMO_USER_PASSWORD | Credenciales demo para testing |
| ADMIN_RECLASSIFY_SECRET | Secret para reclasificacion admin |
| NODE_ENV | production |

---

### itera-lex-docs
| Campo | Valor |
|-------|-------|
| **URL** | https://docs.iteralex.com |
| **Puerto dev** | 3011 |
| **DB** | Sin DB (Nextra estatico) |
| **Coolify UUID app** | `c4gg5eujjvpbgelqlgurdnoe` |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| NODE_ENV | production |

---

### itera-estudio
| Campo | Valor |
|-------|-------|
| **URL** | https://app.iteraestudio.com |
| **Puerto dev** | 3002 |
| **Coolify UUID app** | `z80g004g4o40cw4wog0kcccg` |
| **Coolify UUID PG** | `m84wg4kggsgksssg8k0wc000` |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| BETTER_AUTH_SECRET | Firma de sesiones |
| BETTER_AUTH_URL | URL base para auth |
| R2_ACCOUNT_ID | Cloudflare R2 storage |
| R2_ACCESS_KEY_ID | R2 auth |
| R2_SECRET_ACCESS_KEY | R2 auth |
| R2_BUCKET_NAME | R2 bucket |
| R2_PUBLIC_URL | URL publica de assets |
| GOOGLE_CLIENT_ID | OAuth Google |
| GOOGLE_CLIENT_SECRET | OAuth Google |
| GEMINI_API_KEY | Gemini API para generacion de imagenes |
| ADMIN_EMAIL | Email admin seed |
| ADMIN_PASSWORD | Password admin seed |
| ITERA_API_KEY | API key interna ITERA |
| NODE_ENV | production |

---

### itera-lat
| Campo | Valor |
|-------|-------|
| **URL** | https://itera.lat (+ www.itera.lat) |
| **Puerto dev** | 3005 |
| **DB** | Sin DB |
| **Coolify UUID app** | `rtwcc35tbzzgfx3dp2hduod2` |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| NEXT_PUBLIC_SITE_URL | URL del sitio |
| NEXT_PUBLIC_GA_ID | Google Analytics |

---

### abundancia-hogar
| Campo | Valor |
|-------|-------|
| **URL** | https://abundanciahogar.com.ar |
| **Puerto dev** | 3000 |
| **Coolify UUID app** | `bx5hhe24qkxm8a5bklltok5b` |
| **Coolify UUID PG** | `qvyp1mdigluu25eu1aekpsho` |
| **Notas** | Cloudflare proxy naranja en dominio |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| BETTER_AUTH_SECRET | Firma de sesiones |
| BETTER_AUTH_URL | URL base para auth |
| CF_R2_ACCOUNT_ID | Cloudflare R2 storage |
| CF_R2_ACCESS_KEY_ID | R2 auth |
| CF_R2_SECRET_ACCESS_KEY | R2 auth |
| CF_R2_BUCKET_NAME | R2 bucket |
| CF_R2_PUBLIC_URL | URL publica de assets |
| ADMIN_EMAIL | Email admin seed |
| ADMIN_PASSWORD | Password admin seed |
| NODE_ENV | production |

---

### itera-lex-tools-api
| Campo | Valor |
|-------|-------|
| **URL** | https://api.iteralex.com |
| **Coolify UUID app** | `d0osocwkwc8gkcw88gww4ck4` |
| **Coolify UUID PG** | `cvc8gi5ws0c5gff9r574gy0g` (itera-lex-tools-postgresql, dedicado al cache jurisprudencial) |
| **Git branch** | main |
| **Status** | running:healthy |
| **Stack** | Python 3.11 + FastAPI + SQLite WAL (valores) + PostgreSQL 17 (cache jurisprudencia) |
| **Repo local** | `/home/pachu/projects/saas/iteralex/itera-lex-tools/api/` |
| **Notas** | Backend de ÍTERA Lex Tools: valores jurídicos, jurisprudencia SAIJ, PJ Río Negro, PJ Neuquén RAULI. Egress vía worker en el **VPS AR `38.180.185.41`** (is\*hosting, alias `itera-egress`) expuesto por reverse SSH tunnel `10.0.1.1:18767`; la PC del dev ya **no** es dependencia productiva (cutover 2026-06-02). Autofill productivo RN `fallos/stj` activo desde 2026-06-04 con systemd de host Hetzner: `/opt/itera-rio-negro-autofill/run.sh` ejecuta el runner dentro del contenedor API y llama `http://127.0.0.1:8000`; Cloudflare bloqueó la vía cron externa con `1010`, por eso el scheduler vigente es interno al host. Topología + runbooks: `itera-lex-tools/egress/README.md`, `egress/docs/runbooks/` y `api/docs/integrations/rio-negro/autofill-cron-runbook.md`. |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| ADMIN_TOKEN | Auth para admin endpoints |
| CORS_ORIGINS | Origenes permitidos (`https://app.iteralex.com,https://iteralex.com`) |
| REFRESH_INTERVAL_HOURS | Intervalo de refresh de valores jurídicos |
| STALE_AFTER_HOURS | Tiempo hasta considerar valores stale |
| JURIS_DATABASE_URL | PostgreSQL cache jurisprudencia (`postgresql://itera_lex_tools:...@cvc8gi5ws0c5gff9r574gy0g:5432/itera_lex_tools`) |
| EGRESS_MODE | `worker` |
| EGRESS_WORKER_BASE_URL | `http://10.0.1.1:18767` (tunnel al worker en el VPS AR `38.180.185.41`) |
| EGRESS_WORKER_TIMEOUT | `20.0` |
| EGRESS_WORKER_TOKEN | Bearer compartido con el worker del VPS AR (rotado 2026-06-03; rotación: `egress/docs/runbooks/rotate-egress-worker-token.md`) |

**Jobs productivos RN en Hetzner:**

| Unidad | Proposito | Cadencia |
|--------|-----------|----------|
| `itera-rio-negro-autofill-canary.timer` | Backfill gradual `fallos/stj`, límites `max_paginas=1`, `page_limit=10`, `delay_ms=1200` | cada 10 minutos durante la canary inicial |
| `itera-rio-negro-autofill-canary-stop.timer` | Apaga la canary automáticamente | una vez, 2 horas después de activación |
| `itera-rio-negro-recientes-diario.timer` | Ingesta diaria de recientes `fallos/stj` con límites bajos | 08:10 Argentina |

Operación: `ssh itera-hetzner 'systemctl list-timers --all "itera-rio-negro-*.timer" --no-pager'`.
No imprimir `ADMIN_TOKEN` ni envs completas; reportar sólo presencia/ausencia de variables.

---

### itera-lex-tools-web
| Campo | Valor |
|-------|-------|
| **URL** | https://herramientas.iteralex.com |
| **Puerto dev** | 3020 |
| **Coolify UUID app** | `rmfj4cm2d1e328s34f0f09eh` |
| **Git branch** | master |
| **Status** | running:healthy |
| **Stack** | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui |
| **Repo local** | `/home/pachu/projects/saas/iteralex/itera-lex-tools/web/` |
| **Notas** | Frontend público de ÍTERA Lex Tools. Sin DB, sin auth en MVP. Tokens visuales clonados del SaaS `iteralex`. |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| NEXT_PUBLIC_API_URL | URL del backend (`https://api.iteralex.com`) |
| NODE_ENV | production |

---

### racca-web
| Campo | Valor |
|-------|-------|
| **URL** | https://raccaestudiopenal.com |
| **Coolify UUID app** | `k119747l80uslvruti9h3kxm` |
| **Git branch** | main |
| **Status** | running |
| **Stack** | Next.js (sitio institucional) |
| **Notas** | Sitio institucional del Dr. Rodrigo Racca, abogado penalista de General Roca. Cliente ITERA. Sin DB. |

---

### shopear (shope.ar)
| Campo | Valor |
|-------|-------|
| **URL** | https://shope.ar |
| **Dominios adicionales** | admin.shope.ar, apple.shope.ar, ropaurbana.shope.ar |
| **Puerto dev** | 3000 |
| **Coolify UUID app** | `t1ect6gnjp8068ccu7lah6n8` |
| **Coolify UUID PG** | `uxoszayiqygjp8rib3kdddvg` |
| **Git branch** | main |
| **Notas** | SaaS multi-tenant de e-commerce. Subdominios por tenant. |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| BETTER_AUTH_SECRET | Firma de sesiones |
| BETTER_AUTH_URL | URL base para auth |
| NEXT_PUBLIC_SITE_URL | URL del sitio (client-side) |
| ADMIN_SEED_SECRET | Secret para ejecutar seed via API |
| ADMIN_EMAIL | Email admin seed |
| ADMIN_PASSWORD | Password admin seed |
| NODE_ENV | production |

---

### presskit-ar
| Campo | Valor |
|-------|-------|
| **URL** | https://presskit.ar |
| **Puerto dev** | 3000 |
| **Coolify UUID app** | `w65hufobtzbem2fjxp9jpdyg` |
| **Coolify UUID PG** | `sbs5tj7872hl82u51niqbtp2` |
| **Git branch** | main |
| **Notas** | SaaS press kits. Auth.js v5. Re-deployado (antes perdido en migracion cPanel). |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| AUTH_SECRET | NextAuth secret |
| AUTH_TRUST_HOST | Trust host para proxy |
| APP_URL | URL base de la app |
| NEXT_PUBLIC_APP_URL | URL base client-side |
| NEXTAUTH_URL | NextAuth URL |
| STORAGE_PROVIDER | Proveedor de storage |
| AUTH_REQUIRE_EMAIL_VERIFICATION | Verificacion de email requerida |
| NODE_ENV | production |

---

### ~~sistema-gestion-juridico-rer~~ (decomisionado 2026-05-22)
- **Estado**: app + DB MySQL + DNS borrados.
- **Backup**: `backups/rer-mysql-2026-05-22/` (dump SQL completo + TSVs + reporte de info útil rescatada).
- **Reporte**: `reports/rer-estudio-juridico-informacion-util-2026-05-22.md`.
- **Razón**: legacy de Rise CRM, clientes ya migrados a iteralex; cerraba el P0 del audit (MySQL 3306 expuesto al mundo).

---

### pachu.dev
| Campo | Valor |
|-------|-------|
| **URL** | https://pachu.dev |
| **Coolify UUID app** | `agwnkzpg1rnh6z38su743nzw` |
| **Notas** | Landing page personal, HTML estatico |

---

### Databases — Contexto Modern

Datos vivos al 2026-05-22 vía `coolify database list --format json`. Todas con `is_public: false` (no expuestas al mundo). Los `public_port` listados son los configurados internamente, no bound al host.

| # | Nombre | UUID | Imagen | Estado | Public port | Usado por |
|---|--------|------|--------|--------|-------------|-----------|
| 1 | iteralex-db | `jcsokwcw0ks08k8wwwk4wwc0` | postgres:17-alpine | running:healthy | — | `iteralex` (SaaS principal) |
| 2 | itera-lex-tools-postgresql | `cvc8gi5ws0c5gff9r574gy0g` | postgres:17-alpine | running:healthy | — | `itera-lex-tools-api` (cache jurisprudencia) |
| 3 | ITERA Estudio - PostgreSQL | `m84wg4kggsgksssg8k0wc000` | postgres:17-alpine | running:healthy | — | `itera-estudio` |
| 4 | Abundancia Hogar - PostgreSQL | `qvyp1mdigluu25eu1aekpsho` | postgres:17-alpine | running:healthy | — | `abundancia-hogar` |
| 5 | presskit-ar-db | `sbs5tj7872hl82u51niqbtp2` | postgres:17-alpine | running:healthy | — | `presskit-ar` |
| 6 | Shopear - PostgreSQL | `uxoszayiqygjp8rib3kdddvg` | postgres:17-alpine | running:healthy | 55432 | `shopear` |
| 7 | Linkea2 - PostgreSQL | `wn5vq32bwbgdpfkamb72ajce` | postgres:17-alpine | running:healthy | 5433 | `linkea2` |

> El recurso histórico `itera-modern-mysql-databases` (`fow0gsgw4cgksogc40ogsg4o`, mysql:8) fue **decomisionado el 2026-05-22**. Era usado solo por `sistema-gestion-juridico-rer` (ya borrado) y dejaba el puerto `3306` expuesto al mundo por el bypass de UFW que hace Docker. Backup en `backups/rer-mysql-2026-05-22/`.

---

### linkea2
| Campo | Valor |
|-------|-------|
| **URL** | https://linkea2.com |
| **Puerto dev** | 3004 |
| **Coolify UUID project** | `lstok8fm8cthrc908uwgaeg9` |
| **Coolify UUID env** | `uc90crxpv85wecxuktjcnxuo` (production) |
| **Coolify UUID app** | `h13u60btnluekuesd7gsr469` |
| **Coolify UUID PG** | `wn5vq32bwbgdpfkamb72ajce` (postgres:17-alpine, db=`linkea2`) |
| **Repo** | `iteralat/linkea2` branch `master` |
| **GitHub App** | `a4skko8o44osocskcossgogs` (coolify-itera-lat) |
| **Notas** | SaaS multi-tenant link-in-bio con routing path-based `linkea2.com/[slug]`. Raiz `/` es placeholder con boton a login. `TenantDomain` queda dormido (feature enterprise futura). Post-deploy: `npm install prisma --no-save && npx prisma db push`. Seed de main + platform admin corre manual via `/api/admin/seed` o script. |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL interna (postgres://postgres:...@UUID:5432/linkea2) |
| NODE_ENV | production |
| BETTER_AUTH_SECRET | Firma de sesiones (32 chars random) |
| BETTER_AUTH_URL | `https://linkea2.com` |
| NEXT_PUBLIC_SITE_URL | `https://linkea2.com` (se embebe client-side en build; requiere build-arg en Docker) |
| DEFAULT_TENANT_SLUG | `main` (tenant fallback para desarrollo; en prod NO hay fallback por host, resuelve por slug del path) |
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL | Cloudflare R2 (bucket `itera-shop-all` compartido ecosistema ITERA) |
| ADMIN_EMAIL | `admin@linkea2.com` (platform admin del SaaS) |
| ADMIN_PASSWORD | Password del platform admin (usar `--is-literal` en coolify CLI si tiene chars especiales) |
| ITERA_API_KEY | Bearer token para generacion de banners via `app.iteraestudio.com/api/v1/generate` |
| CRON_SECRET | Bearer token para `/api/cron/process-emails` |

---

## Proyectos Deployados — Contexto Alquimica

### alquimica-crm (Bambu CRM v2)
| Campo | Valor |
|-------|-------|
| **URL** | https://gestion.quimicabambu.com.ar |
| **Puerto dev** | 8000 |
| **Coolify UUID app** | `jkow84swcog8g8owoosow4ow` |
| **Coolify UUID PG** | `uw4008o04gsogcc040csko8s` |
| **Coolify UUID Redis** | `fow8cs84sccc4c0g4k8s84gs` |
| **Git branch** | master |
| **Stack** | Laravel 12 · Inertia · React · PG17 · Redis 7.2 |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| APP_NAME | Nombre de la app |
| APP_ENV | Entorno (production) |
| APP_DEBUG | Debug mode |
| APP_URL | URL base |
| APP_KEY | Encryption key Laravel |
| DB_CONNECTION / DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD | Conexion PostgreSQL |
| SESSION_DRIVER / SESSION_LIFETIME / SESSION_ENCRYPT | Sesiones (Redis) |
| CACHE_STORE / CACHE_DRIVER | Cache (Redis) |
| QUEUE_CONNECTION | Cola de jobs (Redis) |
| REDIS_CLIENT / REDIS_URL | Conexion Redis |
| LOG_CHANNEL / LOG_LEVEL | Logging |
| NIXPACKS_NODE_VERSION | Version de Node para build |
| NIXPACKS_PHP_FALLBACK_PATH / NIXPACKS_PHP_ROOT_DIR | Config PHP Nixpacks |
| ASSET_URL | URL de assets |
| TRUSTED_PROXIES | Proxies confiables (Traefik) |
| FORCE_HTTPS | Forzar HTTPS |

---

### alquimica-crm-staging
| Campo | Valor |
|-------|-------|
| **URL** | http://zkokokgkk8gccoowo0g08ggg.89.167.29.201.sslip.io |
| **Coolify UUID app** | `zkokokgkk8gccoowo0g08ggg` |
| **Git branch** | `feat/migracion-ds-produccion` (verificado live 2026-06-30) |
| **Stack** | Laravel 12 · Dockerfile (misma base que CRM prod) |
| **Notas** | Entorno de staging/testing. Comparte PostgreSQL `uw4008o04gsogcc040csko8s` y Redis `fow8cs84sccc4c0g4k8s84gs` con produccion; no es sandbox de datos. Mismas env vars que produccion pero con APP_ENV=staging |

**Env vars:** Mismas keys que alquimica-crm produccion (sin NIXPACKS_PHP_*, ASSET_URL, SESSION_LIFETIME, SESSION_ENCRYPT).

---

### bambu-crm-v1-legacy
| Campo | Valor |
|-------|-------|
| **URL** | https://legacy-gestion.quimicabambu.com.ar |
| **Coolify UUID app** | `vgkgw8ookwok8ooos88o440g` |
| **Coolify UUID PG** | `i480gg840o4sk0csk8o000o4` |
| **Git branch** | master |
| **Notas** | Version legacy del CRM. Se mantiene activa mientras v2 entra en produccion completa. |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| APP_KEY / APP_URL | Config Laravel basica |
| DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD | Conexion PostgreSQL |

---

### bambu-web-corporativa-catalogo
| Campo | Valor |
|-------|-------|
| **URL** | https://bambuoficial.com.ar |
| **Puerto dev** | 3009 |
| **Coolify UUID app** | `kwokswcoc0848oo4k0408gk0` |
| **Coolify UUID PG** | `sssoc4oksk0048gwc8wgs808` |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| BETTER_AUTH_SECRET | Firma de sesiones |
| BETTER_AUTH_URL | URL base para auth |
| SEED_ADMIN_EMAIL | Email admin seed |
| SEED_ADMIN_PASSWORD | Password admin seed |
| SITE_URL | URL del sitio |
| NEXT_PUBLIC_GA_ID | Google Analytics |
| R2_ACCOUNT_ID | Cloudflare R2 storage |
| R2_ACCESS_KEY_ID | R2 auth |
| R2_SECRET_ACCESS_KEY | R2 auth |
| R2_BUCKET_NAME | R2 bucket |
| R2_PREFIX | Prefijo de archivos en R2 |
| R2_PUBLIC_URL | URL publica de assets |
| R2_PUBLIC_HOSTNAME | Hostname publico R2 |
| STORAGE_PROVIDER | Proveedor de storage (r2) |
| NODE_ENV | production |

---

### alquimica-hub
| Campo | Valor |
|-------|-------|
| **URL** | https://canal.alquimicaoficial.com.ar |
| **Puerto dev** | 3003 |
| **Coolify UUID app** | `nk8044wkokgs84o040sk4wg4` |
| **Coolify UUID PG** | `boccgcockk48k4sgg00soc44` (puerto publico: 5433) |

**Env vars:**
| Variable | Proposito |
|----------|-----------|
| DATABASE_URL | Conexion PostgreSQL |
| AUTH_SECRET | NextAuth secret |
| AUTH_URL | NextAuth URL |
| ADMIN_EMAIL | Email admin seed |
| ADMIN_PASSWORD | Password admin seed |
| R2_ACCOUNT_ID | Cloudflare R2 storage |
| R2_ACCESS_KEY_ID | R2 auth |
| R2_SECRET_ACCESS_KEY | R2 auth |
| R2_BUCKET_NAME | R2 bucket |
| R2_PUBLIC_URL | URL publica de assets |
| NEXT_PUBLIC_BASE_URL | URL base client-side |
| NEXT_PUBLIC_GA_ID | Google Analytics |
| NIXPACKS_NODE_VERSION | Version de Node para build |
| NODE_ENV | production |

---

### alquimicaoficial-static-site
| Campo | Valor |
|-------|-------|
| **URL** | http://cw8c8g80os48wso488kwcgg0.89.167.29.201.sslip.io |
| **Coolify UUID app** | `cw8c8g80os48wso488kwcgg0` |
| **Git branch** | main |
| **Notas** | Placeholder viejo. El CMS custom de Alquimica aun no esta deployado. Candidato a eliminar/reemplazar. Sin env vars. |

---

### bambuoficial-static (inactivo)
| Campo | Valor |
|-------|-------|
| **URL** | http://c4swcokwsk8w4cook00wwo40.89.167.29.201.sslip.io |
| **Coolify UUID app** | `c4swcokwsk8w4cook00wwo40` |
| **Status** | exited:unhealthy |
| **Notas** | Sitio estatico anterior de Bambu. Reemplazado por bambu-web-corporativa. Sin env vars. Candidato a eliminar. |

---

### quimicabambu-redirecter
| Campo | Valor |
|-------|-------|
| **URL** | http://ewwc4swo8sk0o8wk0s448o0c.89.167.29.201.sslip.io |
| **Coolify UUID app** | `ewwc4swo8sk0o8wk0s448o0c` |
| **Git branch** | main |
| **Notas** | Redirector estatico para quimicabambu.com.ar. Sin env vars. |

---

### Databases — Contexto Alquimica

| # | Nombre | UUID | Imagen | Estado | Puerto publico |
|---|--------|------|--------|--------|---------------|
| 1 | bambu-crm-v1-db | `i480gg840o4sk0csk8o000o4` | postgres:17-alpine | running:healthy | — |
| 2 | alquimica-hub-db | `boccgcockk48k4sgg00soc44` | postgres:17-alpine | running:healthy | 5433 |
| 3 | alquimica-crm-db | `uw4008o04gsogcc040csko8s` | postgres:17-alpine | running:healthy | — |
| 4 | alquimica-redis | `fow8cs84sccc4c0g4k8s84gs` | redis:7.2 | running:healthy | — |
| 5 | Bambu Web - PostgreSQL | `sssoc4oksk0048gwc8wgs808` | postgres:17-alpine | running:healthy | — |

---

## Proyectos Deployados — Contexto Static

### ltgrow-static-site
| Campo | Valor |
|-------|-------|
| **URL** | http://tcc80k488wskwk4cg4c0oggk.37.27.248.173.sslip.io |
| **Coolify UUID app** | `tcc80k488wskwk4cg4c0oggk` |
| **Git branch** | main |
| **Notas** | Sitio estatico LTGrow. Sin dominio custom (ltgrow.com redirige a IG). |

---

### rer-static-website
| Campo | Valor |
|-------|-------|
| **URL** | http://nooow8084sk0c0444c8gs8kc.37.27.248.173.sslip.io |
| **Coolify UUID app** | `nooow8084sk0c0444c8gs8kc` |
| **Git branch** | master |
| **Notas** | Sitio estatico de RER Estudio Juridico. Sin dominio custom asignado en Coolify. |

---

### angeloditommaso-static-site
| Campo | Valor |
|-------|-------|
| **URL** | http://q8o8cgsw0ogg0sgc40w8k4c4.37.27.248.173.sslip.io |
| **Coolify UUID app** | `q8o8cgsw0ogg0sgc40w8k4c4` |
| **Git branch** | master |
| **Notas** | Sitio estatico angeloditommaso.com. Dominio expira Aug 2026 — pendiente decidir si renovar. |

---

### nahuebianchi-static-site
| Campo | Valor |
|-------|-------|
| **URL** | new.nahuebianchi.com |
| **Coolify UUID app** | `v8ksgs448ckwo40wc08sw4cg` |
| **Git branch** | main |
| **Notas** | Presskit Nahue Bianchi. |

---

### Servicios — Contexto Static

| # | Nombre | UUID | Tipo | Estado |
|---|--------|------|------|--------|
| 1 | itera-phpmyadmin | `z4wckk8k804gcwkc8sc4g0s4` | phpmyadmin | running:healthy |
| 2 | Vaultwarden | `xsc8c0w8sc8g0g0oowcoocsw` | vaultwarden | running:healthy |
| 3 | RER Blog Juridico | `cswck8sg0o4gs4cw0gc4kcs8` | wordpress | running:healthy |
| 4 | Blog LTGrow | `ksok04kc0kw0wco4koww4c00` | wordpress | running:healthy |

### Databases — Contexto Static

| # | Nombre | UUID | Imagen | Estado |
|---|--------|------|--------|--------|
| 1 | itera-databases-mysql | `hkgokskk04socsok0kk8osw4` | mysql:8 | running:healthy |

**Nota:** MySQL compartido por todas las instancias WordPress y phpMyAdmin.

---

## Proyectos No Deployados

| Proyecto | Puerto dev | DB | Estado |
|----------|-----------|-----|--------|
| itera-chatbots-platform | 3006 | `chatbot` | Deploy planeado Fase 7 |
| itera-pages | — | Sin DB | En desarrollo |
| itera-tube | 3004 | `iteratube` | Sin deploy (local only) |
| itera-yt-downloader | 3000 | — | Sin planning de deploy |
| wsp-facil | 3007 | — | Deploy planeado Sprint 3 |

---

## Hallazgos: Env Vars por Grupo de Afinidad

### Grupo 1 — SaaS con IA (itera-lex vs itera-estudio)

| Variable | itera-lex | itera-estudio | Nota |
|----------|-----------|---------------|------|
| BETTER_AUTH_* | 3 vars | 2 vars | lex tiene TRUSTED_ORIGINS (multi-dominio) |
| R2_* | 4 vars (sin prefix) | 5 vars (con PUBLIC_URL) | lex no tiene R2_PUBLIC_URL |
| GOOGLE_* | CLIENT_ID + SECRET | CLIENT_ID + SECRET | Iguales |
| AI | GOOGLE_GENERATIVE_AI_API_KEY + ELEVENLABS | GEMINI_API_KEY | Naming distinto para la misma API de Gemini |
| Admin seed | SUPERADMIN_* (3) | ADMIN_* (2) | Naming inconsistente |

### Grupo 2 — Web + Catalogo (abundancia-hogar vs bambu)

| Variable | abundancia-hogar | bambu | Nota |
|----------|-----------------|-------|------|
| R2_* | CF_R2_* (5 vars) | R2_* (7 vars) | **Prefijo inconsistente**: CF_R2 vs R2 |
| Admin seed | ADMIN_* | SEED_ADMIN_* | Naming inconsistente |
| SITE_URL | no tiene | SITE_URL | abundancia-hogar no tiene URL del sitio en env |
| GA | no tiene | NEXT_PUBLIC_GA_ID | abundancia-hogar sin analytics |

---

## Coolify CLI

Instalado en ambas maquinas Linux Mint. Binario en `/usr/local/bin/coolify` (v1.6.1). Usar `coolify context use <nombre>` antes de operar, o pasar `--context <nombre>` por comando. El contexto default actual es `modern-linux-desktop`.

| Contexto | FQDN | VPS |
|----------|------|-----|
| `modern-linux-desktop` | `http://65.108.148.79:8000` | 65.108.148.79 |
| `alquimica-linux-desktop` | `http://89.167.29.201:8000` | 89.167.29.201 |
| `static-linux-desktop` | `http://37.27.248.173:8000` | 37.27.248.173 |
| `cloud` | `https://app.coolify.io` | (cloud Coolify, no usado) |

**Comandos frecuentes:**
```bash
coolify app list                                # listar apps
coolify app get <uuid>                          # detalle de una app
coolify app env list <uuid>                     # env vars (keys only)
coolify app env list <uuid> -s                  # env vars con valores
coolify app env create <uuid> --key X --value Y [--build-time|--runtime] [--is-literal]
coolify app env update <uuid> <key|env-uuid> --value Y
coolify app env delete <uuid> <env-uuid> --force
coolify app logs <uuid>                         # logs de la app
coolify deploy uuid <uuid> [--force]            # redeploy (top-level, no `app redeploy`)
coolify app restart <uuid>                      # restart sin rebuild
coolify app delete <uuid> --force               # eliminar app (no es reversible)
coolify database list [--format json]           # listar DBs
coolify database delete <uuid>                  # eliminar DB (pide confirmación, pasar `echo y |` para skip)
```

**Notas:**
- Todos los deploys usan auto-deploy via GitHub App (`coolify-itera-modern`).
- Post-deployment command estandar para proyectos con Prisma: `npx prisma db push`.
- itera-tube no aparece en ningún contexto Coolify — nunca fue deployado.
- Valores con `=`, `$` u otros caracteres especiales (passwords, tokens base64) → usar `--is-literal` para evitar interpolación + 422 Validation.
