# Cloudflare via API — guía operativa

> Método canónico ITERA para operar con la API de Cloudflare desde local.
> Cubre: cache purge, DNS records, R2 buckets, wrangler.
> Última validación: 2026-04-26.

## Cuándo usar este método

- Purgar cache de un sitio después de un deploy (cuando CF cachea CSS/JS más tiempo del que querés)
- Crear/editar DNS records (subdominios nuevos, cambios de IP, TXT verifications)
- Listar / crear / inspeccionar buckets R2
- Subir / bajar / borrar objetos puntuales en R2
- Cualquier operación reproducible que sería un click manual en el dashboard

Para operaciones interactivas exploratorias (un solo cambio puntual), el dashboard sigue siendo más rápido. Esta guía cubre el carril script-friendly.

## Dos APIs distintas: control plane vs data plane

R2 se opera con dos pares de credenciales que NO son intercambiables:

| Uso | Credenciales | Herramientas | Para qué sirve |
|---|---|---|---|
| Cloudflare control plane | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | `wrangler`, `curl https://api.cloudflare.com/client/v4/...` | Crear/listar buckets, DNS, cache purge, settings de cuenta/zona, operaciones administrativas. |
| R2 S3 data plane | `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + endpoint R2 | SDK S3 (`@aws-sdk/client-s3`), AWS CLI con endpoint, rclone | Leer/escribir/listar objetos dentro de buckets, validar permisos runtime, migrar o inspeccionar contenido. |

Regla práctica:

- Si la pregunta es "existe el bucket?", "creá un bucket", "purgá cache", "tocá DNS" -> usar Cloudflare API/Wrangler.
- Si la pregunta es "qué objetos hay dentro?", "subí/bajá este archivo", "validá que la app puede guardar archivos" -> usar S3 API/R2 credentials.
- Wrangler es útil para bucket/admin y objetos puntuales (`put/get/delete`). No asumir que lista objetos: depende de la versión instalada. En Wrangler `4.85.0`, `wrangler r2 object list` no existe; usar S3 API o `rclone`.

## Setup (una vez por máquina)

### 1. Crear API token

Ir a https://dash.cloudflare.com/profile/api-tokens → "Create Token" → "Custom token".

Permisos mínimos para todo lo que cubre esta guía:

| # | Tipo | Recurso | Permiso |
|---|---|---|---|
| 1 | Account | Workers R2 Storage | Edit |
| 2 | Account | Account Settings | Read |
| 3 | Zone | Cache Purge | Purge |
| 4 | Zone | Zone | Read |
| 5 | Zone | DNS | Edit |

- Account Resources: `Include → All accounts`
- Zone Resources: `Include → All zones from an account → <cuenta>`
- Client IP Address Filtering: vacío (a menos que tengas IP estática)
- TTL: sin expiración (o 1 año si querés rotarlo)

El token aparece **una sola vez** en pantalla. Copialo y guardalo.

### 2. Guardar token en disco

```bash
mkdir -p ~/.config/cloudflare
chmod 700 ~/.config/cloudflare
printf '%s' '<TOKEN>' > ~/.config/cloudflare/token
chmod 600 ~/.config/cloudflare/token
```

### 3. Setear env vars en shell rc

Agregar al `~/.bashrc` (o `~/.zshrc`):

```bash
# Cloudflare API token
if [ -r "$HOME/.config/cloudflare/token" ]; then
  export CLOUDFLARE_API_TOKEN="$(cat "$HOME/.config/cloudflare/token")"
fi
export CLOUDFLARE_ACCOUNT_ID="<account_id>"
```

El `account_id` se obtiene del dashboard CF o ejecutando:

```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts | jq -r '.result[].id'
```

### 4. Instalar wrangler (opcional)

Para gestión interactiva de R2/Workers/Pages:

```bash
npm install -g wrangler
wrangler --version
```

Wrangler usa `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` automáticamente cuando están en env.

### 5. Verificar setup

```bash
# Token activo
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify | jq '.success'
# → true

# Zonas accesibles
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  'https://api.cloudflare.com/client/v4/zones?per_page=50' \
  | jq -r '.result[] | "\(.name)\t\(.id)"' | column -t -s $'\t'

# R2 buckets
wrangler r2 bucket list
```

## Operaciones comunes

### Cache purge

**Script reutilizable**: `~/projects/itera-core/scripts/cf-purge.sh`

```bash
# Purgar todo el cache de una zona
cf-purge.sh pachu.dev

# Purgar URLs específicas (max 30)
cf-purge.sh pachu.dev https://pachu.dev/style.css https://pachu.dev/index.html
```

**API directa**:

```bash
ZONE_ID="$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=pachu.dev" | jq -r '.result[0].id')"

# Purga total
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purga selectiva
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://pachu.dev/style.css"]}'
```

### DNS records

**Listar records de una zona**:

```bash
ZONE_ID="<zone_id>"
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=100" \
  | jq -r '.result[] | "\(.type)\t\(.name)\t\(.content)\t\(.proxied)"' \
  | column -t -s $'\t'
```

**Crear A record proxied** (subdominio nuevo apuntando a un VPS):

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "link",
    "content": "65.108.148.79",
    "proxied": true,
    "ttl": 1
  }'
```

(`ttl: 1` = automatic en CF; si `proxied: true`, se ignora.)

**Crear CNAME** (apuntar a otro hostname):

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "www",
    "content": "pachu.dev",
    "proxied": true
  }'
```

**Editar record existente**:

```bash
RECORD_ID="<record_id>"
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"content": "<nueva_ip>"}'
```

**Borrar**:

```bash
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### R2 buckets

**Listar buckets** (wrangler o API):

```bash
wrangler r2 bucket list
# o
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets" \
  | jq -r '.result.buckets[].name'
```

**Crear bucket**:

```bash
wrangler r2 bucket create <bucket-name>
```

**Listar objects de un bucket**:

```bash
node <<'NODE'
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

client.send(new ListObjectsV2Command({
  Bucket: process.env.R2_BUCKET_NAME,
  Prefix: process.env.R2_PREFIX || undefined,
  MaxKeys: 50,
})).then((result) => {
  for (const object of result.Contents ?? []) {
    console.log(`${object.Key}\t${object.Size}\t${object.LastModified?.toISOString() ?? ""}`);
  }
});
NODE
```

**Subir / bajar object**:

```bash
wrangler r2 object put <bucket>/<key> --file ./local.png
wrangler r2 object get <bucket>/<key> --file ./local-copy.png
wrangler r2 object delete <bucket>/<key>
```

**Para sincronización masiva o exploración**: usar `rclone` con backend R2 (no wrangler — wrangler es uno-por-uno).

### Otros endpoints útiles

- `GET /zones` — listar zonas
- `GET /zones/{id}/dns_records` — listar DNS
- `GET /zones/{id}/settings` — settings de la zona (cache level, security level, etc.)
- `PATCH /zones/{id}/settings/development_mode` — bypass total del CDN durante 3hs (debug urgente)

## Inventario de zonas (snapshot 2026-04-26)

Ver listado actual en cualquier momento con:

```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  'https://api.cloudflare.com/client/v4/zones?per_page=50' \
  | jq -r '.result[] | "\(.name)\t\(.id)"' | column -t -s $'\t' | sort
```

Snapshot:

| Zona | Zone ID |
|---|---|
| abundanciahogar.com.ar | 9ecc7e9be9ea571b74f1760af98023aa |
| alquimicaoficial.com.ar | 31bde017a2112b2af74eba21bc5c6140 |
| angeloditommaso.com | 187bfb05de7e7217c0f14e03b1394c74 |
| bambuoficial.com.ar | 03ee800706ca821c1e0759762330f59d |
| iteraestudio.com | 81fe4ce1643955af6706ec74b8e26788 |
| itera.lat | cea73d3bec3ba3dd14c5709570713722 |
| iteralex.com | 52b7199b22013a7c5cd446011ca58ed3 |
| itera.tools | fb7473ea57834a6e9ef93d2da788768f |
| itera.world | 2c6c792c36183c3e99e71f916d30d949 |
| linkea2.com | 0c9890fce9718be63e87646453e00336 |
| ltgrow.com | 491a070b96ea140b665dc7aeb2aa923c |
| nahuebianchi.com | 1fb12f6e6e6db7c8cead91225507590d |
| pachu.dev | 07cd774ed00732f0272d34cd3ba21508 |
| presskit.ar | 93208df4bf63810377a9f54a8c5c18c2 |
| quimicabambu.com.ar | 9696e5e1cf1cba90565e6a52f080862e |
| raccaestudiopenal.com | ad0e1463cdb35da201837d87caf20b48 |
| rerestudiojuridico.com | 0d81f180e08f3d4573032cfbbfc10938 |
| shope.ar | b4738d44f07dd343c28cc445e3fc3489 |
| tiendasmm.com | 0bf8d61de3f174ba0d58e1a8e9d3ed8b |

## Buckets R2 (snapshot 2026-04-26)

| Bucket | Proyecto | Creación |
|---|---|---|
| abundancia-hogar-catalogo | Abundancia Hogar (cliente) | 2026-02-22 |
| alquimica-hub-uploads | Alquímica Hub (cliente Linkea2 legacy) | 2026-01-16 |
| alquimica-projects | Alquímica CRM | 2026-03-13 |
| itera-img-gen-1 | Itera Estudio | 2026-02-14 |
| itera-shop-all | Shopear | 2026-04-05 |
| iteralex | IteraLex | 2026-03-06 |
| presskit-ar | Presskit.AR | 2026-05-26 |

## Footguns

- **El token aparece UNA SOLA VEZ** al crearlo. Si lo perdiste, regenerás uno nuevo.
- **Wrangler `r2 bucket list` falla** sin `CLOUDFLARE_ACCOUNT_ID` en env (pide `/memberships` que el token no cubre). Solución: setear el env var.
- **Wrangler y S3 API no usan el mismo token**: `cfat_...` / `CLOUDFLARE_API_TOKEN` es para Cloudflare API; Access Key ID + Secret Access Key son para S3/R2 data plane.
- **Listar objetos no es necesariamente Wrangler**: en Wrangler `4.85.0`, `wrangler r2 object list` no existe. Para inspeccionar contenido usar S3 API (`ListObjectsV2`) o rclone.
- **Cache purge tiene rate limit**: 1000 purges/24h por zona en plan Free. Para iteración intensiva, mejor bajar el `Cache-Control: max-age` en el origen (nginx) en lugar de purgar.
- **Cloudflare puede override el `Cache-Control` del origen** si tenés Page Rules, Cache Rules o "Edge Cache TTL" configurado en el dashboard. Si bajaste el TTL en nginx pero seguís viendo cache largo, revisar Caching → Cache Rules.
- **DNS records con `proxied: true`** pueden verse "lentos" en propagación porque CF mantiene el viejo en cache de su edge — purgar la zona acelera.
- **Tokens vs Global API Key**: nunca usar Global API Key (legado, scope total). Siempre tokens granulares.

## Cómo se integra con cada repo

Datos específicos de cada proyecto en su `CLAUDE.md`:

- Zone ID del dominio asociado
- Bucket R2 del proyecto
- Comandos puntuales de purga / DNS específicos

El método (esta guía) NO se duplica en los CLAUDE.md de los repos — solo se referencia.
