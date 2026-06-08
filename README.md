# itera-core

Sistema de productividad para proyectos Next.js con Claude Code. Contiene el template curado para iniciar proyectos y las instrucciones de configuracion del entorno.

## Estructura

```
.
├── _template/              # Template listo para copiar a un proyecto nuevo
│   ├── CLAUDE.md           # Reglas del proyecto (tier Full SaaS)
│   ├── CLAUDE-simple.md    # Reglas del proyecto (tier Simple)
│   ├── KICKSTART.md        # Guia interactiva de inicio de proyecto
│   ├── .claude/
│   │   ├── commands/       # Slash commands para Claude Code
│   │   │   ├── load.md             # /load — carga contexto al inicio de sesion
│   │   │   ├── save.md             # /save — guarda estado + changelog + commit
│   │   │   ├── check.md            # /check — auditoria de calidad adaptativa
│   │   │   ├── commit.md           # /commit — commit intermedio durante la sesion
│   │   │   ├── kickstart-nextjs.md # /kickstart-nextjs — setup interactivo del proyecto
│   │   │   ├── cleanup-boilerplate.md  # limpieza post-boilerplate
│   │   │   ├── security-audit.md       # auditoria de seguridad
│   │   │   └── operational-audit.md    # auditoria operacional
│   │   └── agents/
│   │       └── doc-changelog.md    # Agente Haiku para documentar cambios
│   ├── scripts/            # Scripts de enforcement automatico
│   │   ├── check-all.sh           # Ejecuta todos los checks
│   │   ├── check-scaffold.sh      # Verifica archivos scaffold
│   │   ├── check-findmany-take.sh # Detecta findMany sin take
│   │   ├── check-upload-validation.sh  # Verifica MIME/size en uploads
│   │   ├── check-auth-guards.sh   # Auth en API routes admin
│   │   └── check-page-metadata.sh # Metadata en pages publicas
│   └── .planning/          # Documentacion viva del proyecto
│       ├── STATE.md                # Estado actual (se sobreescribe cada /save)
│       ├── CHANGELOG.md            # Historial acumulativo
│       ├── PROJECT.md              # Definicion del proyecto
│       ├── CODEBASE-MAP.md         # Indice de donde esta cada pieza
│       └── FEATURE-CHANGELOG.md    # Features de usuario por modulo
│
├── PROJECT-MAP.md          # Mapa de proyectos por capas y grupos de afinidad
├── TOOLING-STANDARD.md     # Contrato canonico de scripts y tooling cross-repo
├── INFRA.md                # Indice de deploy (Coolify UUIDs, URLs, puertos, DBs)
├── E2E-TESTING-GUIDE.md    # Guia de testing E2E con Playwright (setup, patrones, workflow IA)
├── guides/                 # Metodos canonicos cross-repo (DB ops: carriles 1/2/3)
│   ├── seed-via-api.md         # Carril 1 — seed / reset / provision via API
│   ├── db-via-tunnel.md        # Carril 2 — query / pg_dump / restore via SSH tunnel
│   └── db-schema-rollout.md    # Carril 3 — schema rollout manual (DDL / indices / enums)
├── reference_brevo_smtp.md             # Guia de integracion Brevo SMTP (metodo: COMO)
├── reference_brevo_usage_inventory.md  # Inventario de uso Brevo (source-of-truth: QUE proyectos)
├── reference_itera_image_api.md        # API interna del generador de imagenes
├── modelo prompt.txt       # Prompt modelo para iniciar un proyecto
├── INFO.txt                # Descripcion general del sistema
└── .planning/              # Planning interno de este repo
```

## Como usar

### Iniciar un proyecto nuevo

1. Crear el proyecto Next.js:

```bash
# Linux (laptop)
pnpm create next-app ~/projects/mi-proyecto \
  --yes --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm

# Windows (desktop)
pnpm create next-app "C:/ALL MY PROJECTS/nextjs/mi-proyecto" \
  --yes --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm
```

2. Copiar el contenido de `_template/` al proyecto creado (`.claude/`, `.planning/`, `CLAUDE.md`).

3. Abrir Claude Code en la carpeta del proyecto y usar el prompt de `modelo prompt.txt` o ejecutar `/kickstart-nextjs`.

### Flujo de trabajo en sesion

```
/load    →  Lee STATE.md → resume contexto → trabaja
/check   →  Detecta que cambio → ejecuta checks relevantes → reporte
/save    →  /check → errores → seccion Guardrails del CLAUDE.md → STATE → CHANGELOG → commit
/commit  →  Commit intermedio sin guardar estado completo
```

### Scripts de enforcement

Los scripts en `scripts/` automatizan verificaciones que antes dependían de recordar reglas del CLAUDE.md:

```bash
pnpm quality:check    # Ejecuta todos los checks
bash scripts/check-all.sh  # Alternativa directa
```

Cada script es independiente y puede ejecutarse solo. Se integran con `/check` y `/save`.

### Registro de errores (flujo de 1 nivel)

Los errores recurrentes o no-triviales detectados en la sesion se destilan a UNA linea preventiva concisa (que / por que / cuando) en la seccion **Guardrails** del `CLAUDE.md` del proyecto — sin archivo intermedio (ya no hay `GUARDRAILS.md`). Lo hace `/save`.

## Tiers

| Tier | Archivo | Uso |
|------|---------|-----|
| Full SaaS | `CLAUDE.md` | Apps con auth, multi-tenant, RBAC, service layer |
| Simple | `CLAUDE-simple.md` | Webs informativas, landing pages, tools sin DB compleja |

El kickstart pregunta cual usar y configura el proyecto acorde.

## Stack base

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Prisma 7 · PostgreSQL · BetterAuth · Zod v4

## Carriles operativos de DB

El directorio `guides/` contiene los 3 carriles canonicos para operar DBs de produccion desde local. El **metodo** vive en la guia cross-repo (una sola fuente); los **datos especificos** (UUIDs, hosts, secrets, scripts) viven en la seccion correspondiente del `CLAUDE.md` de cada repo — no se duplica metodo.

| Carril | Caso de uso | Guia cross-repo |
|---|---|---|
| 1 | seed / reset / provision de datos de app | `guides/seed-via-api.md` |
| 2 | query / `pg_dump` / `pg_restore` / GUI tools | `guides/db-via-tunnel.md` |
| 3 | schema rollout (DDL / indices / enums) | `guides/db-schema-rollout.md` |

Repos que ya implementan el patron completo: `itera-lex`, `shope-ar`. Al sumar un repo nuevo, seguir el mismo formato: metodo en la guia + datos en el CLAUDE.md del repo.

### Sincronizacion de reglas entre proyectos

```
/sync   →  Desde el directorio de proyectos — detecta reglas que faltan en proyectos del mismo grupo de afinidad
```

Ver `PROJECT-MAP.md` para los grupos de afinidad y `INFRA.md` para datos de deploy.

## Configuracion global

Las reglas globales de Claude Code (timezone, idioma, convenciones de commits, etc.) se mantienen en `~/.claude/CLAUDE.md`, separadas de las reglas por proyecto.
