# [OBSOLETO] Crear/resetear usuario admin en producción (Coolify + Postgres + bcryptjs)

> ⚠️ **ARCHIVO HISTÓRICO — NO USAR COMO REFERENCIA OPERATIVA.**
>
> Este método (generar hash bcrypt local + UPSERT SQL directo en psql desde Coolify Terminal) fue **reemplazado** por el método canónico de seed via API protegida.
>
> **Método vigente**: `~/projects/itera-core/guides/seed-via-api.md`
>
> **Se preserva este archivo** únicamente por trazabilidad: documenta un método que funcionó históricamente cuando no existía una API `/api/admin/seed` en el repo. Si ves código o docs que referencian este archivo como canónico, están desactualizados — apuntarlos a la guía nueva.
>
> Razones por las que fue descartado:
> - Frágil (requiere entrar al container de Postgres vía UI de Coolify)
> - Mezcla data ops con acceso low-level a infra
> - No es reusable cross-repo
> - No cubre targets complejos (reset, provision, demo refresh)
> - No deja rastro auditable
>
> El contenido de abajo queda como referencia histórica.

---

Procedimiento validado (histórico) para proyectos SaaS ITERA que corrían en Coolify con Postgres y autenticación por email/password (bcryptjs). Útil cuando:

- El container de producción no tiene `tsx` ni devDependencies → no podés ejecutar `seed:admin` de TypeScript.
- El password del admin solo vive como hash bcrypt en DB.
- Necesitás entrar al panel admin la primera vez (o recuperar acceso).

## Por qué no podés usar `npm run seed:admin` en producción

- El build de Next.js standalone/production **no incluye devDeps ni `tsx`**.
- El Dockerfile multi-stage copia `.next/standalone` que solo tiene el runtime Node + prod deps.
- El seed está en TypeScript (`prisma/seed-admin.ts`) y requiere `tsx` para correr → no está.
- Intentar `npx tsx prisma/seed-admin.ts` en el container tira `tsx not found`.

## Solución: generar hash local + UPDATE SQL directo

### 1. Generar hash bcrypt localmente

Desde la raíz del proyecto (tiene `bcryptjs` como prod dep):

```bash
node -e "console.log(require('bcryptjs').hashSync('TuClaveNueva', 10))"
```

Esto imprime algo tipo `$2b$10$vkXnzj6YYMUz3bWAgVh7Seg1Kq2/eXvBWbJTMmD0JYfAyuycbPt.a`. Copialo.

> Si el proyecto usa `bcrypt` (no `bcryptjs`), reemplazar el require. En proyectos ITERA estándar es `bcryptjs`.

### 2. Conseguir el nombre de la DB desde Coolify

```bash
"C:/Program Files/Coolify/coolify" app env list <APP_UUID> --format json -s | \
  python -c "import sys, json; [print(e['value']) for e in json.loads(sys.stdin.read()) if e['key']=='DATABASE_URL']"
```

Te devuelve algo como `postgresql://user:pass@host:5432/db-name`. Anotá:
- **user** (entre `//` y `:`)
- **db-name** (después del último `/`)

### 3. Entrar a psql en el container de PG

Coolify UI → servicio Postgres → **Terminal** → bash del container. Ahí:

```bash
psql -U <user> "<db-name>"
```

> Si el nombre de la DB tiene guión (ej: `presskit-ar`), hay que ponerlo entre comillas o sin flag `-d`: `psql -U presskit "presskit-ar"` o `psql -U presskit presskit-ar`.

No pide password (conexión local trusted por default en containers Coolify Postgres).

### 4. UPSERT del admin

Adentro de psql pegar:

```sql
INSERT INTO "User" (id, email, password, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@tuproyecto.com',
  '<PEGAR_HASH_ACÁ>',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = 'ADMIN',
    status = 'ACTIVE',
    "updatedAt" = NOW();
```

`ON CONFLICT` cubre ambos casos: crea si no existe, actualiza si ya está.

Salir: `\q`.

### 5. Login

Ir a `/ingresar` con el email + el password **plano** que pasaste al `hashSync`.

## Alternativa descartada: env vars temporales

Podrías agregar `ADMIN_EMAIL` y `ADMIN_PASSWORD` a Coolify y correr `node dist/seed-admin.js` — pero requiere compilar el seed a JS y meterlo en la build, lo cual es cambio de código. La vía SQL es mejor porque no toca el repo.

## Schema esperado

Esto asume el schema ITERA estándar (Auth.js v5 + modelo User custom):

```prisma
model User {
  id        String     @id
  email     String     @unique
  password  String?
  role      UserRole   @default(USER)
  status    UserStatus @default(ACTIVE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

Si el proyecto tiene campos obligatorios extra (ej: `name`, `tenantId`), agregarlos al INSERT con valores por defecto o NULL.

## Checklist rápido

- [ ] Confirmar que `bcryptjs` (o `bcrypt`) está en `dependencies` del proyecto
- [ ] Generar hash con password plano elegido
- [ ] Obtener `DATABASE_URL` de Coolify para extraer user + db name
- [ ] Entrar a psql desde Terminal del container Postgres
- [ ] Ejecutar el UPSERT con el hash
- [ ] Verificar login en `/ingresar`
