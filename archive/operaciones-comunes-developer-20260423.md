# Operaciones Comunes Developer

## Por qué existe este documento

Este documento es un volcado de conocimiento táctico de las operaciones que el developer realiza con frecuencia y que requieren que el modelo (Claude) las ejecute o asista. Su objetivo es doble:

1. **Auditar el estado actual** de la documentación: qué está bien cubierto en `~/.claude/CLAUDE.md`, en el `CLAUDE.md` del proyecto y en las memorias, y qué tiene gaps reales que hacen que el modelo no pueda ejecutar limpio sin improvisar.
2. **Servir de insumo** para una destilación posterior — decidir qué regla va a qué nivel (global, proyecto, memoria) sin crear redundancias ni dispersar información.

**Criterio de documentación:** no documentar schemas completos de tablas ni listados exhaustivos de columnas. Documentar los **snippets de operación** con los campos exactos que cada tarea necesita. Lo que es estándar de BetterAuth va una vez en el `CLAUDE.md` global y los proyectos lo heredan; solo anotar deviaciones por proyecto.

**Principio de arquitectura del sistema de prompt (progressive disclosure):**
Los archivos `CLAUDE.md` (global y proyecto) deben ser **cortos, concisos y directivos** — estilo guardrails. No incluir contenido largo (tono de voz, briefs, copy, docs de negocio). En su lugar, **referenciar el path** al archivo donde vive esa información. La separación es:
- `CLAUDE.md` → reglas, guardrails, paths de referencia
- `itera-context/` → documentación de negocio (marca, voz, ICP, marketing)
- `.planning/` → documentación técnica y de producto del proyecto
- Este doc → operaciones tácticas con snippets ejecutables

Ejemplo correcto en `CLAUDE.md`: `Tono de voz y copy: ver ~/projects/itera-context/proyectos/shope-ar/MARKETING-BRIEF.md`
Ejemplo incorrecto: pegar el tono de voz entero en el `CLAUDE.md`.

**Scope para el modelo que destile este doc:**
Este documento mezcla dos tipos de contenido que deben ir a niveles distintos:
- **Alcance global ITERA** (aplica a todos los proyectos): patrón BetterAuth (`accounts`, `providerId: 'credential'`, bcrypt-ts 10 rounds), Coolify CLI flags y footguns, principio de progressive disclosure → va a `~/.claude/CLAUDE.md`
- **Alcance shope-ar** (específico de este proyecto): UUIDs de containers, credenciales demo, rutas de docs de negocio, tabla `users` plural → va al `CLAUDE.md` del proyecto o a memorias del proyecto

Cada entrada tiene un estado global y un estado por gap. Una vez que todas las entradas estén resueltas, este documento se archiva y las reglas viven donde corresponden.

### Estados posibles

| Estado | Significado |
|--------|-------------|
| ✅ Resuelto | Proceso claro, documentado, listo para ejecutar sin fricciones |
| ⚠️ Parcial | Proceso conocido pero con gaps menores que no bloquean |
| ❌ Pendiente | Gap real que requiere trabajo antes de poder ejecutar limpio |

---

## Operaciones

---

### 1. Cambiar la password de un usuario en DB

**Estado global: ✅ Resuelto**

**Contexto:** El usuario olvidó su password o hay necesidad operativa de cambiarla directamente en DB.

**Proceso:**
```bash
# 1. Establecer SSH tunnel (guía completa: guides/db-via-tunnel.md)
# VPS: root@65.108.148.79 | Container PG: uxoszayiqygjp8rib3kdddvg | DB: shopear

# 2. Generar hash — el proyecto usa bcrypt-ts, 10 rounds (src/lib/password.ts)
#    bcrypt-ts es compatible con bcryptjs, cualquiera de los dos sirve para generar el hash
node -e "require('bcryptjs').hash('nueva_password', 10).then(console.log)"

# 3. En psql: encontrar userId y actualizar
SELECT id FROM users WHERE email = 'usuario@ejemplo.com';

UPDATE accounts
SET password = '<hash_generado>'
WHERE "userId" = '<id>'
  AND "providerId" = 'credential';
  -- accountId también = userId (así lo crea el seed)
```

**Confirmado del código:**
- Tabla: `accounts` (modelo Prisma `Account`)
- Columna de hash: `password`
- `providerId`: `'credential'`
- `accountId`: igual al `userId` (no es un ID separado)
- Algoritmo: `bcrypt-ts` con 10 salt rounds → compatible con `bcryptjs`

**Footgun:** tabla de usuarios es `users` (plural), no `user`.

**Gaps:** Ninguno.

---

### 2. Encontrar un usuario con datos parciales

**Estado global: ✅ Resuelto**

**Proceso:**
```sql
SELECT id, email, name, "createdAt"
FROM users
WHERE email ILIKE '%dato%'
   OR name  ILIKE '%dato%'
LIMIT 10;
```

**Footgun:** tabla es `users` (plural), no `user`.

**Gaps:** Ninguno relevante.

---

### 3. Credenciales de superadmin (dev + prod)

**Estado global: ✅ Resuelto**

**Dev** — leer `.env.local` del proyecto:
- Variables: `ADMIN_EMAIL` / `ADMIN_PASSWORD`

**Prod** — Coolify CLI:
```bash
coolify app env list t1ect6gnjp8068ccu7lah6n8 --format json -s | jq -r '.[] | select(.key | test("ADMIN")) | "\(.key)=\(.value)"'
```

**Footgun crítico:** esas envs crean la fila en `users` pero **no** en `platform_admins`. Sin esa fila, `/admin/platform` devuelve 404 silencioso. Tras cualquier reset de DB hay que insertarla manualmente.

**Gaps:** Ninguno de proceso. La recuperación siempre va por la fuente, nunca por chat.

---

### 4. Credenciales de los tenants demo (dev + prod)

**Estado global: ✅ Resuelto**

Las credenciales están hardcodeadas en `src/lib/demo-access.ts` — son idénticas en dev y prod (convención confirmada por diseño del código):

| Nicho    | Email                    | Password         |
|----------|--------------------------|------------------|
| apple    | demo.apple@shope.ar      | DemoApple123!    |
| joyeria  | demo.joyeria@shope.ar    | DemoJoyeria123!  |
| ropa     | demo.ropa@shope.ar       | DemoRopa123!     |
| vinoteca | demo.vinoteca@shope.ar   | DemoVinoteca123! |

**Nota:** `vinoteca` existe en `demo-access.ts` pero **no** está en los `DEMO_TENANT_KEYS` del endpoint de prod (`/api/admin/seed`). En dev sí está disponible vía `pnpm demo:seed vinoteca`.

**Gaps:** Ninguno.

---

### 5. Agregar variables de entorno en producción

**Estado global: ✅ Resuelto**

**Proceso:**
```bash
# 1. Agregar la variable
coolify app env create t1ect6gnjp8068ccu7lah6n8 \
  --key NOMBRE_VAR \
  --value "valor" \
  --runtime        # o --build-time según corresponda
  # Agregar --is-literal si el valor tiene =, $, u otros caracteres especiales

# 2a. Si es runtime env (secret, API key que la app lee en runtime): restart sin rebuild
coolify app restart t1ect6gnjp8068ccu7lah6n8

# 2b. Si es build-time env (NEXT_PUBLIC_*, valor que debe entrar en el bundle): redeploy con rebuild
coolify deploy uuid t1ect6gnjp8068ccu7lah6n8
# Flags útiles: --force (si el deploy anterior quedó stuck), --docker-tag <tag>
```

**Footguns documentados:**
- Flags son `--runtime` / `--build-time` — nunca `--is-runtime` / `--is-buildtime`
- Valores con `=`, `$` u otros caracteres especiales → siempre `--is-literal`
- Contexto activo debe ser `modern-linux-desktop`
- `NEXT_PUBLIC_*` y vars usadas en build → `--build-time` + redeploy con rebuild
- **Agregar env var NO triggerea redeploy automático** — hay que llamar a `restart` o `deploy uuid` explícitamente
- **`coolify app redeploy` NO existe** en CLI 1.6.x — el comando correcto es `coolify deploy uuid <app-uuid>` (comando top-level, no subcomando de `app`)

**Gaps:** Ninguno.

---

### 6. Auditar drift de env vars (dev ↔ prod)

**Estado global: ✅ Resuelto**

**Fuentes canónicas:**
- `.env.example` (committeado en el repo) → lista vars requeridas + opcionales con comentarios. Source of truth para dev.
- Coolify env list → source of truth para prod.

**Audit automático:**
```bash
# Diff 3-way: example ↔ dev real ↔ prod
diff <(grep -oE '^[A-Z_]+=' .env.example | sort -u) \
     <(grep -oE '^[A-Z_]+=' .env | sort -u)

diff <(grep -oE '^[A-Z_]+=' .env.example | sort -u) \
     <(coolify app env list t1ect6gnjp8068ccu7lah6n8 --format json -s | jq -r '.[].key' | sort -u)
```

**Setup en máquina nueva:**
```bash
# 1. Copiar template
cp .env.example .env
# 2. Rellenar valores — los runtime secrets se obtienen de Coolify con:
coolify app env list t1ect6gnjp8068ccu7lah6n8 --format json -s
# 3. Para scripts locales que apuntan a prod, descomentar las PROD_* y rellenar
```

**Template ITERA** (`~/projects/itera-core/_template/.env.example`): base genérica con las vars comunes del stack (BetterAuth, Brevo, R2, Itera Estudio). Cada proyecto extiende o recorta según sus features.

**Gaps:** Ninguno.

---

### 7. Verificar si un email está registrado

**Estado global: ✅ Resuelto**

```sql
SELECT id, email, name, "createdAt", "emailVerified"
FROM users
WHERE email = 'email@ejemplo.com';
```

**Gaps:** Ninguno relevante.

---

### 8. Buscar un dato en cualquier campo de las cuentas

**Estado global: ✅ Resuelto**

```sql
-- Buscar en users (email, name — los únicos campos de texto de identidad en BetterAuth base)
SELECT id, email, name, "createdAt", "emailVerified"
FROM users
WHERE email ILIKE '%dato%'
   OR name  ILIKE '%dato%'
LIMIT 20;

-- Si el dato puede ser email de cuenta OAuth u otro provider:
SELECT u.id, u.email, u.name, a."providerId", a."accountId"
FROM users u
JOIN accounts a ON a."userId" = u.id
WHERE u.email ILIKE '%dato%'
   OR u.name  ILIKE '%dato%'
LIMIT 20;
```

**Confirmado del código:** BetterAuth en este proyecto usa solo `email` y `name` en `users`. No hay campo `phone` ni campos custom en el modelo de usuario. Datos de contacto adicionales (teléfono, dirección) viven en `Customer` o `SiteConfig`, no en `users`.

**Gaps:** Ninguno para el caso de uso de búsqueda de cuentas.

---

### 9. Branding, tono de voz y redacción para redes sociales

**Estado global: ✅ Resuelto (con matices — ver abajo)**

**Tres niveles de doc, cada uno con su scope:**

| Nivel | Archivo | Qué cubre |
|-------|---------|-----------|
| Marca madre ITERA | `~/projects/itera-context/marca/manual-de-marca.md` | Identidad ÍTERA (agencia), tagline, paleta negra/naranja, Poppins, voz por canal (Twitter/YT/LinkedIn/IG/Blog), ÍTERA vs pachu.dev |
| Estrategia de distribución | `~/projects/itera-context/marca/estrategia-contenido.md` | Cómo extraer contenido de cualquier proyecto, formatos por plataforma, workflow solopreneur, sistema "contenido madre → derivados" |
| Producto shope-ar | `~/projects/itera-context/proyectos/shope-ar/MARKETING-BRIEF.md` | Tono específico del producto (directo, cercano, rioplatense, empático), audiencia, copy de secciones, diferenciadores |
| Identidad visual shope-ar | `docs/brand.md` en el repo | Logo v7, Baloo 2, Comfortaa, paleta, formatos |

**Regla de progressive disclosure:**
- Para contenido de redes bajo la voz pachu.dev sobre proyectos (incluye shope-ar como "caso de estudio"): usar `estrategia-contenido.md` + `manual-de-marca.md` §7 (voz por canal)
- Para copy del producto shope-ar (web, landings, onboarding, emails transaccionales): usar `MARKETING-BRIEF.md` + `docs/brand.md`
- No mezclar: la voz de pachu.dev hablando DE shope-ar es distinta del copy oficial de shope-ar

**Matiz abierto:** shope-ar todavía no tiene cuentas sociales propias — todo el contenido sobre shope-ar sale bajo pachu.dev. Si en algún momento shope-ar necesita voz institucional propia (@shopear_ar), habrá que armar una voz específica (más producto-centric, menos founder-diary). Ver operación #10.

**Gaps:** Ninguno para el caso actual. Si shope-ar abre cuentas propias, reabrir esta operación.

---

### 10. Redes sociales del proyecto (cuentas, usuarios, bios)

**Estado global: ✅ Resuelto (para shope-ar)**

**Fuente de verdad**: `~/projects/itera-context/proyectos/shope-ar/social-accounts.md`

**Estado actual de cuentas shope-ar:**
- ✅ Instagram: `@shope_ar` creada (vía Centro de cuentas Meta) — sin bio, sin email, sin contenido
- ❌ Facebook, X, LinkedIn, YouTube: pendientes de crear

**Principio de separación** (aplicable a todos los productos ITERA):
Cada marca/producto con peso propio tiene su propio doc de social-accounts, NO se mezclan en un doc transversal. Ubicación estándar:
- Productos: `~/projects/itera-context/proyectos/<producto>/social-accounts.md`
- ÍTERA agencia (itera.lat): `~/projects/itera-context/marca/social-accounts.md` (pendiente)
- pachu.dev (personal, solopreneur): `~/projects/itera-context/personal/social-accounts.md` (pendiente)

El producto mismo solo agrega la referencia en su `CLAUDE.md` sección "Marca y redes" con el path, NO con los handles inline (progressive disclosure).

**Réplica para otros productos ITERA cuando se aborden:**
- IteraLex tiene cuentas propias (pendiente de documentar siguiendo este mismo patrón)
- Otros (Alquímica, presskit.ar, IteraLink, etc.) no tienen cuentas propias — su contenido sale bajo @pachu.dev

**Gaps:** Ninguno para shope-ar. Para otros productos: abrir una operación equivalente cuando se trabaje cada uno.

---

### 11. Saber cuánto espacio ocupa el proyecto en el VPS

**Estado global: ✅ Resuelto**

```bash
# Tamaño de containers (escrituras reales vs imagen virtual)
ssh root@65.108.148.79 "docker ps --size --format 'table {{.Names}}\t{{.Size}}' | grep -E 't1ect6gnjp|uxoszayiq'"

# Volumen de datos de postgres (el único volumen persistente del proyecto)
ssh root@65.108.148.79 "du -sh /var/lib/docker/volumes/postgres-data-uxoszayiqygjp8rib3kdddvg/_data"

# Vista general del VPS (disco total)
ssh root@65.108.148.79 "df -h"
```

**Datos actuales (2026-04-23):**
- App container `t1ect6gnjp8068ccu7lah6n8-234346736212`: 169kB escrituras reales / 567MB imagen
- DB container `uxoszayiqygjp8rib3kdddvg`: 63B escrituras / 279MB imagen
- Volumen postgres: **70MB** en `/var/lib/docker/volumes/postgres-data-uxoszayiqygjp8rib3kdddvg/_data`
- La app **no tiene volúmenes propios** — es stateless, los assets viven en Cloudflare R2

**Gaps:** Ninguno.

### 12, 13, 14. Brief / Eslogan y pain points / Cliente ideal (ICP)

**Estado global: ✅ Resuelto**

**Brief ejecutivo / elevator pitch:**
→ `.planning/product/BRIEF.md` — doc de handoff completo (qué es, qué resuelve, para quién, stack, modelo de negocio)

**Pain points articulados:**
→ `.planning/product/BRIEF.md` sección "Que problema resuelve"
→ `~/projects/itera-context/proyectos/shope-ar/MARKETING-BRIEF.md` sección "Problema / Dolor"

**Eslogan / headline:**
→ "Tu catálogo online, con checkout por WhatsApp"
→ Subtítulo: "Sin pasarela de pagos, sin comisiones, sin complicaciones."

**ICP (cliente ideal):**
→ Pequeños y medianos comercios de Argentina/LATAM que venden por WhatsApp y cobran por transferencia. No quieren ni necesitan pasarela de pagos. Rubros: indumentaria, tecnología, alimentos, ferreterías, dietéticas, viveros, bazares, kioscos.

**Diferenciador principal:**
→ No es un e-commerce — es un catálogo inteligente que respeta cómo estos negocios ya funcionan. Sin comisiones, sin digitalizar el cobro.

**Gaps:** Ninguno.

---

### 15. Actualizar datos de un tenant demo en producción

**Estado global: ✅ Resuelto**

```bash
# Guía completa: guides/seed-via-api.md → Procedimiento B
# 1. Login como platform admin en https://admin.shope.ar (obtener cookie de sesión)
# 2. POST con Bearer + cookie

curl -X POST https://admin.shope.ar/api/admin/seed \
  -H "Authorization: Bearer <ADMIN_SEED_SECRET>" \
  -H "Cookie: <cookie-de-sesion>" \
  -H "Content-Type: application/json" \
  -d '{"target": "demo", "niche": "apple"}'
  # niche opcional — sin él regenera todos los demos (apple, joyeria, ropa)
  # Para reset completo: "target": "reset"
```

**Gaps:** Ninguno.

---

### 16. Crear un nuevo tenant (no demo) en dev y prod

**Estado global: ✅ Resuelto**

**Dev:**
```bash
# Los pnpm demo:* son solo para niches predefinidos (apple, ropa, vinoteca, joyeria)
# Para un tenant nuevo genérico, usar el endpoint de provision directamente:
curl -X POST http://admin.local.shope.test:3016/api/admin/seed \
  -H "Authorization: Bearer <ADMIN_SEED_SECRET>" \
  -d '{"target": "provision", "templateKey": "<key>", "name": "Nombre Tienda", "slug": "mi-tienda", "subdomain": "mitienda"}'
```

**Prod:**
```bash
curl -X POST https://admin.shope.ar/api/admin/seed \
  -H "Authorization: Bearer <ADMIN_SEED_SECRET>" \
  -H "Cookie: <cookie-de-sesion>" \
  -d '{"target": "provision", "templateKey": "<key>", "name": "Nombre", "slug": "slug", "subdomain": "sub", "isDefault": false}'
```

**Confirmado del código:** `provision` crea una nueva tienda con `createStoreFromTemplate`, la asigna al admin account como owner. Devuelve `storeId`, `storeSlug`, `templateKey`, `adminEmail`.

**Templates disponibles actualmente:** `apple`, `joyeria`, `ropa`, `vinoteca` (inline en `shope-ar/CLAUDE.md` sección "Seed en prod"; source of truth: `src/lib/store-templates/index.ts`).

**Matiz producción:** el endpoint `/api/admin/seed` de prod restringe `target: "demo"` a `DEMO_TENANT_KEYS` (apple/joyeria/ropa — sin vinoteca). Para `target: "provision"` se acepta cualquier `STORE_TEMPLATE_KEYS`. Ver código del route para confirmar cuando se amplíe la lista.

**Gaps:** Ninguno.

---

### 17. Verificar si un email existe aunque su tenant haya sido borrado (usuarios huérfanos)

**Estado global: ✅ Resuelto**

**Contexto:** En este proyecto, borrar un `Store` no borraba (en versiones anteriores) los `User` asociados. Un usuario puede existir en `users` sin ninguna membresía activa ni store vigente. Para detectarlo:

```sql
-- 1. Buscar el usuario directo en la tabla global (existe independientemente de tenants)
SELECT u.id, u.email, u.name, u."createdAt", u."emailVerified"
FROM users u
WHERE u.email = 'email@ejemplo.com';

-- 2. Ver sus membresías y si los stores aún existen
SELECT
  sm."storeId",
  sm.role,
  s.id   AS store_existe,
  s.name AS store_nombre,
  s.slug AS store_slug
FROM store_members sm
LEFT JOIN stores s ON s.id = sm."storeId"
WHERE sm."userId" = '<id_del_paso_1>';
-- Si store_existe es NULL → membresía huérfana (el store fue borrado pero store_members quedó)
-- Si no hay filas → usuario completamente huérfano (sin ninguna membresía)

-- 3. Ver si tiene cuenta de credenciales
SELECT "providerId", "accountId", "createdAt"
FROM accounts
WHERE "userId" = '<id>';
```

**Casos posibles:**
- `store_existe IS NULL` en alguna fila → store borrado, `store_members` no se cascadeó → huérfano parcial
- Sin filas en `store_members` → usuario completamente huérfano
- Usuario no aparece en `users` → nunca se registró

**Nota de integridad:** `users` es una entidad global en BetterAuth — no pertenece a ningún tenant. Por diseño, borrar un store NO borra el user. Lo que debería borrarse en cascada son las filas de `store_members`. Si no lo hace, quedan huérfanos.

**Gaps:** Ninguno.

---

## Pendientes globales

| Tarea | Afecta ops | Estado | Resolución |
|-------|-----------|--------|-----------|
| Confirmar subcomando Coolify CLI para redeploy con rebuild vs restart sin rebuild | 5 | ✅ Resuelto | Doc actualizada: `coolify deploy uuid <app>` (rebuild) vs `coolify app restart <app>` (runtime solo). `coolify app redeploy` no existe en 1.6.x. Propagado a `~/.claude/CLAUDE.md` |
| Crear y committear `.env.example` en shope-ar | 6 | ✅ Resuelto | Ya existía committeado pero desfasado — sincronizado con `.env` real. Agregados ADMIN_SEED_SECRET, los 6 Brevo; PROD_* comentadas como opcional-ops |
| Crear `.env.example` base en `_template/` ITERA | 6 | ✅ Resuelto | Creado `~/projects/itera-core/_template/.env.example` con vars comunes del stack |
| Leer `manual-de-marca.md` y `estrategia-contenido.md` en detalle | 9 | ✅ Resuelto | Ambos leídos. El scope es ÍTERA agencia + pachu.dev personal, no shope-ar producto. Doc operación 9 actualizada con los tres niveles |
| Listar `STORE_TEMPLATE_KEYS` disponibles | 16 | ✅ Resuelto | Inline en `shope-ar/CLAUDE.md` sección "Seed en prod" con matiz de DEMO_TENANT_KEYS de prod |
| Crear doc de cuentas sociales shope-ar | 10 | ✅ Resuelto | Creado `itera-context/proyectos/shope-ar/social-accounts.md`. Instagram @shope_ar documentada, el resto como pendiente. Regla de separación por producto definida |
| Replicar social-accounts para otros productos (IteraLex, ÍTERA, pachu.dev) | 10 | ❌ Pendiente | Fuera del scope actual — abrir cuando se aborde cada marca |
| Guías de copy por plataforma social | 9 | ⚠️ Parcial | Cubierto parcial en `manual-de-marca.md §7` y `estrategia-contenido.md` bajo ÍTERA/pachu.dev. shope-ar tiene IG creado pero sin contenido — redactar bio + pilares cuando se active Instagram |

---

## Siguientes pasos propuestos

Con los gaps arriba cerrados, este doc ya puede usarse como **insumo de destilación Fase 2**:

1. **Global → `~/.claude/CLAUDE.md`**: patrón BetterAuth de change-password (op 1), tabla `users` plural como regla cross-BetterAuth, principio de progressive disclosure como regla explícita. Los footguns de Coolify CLI ya están propagados.
2. **Proyecto → `shope-ar/CLAUDE.md`**: mayoría ya documentada. Pendiente agregar sección "Ops sobre users" con los snippets de búsqueda/cambio password para cuando aparece ese caso.
3. **`itera-context/`**: crear `social-accounts.md` cuando se destrabe operación 10.

Una vez hecha la destilación, archivar este doc en `itera-core/archive/operaciones-comunes-developer-YYYYMMDD.md` para trazabilidad.
