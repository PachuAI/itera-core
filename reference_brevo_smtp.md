# Brevo SMTP — Guia de integracion

> Metodo validado en produccion con Shopear (abril 2026) e ITERA Lex (mayo 2026).
> Aplica a todos los proyectos ITERA que necesiten email transaccional.

> **Antes de empezar**: este doc es el **COMO** (metodo de integracion). El **QUE**
> (que SaaS estan ya conectados a la cuenta Brevo, con que sender/key, para que
> envian emails, y como esta el consumo de cuota) vive en
> [`reference_brevo_usage_inventory.md`](./reference_brevo_usage_inventory.md).
>
> **Si vas a sumar un SaaS nuevo a Brevo, leer los dos**:
> 1. Inventario → para entender que ya existe, evitar duplicados de sender/key
>    y dimensionar el impacto en cuota compartida.
> 2. Esta guia → para ejecutar la integracion paso a paso.
> 3. Al terminar → **registrar el nuevo SaaS en el inventario** (ultima fila de
>    la tabla "Inventario por proyecto"). Sin ese paso el inventario queda
>    desactualizado y el siguiente agente no sabe que ya existis.

## Metodo elegido: SMTP via nodemailer

Brevo ofrece dos metodos: SMTP relay y API REST. Usamos **SMTP para SaaS** y dejamos
**API REST solo para contact forms simples**.

### SMTP vs API REST — cuando usar cada uno

| | SMTP (nodemailer) | API REST (fetch) |
|--|-------------------|-----------------|
| **Portabilidad** | Cambias host/port/creds y funciona con SendGrid, SES, Mailgun, etc. | Reescribis el fetch porque cada proveedor tiene su formato |
| **Libreria** | nodemailer maneja encoding, adjuntos, MIME, headers, edge cases | fetch crudo — lo que no armes a mano, no existe |
| **Performance** | Connection pooling (transporter cacheado reutiliza TCP) | HTTP request individual por email |
| **Protocolo** | SMTP: standard universal, 40+ anos | API propietaria de Brevo |
| **Setup inicial** | 6 env vars, login SMTP no obvio (documentado abajo) | 3 env vars, mas directo |
| **Ideal para** | SaaS con multiples tipos de email (verificacion, reset, notificaciones) | Contact form, envio puntual |

**Decision**: SMTP + nodemailer para Shopear y todo SaaS nuevo. API REST solo si el proyecto
es un sitio estatico con un contact form y nada mas (caso Bambu corporativa).

### Referencia: API REST (para contact forms)

Si un proyecto solo necesita un contact form, usar fetch directo sin nodemailer:

```typescript
const res = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': process.env.BREVO_API_KEY!,
  },
  body: JSON.stringify({
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Mi App' },
    to: [{ email: destinatario }],
    subject: 'Asunto',
    htmlContent: '<p>...</p>',
  }),
})
```

Env vars: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`. La API key se genera en:
Brevo Dashboard → Settings → SMTP & API → tab "API keys & MCP" → Generate a new API key

## Las 3 capas de Brevo (todas necesarias)

Para que un email llegue se necesitan 3 cosas configuradas. Si falta cualquiera, falla:

| Capa | Que es | Donde se configura | Que pasa si falta |
|------|--------|-------------------|-------------------|
| **1. Auth SMTP** | Login + SMTP Key para conectarse al servidor | Settings → SMTP & API → tab SMTP | Conexion rechazada, email no sale |
| **2. Dominio** | SPF, DKIM, DMARC en DNS para que Brevo pueda enviar como tu dominio | Settings → Domains → agregar + DNS records | Email sale pero va a spam o es rechazado |
| **3. Sender** | La direccion "From" autorizada (ej: `noreply@shope.ar`) | Settings → Senders → agregar sender | Brevo rechaza el envio con 550 |

**Relacion**: el Login SMTP (capa 1) autentica la conexion. El Sender (capa 3) es el remitente
visible. Son independientes: el login es `a730df001@smtp-brevo.com` pero el sender es
`noreply@shope.ar`. El dominio (capa 2) es el puente: autoriza a Brevo a enviar en nombre
de tu dominio para que los servidores de destino no lo marquen como spam.

## Datos de conexion (fijos para toda la cuenta ITERA)

| Campo | Valor |
|-------|-------|
| Host | `smtp-relay.brevo.com` |
| Puerto | `587` |
| Login | `a730df001@smtp-brevo.com` |
| Seguridad | STARTTLS (automatico en puerto 587) |

> **CRITICO**: El login SMTP **NO es** el email de la cuenta Brevo (`admin@itera.lat`),
> **NI** el sender email (`noreply@dominio.com`). Es un usuario SMTP especifico que se
> encuentra en: Brevo Dashboard → Settings → SMTP & API → tab SMTP → "Login".
> Este valor es fijo para toda la cuenta, no cambia por proyecto.

## SMTP Keys (una por proyecto)

Cada proyecto tiene su propia SMTP key. Se generan en:
Brevo Dashboard → Settings → SMTP & API → tab SMTP → "Generate a new SMTP key"

| Proyecto | Key name | Termina en |
|----------|----------|-----------|
| Shope.AR | Shope.AR | `KT8Z1f` |
| Presskit.AR | Presskit.AR | `BBfDfZ` |

Las keys completas empiezan con `xsmtpsib-` y son largas (~80 chars).

## Sender (uno por dominio)

Cada proyecto usa un sender diferente (el dominio del proyecto).
Se configuran en: Brevo Dashboard → Settings → Senders, Domains & Dedicated IPs

### Verificar un dominio nuevo

1. Tab **Domains** → Add a domain → ingresar el dominio (ej: `shope.ar`)
2. Brevo genera records DNS (SPF, DKIM, DMARC)
3. Agregar los records en Cloudflare (o el DNS del dominio)
4. Volver a Brevo → "Authenticate this domain"
5. Esperar verificacion (minutos a horas)

### Crear un sender

1. Tab **Senders** → Add a sender
2. Nombre: `Shope.AR` (nombre visible en el email)
3. Email: `noreply@shope.ar`
4. El dominio debe estar verificado previamente

### Dominios verificados actuales

| Dominio | Estado | Sender |
|---------|--------|--------|
| iteralex.com | Authenticated | noreply@iteralex.com (SaaS ITERA Lex + Tools) |
| iteraestudio.com | Authenticated | (varios) |
| shope.ar | Authenticated | noreply@shope.ar |
| linkea2.com | Authenticated | (pendiente) |

## Env vars por proyecto

```env
# Conexion SMTP (fijos para toda la cuenta)
BREVO_SMTP_HOST="smtp-relay.brevo.com"
BREVO_SMTP_PORT="587"
BREVO_SMTP_USER="a730df001@smtp-brevo.com"

# Key del proyecto (unica por proyecto)
BREVO_SMTP_KEY="xsmtpsib-...clave-completa..."

# Sender del proyecto
BREVO_SENDER_EMAIL="noreply@dominio-del-proyecto.com"
BREVO_SENDER_NAME="Nombre del Proyecto"
```

### En Coolify

- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`: runtime only
- `BREVO_SMTP_KEY`: runtime only, usar `--is-literal` por el prefijo `xsmtpsib-`
- `BREVO_SENDER_EMAIL`: runtime only, usar `--is-literal` por el `@`
- `BREVO_SENDER_NAME`: runtime only

**Footgun real (ITERA Lex, 2026-05-09)**: una key pegada por CLI quedo truncada en Coolify
(local tenia 90 caracteres, container tenia 83) y Brevo respondia:
`Invalid login: 535 5.7.8 Authentication failed`. Siempre verificar longitud/hash despues de
cargar secrets largos.

## Implementacion de referencia (nodemailer)

```typescript
// src/lib/email/send.ts
import nodemailer from 'nodemailer'

interface SendTransactionalEmailParams {
  to: string
  subject: string
  html: string
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.BREVO_SMTP_HOST
  const port = Number(process.env.BREVO_SMTP_PORT ?? '587')
  const user = process.env.BREVO_SMTP_USER
  const password = process.env.BREVO_SMTP_KEY

  if (!host || !user || !password || Number.isNaN(port)) return null

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass: password },
  })

  return cachedTransporter
}

export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams
): Promise<void> {
  const transporter = getTransporter()

  if (!transporter) {
    console.warn('[email] Brevo SMTP not configured, skipping', {
      to: params.to,
      subject: params.subject,
    })
    return
  }

  await transporter.sendMail({
    from: `"${process.env.BREVO_SENDER_NAME ?? 'App'}" <${process.env.BREVO_SENDER_EMAIL}>`,
    ...params,
  })
}
```

## Verificacion operativa validada

### 1) Smoke test desde la app

Si el proyecto tiene un script equivalente al de ITERA Lex:

```bash
pnpm email:test admin@itera.lat
```

Esto valida codigo de app + nodemailer + Brevo desde el entorno donde se corre el comando.

### 2) Comparar local vs Coolify sin imprimir la key

Usar longitud + hash para evitar exponer el secret:

```bash
# Local (.env.local)
node -e "const fs=require('fs'); const crypto=require('crypto'); const raw=fs.readFileSync('.env.local','utf8'); const m=raw.match(/^BREVO_SMTP_KEY=\"?([^\"\n]+)\"?/m); console.log('local', m[1].length, crypto.createHash('sha256').update(m[1]).digest('hex'))"

# Coolify config
coolify app env list <APP_UUID> --format json -s | \
  jq -r '.[] | select(.key == "BREVO_SMTP_KEY") | .value' | \
  node -e "const crypto=require('crypto'); let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{s=s.trimEnd(); console.log('coolify', s.length, crypto.createHash('sha256').update(s).digest('hex'))})"
```

Si no coinciden: actualizar el env de Coolify usando el valor desde archivo local, no pegando a mano:

```bash
KEY=$(node -e "const fs=require('fs'); const raw=fs.readFileSync('.env.local','utf8'); const m=raw.match(/^BREVO_SMTP_KEY=\"?([^\"\n]+)\"?/m); process.stdout.write(m[1])")
coolify app env update <APP_UUID> BREVO_SMTP_KEY --value "$KEY" --is-literal
```

### 3) Verificar que el container activo tomo la env nueva

Coolify puede tener el env correcto pero el container seguir con el valor viejo hasta redeploy.

```bash
ssh root@<VPS> '
APP=$(docker ps --format "{{.Names}}" | grep <APP_UUID> | head -1)
VAL=$(docker inspect "$APP" --format "{{range .Config.Env}}{{println .}}{{end}}" |
  grep ^BREVO_SMTP_KEY= | sed "s/^BREVO_SMTP_KEY=//")
printf "%s %s\n" "${#VAL}" "$(printf "%s" "$VAL" | sha256sum | cut -d" " -f1)"
'
```

Si el container no coincide con Coolify/local:

```bash
coolify deploy uuid <APP_UUID> --force
```

Esperar el deploy y repetir la verificacion del container.

### 4) Probar autenticacion SMTP desde el container productivo

En containers Next standalone puede no existir `require('nodemailer')` disponible para scripts
ad-hoc aunque la app lo tenga bundleado. Para validar credenciales sin depender del bundle,
usar `openssl s_client` con STARTTLS:

```bash
ssh root@<VPS> '
APP=$(docker ps --format "{{.Names}}" | grep <APP_UUID> | head -1)
docker exec "$APP" sh -lc '"'"'
AUTH=$(node -e "process.stdout.write(Buffer.from(\"\0\"+process.env.BREVO_SMTP_USER+\"\0\"+process.env.BREVO_SMTP_KEY).toString(\"base64\"))")
{
  printf "EHLO app.dominio.com\r\n"
  printf "AUTH PLAIN %s\r\n" "$AUTH"
  printf "QUIT\r\n"
} | openssl s_client -starttls smtp -crlf -quiet -connect "$BREVO_SMTP_HOST:$BREVO_SMTP_PORT" 2>/dev/null | grep -E "^(235|535|550)"
'"'"'
'
```

Resultado esperado:

```text
235 2.0.0 Authentication succeeded
```

Si devuelve `535`, la key/login SMTP del container estan mal. Si devuelve `550 Sender not allowed`
durante un envio real, revisar sender/dominio en Brevo.

## Errores comunes

### Email no llega, sin error visible

**Causa**: `BREVO_SMTP_USER` incorrecto. Si se usa el email de la cuenta (`admin@itera.lat`)
o el sender (`noreply@...`) como login SMTP, la autenticacion falla silenciosamente.

**Fix**: Usar el login SMTP real: `a730df001@smtp-brevo.com`

### Invalid login: 535 5.7.8 Authentication failed

**Causa**: credenciales SMTP invalidas en runtime. Caso real: `BREVO_SMTP_KEY` truncada al cargarla
en Coolify por CLI/pegado manual.

**Fix**:
1. Comparar longitud/hash local vs Coolify vs container.
2. Actualizar `BREVO_SMTP_KEY` con `coolify app env update ... --is-literal`.
3. Forzar redeploy (`coolify deploy uuid <APP_UUID> --force`).
4. Confirmar `235 2.0.0 Authentication succeeded` desde el container.

### 550 Sender not allowed

**Causa**: El dominio del sender no esta verificado en Brevo, o el sender email
no esta creado en la lista de Senders.

**Fix**: Verificar dominio + crear sender en Brevo Dashboard.

### Email llega pero va a spam

**Causa**: Faltan records DNS (SPF, DKIM, DMARC).

**Fix**: Tab Domains en Brevo → View configuration → verificar que los 3 esten en verde.

## Checklist para proyecto nuevo

0. [ ] **Leer `reference_brevo_usage_inventory.md`** — confirmar que el dominio/sender
       no esta ya tomado por otro proyecto, y dimensionar impacto en cuota compartida
1. [ ] Generar SMTP key en Brevo (Settings → SMTP & API → Generate). El **name** de la
       key debe ser identico al del proyecto — ese mismo name se usa en el inventario
2. [ ] Verificar dominio del proyecto en Brevo (Settings → Domains)
3. [ ] Agregar DNS records (SPF, DKIM, DMARC) en Cloudflare
4. [ ] Crear sender en Brevo (Settings → Senders)
5. [ ] Agregar env vars en Coolify (6 vars, ver seccion arriba)
6. [ ] Copiar `src/lib/email/send.ts` de Shopear como referencia
7. [ ] Verificar envio con un test real (no confiar en logs)
8. [ ] **Agregar fila al inventario** (`reference_brevo_usage_inventory.md`,
       tabla "Inventario por proyecto") con: repo, dominio, sender, key name,
       tipo de uso, ruta del codigo, fuente del runtime env, estado, riesgo

## Notas

- `BREVO_SMTP_USER` es compartido entre proyectos (es la cuenta ITERA)
- `BREVO_SMTP_HOST` y `BREVO_SMTP_PORT` son fijos (`smtp-relay.brevo.com:587`)
- Las SMTP keys son independientes: si se revoca una, las demas siguen funcionando
- "Last used on" en el dashboard de Brevo confirma si la key se uso exitosamente
- nodemailer se instala como dependencia de produccion (`pnpm add nodemailer`)
- `@types/nodemailer` va como devDependency
