# Seed en producción via API protegida

Método canónico para poblar, resetear o provisionar datos en repos SaaS ITERA que exponen una route `POST /api/admin/seed` con Bearer auth.

Este es el **carril 1** de la doctrina de DB ops ITERA:

- Carril 1: seed / reset / provision de datos de aplicación → este documento
- Carril 2: query / `pg_dump` / `pg_restore` / GUI tools → `guides/db-via-tunnel.md`
- Carril 3: schema rollout (DDL, índices, enums) → `guides/db-schema-rollout.md`

**Reemplaza al método legacy** de bcryptjs local + UPSERT SQL directo en psql (ver `reference_coolify_admin_seed.OBSOLETE.md`).

---

## Cuándo usar este método

Para datos de **aplicación** que dependen del runtime (Prisma, BetterAuth, lógica de dominio):

- Seed inicial (admin user, superadmin, platform admin)
- Reset o refresh de stores demo
- Provisioning de nuevos tenants
- Propagación de defaults a registros existentes
- Cualquier `target` que el repo exponga

**No usar** para:

- DDL, índices, enums, schema rollout, verificación de drift → carril 3, ver `guides/db-schema-rollout.md`
- Queries ad-hoc, `pg_dump`, `pg_restore`, GUI tools → carril 2, ver `guides/db-via-tunnel.md`

---

## Datos específicos por repo

El método es idéntico para todos los repos. Cambia solo:

- URL base (ej: `https://admin.shope.ar`, `https://app.iteralex.com`)
- App UUID en Coolify
- Contexto Coolify (`modern-linux-desktop`, `alquimica-linux-desktop`, `static-linux-desktop`)
- Lista de `target` disponibles
- Nombre del env var con el secret (normalmente `ADMIN_SEED_SECRET`)
- Si la route requiere sesión previa (login) además del Bearer

Esa tabla va en el `CLAUDE.md` de cada repo bajo la sección **"Seed en prod"**. No duplicar el método acá; solo los datos.

---

## Procedimiento A — Bearer only

Aplica a repos donde la route valida solo Bearer + (opcionalmente) host. No requiere login previo.

```bash
curl -X POST "$APP_URL/api/admin/seed" \
  -H "Authorization: Bearer $ADMIN_SEED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"target":"demo"}'
```

Esperar `200 OK`. Verificar efecto en UI o con `psql`.

**Usos típicos**: iteralex, y cualquier repo nuevo por default.

---

## Procedimiento B — Bearer + sesión de platform admin

Aplica a repos donde la route además de Bearer exige sesión activa de un usuario con rol platform admin (ej: shope-ar).

### Paso 1 — Login para obtener cookie de sesión

```bash
COOKIE_JAR=$(mktemp)

curl -c "$COOKIE_JAR" \
  -H "Origin: $APP_URL" \
  -H "Content-Type: application/json" \
  --data '{"email":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'","rememberMe":true}' \
  "$APP_URL/api/auth/sign-in/email"
```

Si BetterAuth responde `429` (rate limit por intentos fallidos previos), sumar temporalmente:

```bash
coolify --context <contexto> app env create <app-uuid> \
  --key E2E_DISABLE_AUTH_RATE_LIMIT --value 1 --is-literal --runtime
coolify --context <contexto> app restart <app-uuid>
# Esperar ~8 min para que el redeploy termine (health check de Coolify)
```

Después del seed, limpiar:

```bash
# Listar para obtener el UUID
coolify --context <contexto> app env list <app-uuid> --format json | \
  jq -r '.[] | select(.key=="E2E_DISABLE_AUTH_RATE_LIMIT") | .uuid'

coolify --context <contexto> app env delete <app-uuid> <env-uuid> --force
coolify --context <contexto> app restart <app-uuid>
```

Este paso del rate limit es raro: solo se necesita si ya hubo varios intentos fallidos recientes contra `/api/auth/sign-in/email`.

### Paso 2 — Curl al seed con cookie + Bearer

```bash
curl -b "$COOKIE_JAR" \
  -H "Origin: $APP_URL" \
  -H "Authorization: Bearer $ADMIN_SEED_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"target":"demo"}' \
  "$APP_URL/api/admin/seed"

rm -f "$COOKIE_JAR"
```

Validar respuesta `200 OK` y el payload con el resultado del target.

**Usos típicos**: shope-ar.

---

## Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| `404` al llamar la route | Host equivocado (ej: `shope.ar` en vez de `admin.shope.ar`) | Usar el host canónico que valida `isPlatformHost` del repo |
| `401` sin sesión | Bearer no matchea | `coolify app env list <uuid> -s` y comparar `ADMIN_SEED_SECRET` |
| `401` con sesión requerida | Cookie expirada, login falló, o usuario no es platform admin | Repetir login, validar credenciales, verificar fila en `platform_admins` |
| `429` en `/api/auth/sign-in/email` | Rate limit de BetterAuth acumulado | Habilitar `E2E_DISABLE_AUTH_RATE_LIMIT=1` temporal (ver Procedimiento B paso 1) |
| `500` | Error de aplicación en el seed | `coolify app logs <uuid>` para stack trace |
| `200 OK` pero datos no aparecen en UI | Cache de Next (`unstable_cache` con tags) | El seed debería invalidar tags; si no, es bug del target, no del método |

---

## Por qué este método reemplaza al legacy

**Métodos descartados**:

1. **bcryptjs local + UPSERT SQL en psql**: frágil, requiere entrar al container de Postgres, mezcla data ops con infra, no es reusable, no audita, no cubre targets más complejos (reset/provision).
2. **Copiar `node_modules` completos al runner del Docker** para correr `npm run db:seed` dentro del container: imagen 300-500MB más pesada, acopla el método al Dockerfile, no sirve para ops puntuales fuera de deploy.
3. **Feature flag `ENABLE_ADMIN_SEED_ROUTE`** que cerraba la route en prod salvo ventanas operativas: histórico en shope-ar, descartado 2026-04-21. Agregaba ~15 min de overhead por cada seed (2 redeploys de ~8 min cada uno) sin beneficio real frente a la triple protección Bearer + sesión + host check. Si en el futuro se quiere reintroducir como endurecimiento extremo, agregarlo como Procedimiento C documentado acá.

**Ventajas del método API**:

- Reusable cross-repo con el mismo shape
- Auditable (logs + Bearer)
- Ejecutable desde cualquier máquina con red + secret
- Usa el runtime real de la app (no simula Prisma/auth aparte)
- Soporta múltiples targets sin reescribir el flujo

---

## Repos que implementan este método

| Repo | Procedimiento | Detalle en |
|---|---|---|
| `shope-ar` | B (Bearer + sesión platform admin) | `shope-ar/CLAUDE.md` § Seed en prod |
| `itera-lex` | A (Bearer only) | `itera-lex/CLAUDE.md` § Seed en prod |
| `presskit-ar` | A (Bearer only) — targets `superadmin`, `qa`, `all` | `presskit-ar/CLAUDE.md` § Seed en prod |

Al agregar un repo nuevo: sumar fila acá + crear sección "Seed en prod" en el `CLAUDE.md` del repo con los datos específicos. **No duplicar el método en cada repo.**
