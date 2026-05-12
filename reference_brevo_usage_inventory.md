# Brevo — Inventario de uso en proyectos ITERA

> Snapshot al 2026-05-12. Complementa la guia canonica `reference_brevo_smtp.md`.
> Objetivo: tener visibilidad de que SaaS estan conectados a la cuenta Brevo
> ITERA, con que sender/dominio/key, para que envian emails y si consumen cuota.
>
> **Politica de secrets**: este doc nunca lista keys completas. Para validar
> identidad de una key usar longitud + hash sha256 (ver guia canonica). Nombres
> de keys = el "Name" visible en Brevo Dashboard.

## Cuenta Brevo ITERA

- Login Dashboard: `admin@itera.lat`
- Login SMTP (compartido toda la cuenta): `a730df001@smtp-brevo.com`
- SMTP relay: `smtp-relay.brevo.com:587` (STARTTLS)
- Dominio principal Workspace: `itera.lat` (alias `iteralex.com`)

Cada proyecto tiene su propia **SMTP key** (auth) y su propio **Sender** (from).
Las 3 capas (Auth + Domain + Sender) deben estar verdes en Brevo para que un
envio salga — ver `reference_brevo_smtp.md` § "Las 3 capas de Brevo".

## Inventario por proyecto

| Proyecto / SaaS | Repo local | Dominio Brevo | Sender | SMTP key name | Tipo de uso | Implementacion | Runtime env | Estado | Riesgo / nota |
|---|---|---|---|---|---|---|---|---|---|
| **ITERA Lex** | `itera-lex` | `iteralex.com` | `noreply@iteralex.com` (display name `ITERA Lex`) | `ITERA Lex` (sufijo `-WnssuAyCuLHowDgc`, longitud 95) | Transaccional con tres flujos: (a) **lead pipeline** completo (6 etapas, ver detalle abajo), (b) **soporte tickets** (3 templates), (c) **smoke test CLI**. Más una plantilla legacy sin call site activo. | `src/lib/email/send.ts` (nodemailer SMTP) + `src/lib/email/templates.ts` (12 builders, todos en tema oscuro tras migración 2026-05-12) | Coolify app `r40kockgo40wowg4w84soc4s` (contexto `modern-linux-desktop`). Vars `BREVO_SMTP_HOST/PORT/USER/KEY/SENDER_EMAIL/SENDER_NAME` confirmadas en runtime. `.env.local` espejo. | **Activo** (May 2026) | Tema 100% oscuro post 2026-05-12 → asset inline único es `logo-wordmark-inverse.png` (CID `itera-logo-wordmark-inverse@iteralex`). El PNG `logo-lockup-light.png` ya **no se adjunta** desde send.ts (se sigue usando solo en marketing/docs). Footgun histórico: key truncada en Coolify → validar longitud+hash post-update. |
| **Shope.AR** | `shope-ar` | `shope.ar` | `noreply@shope.ar` | `Shope.AR` (termina en `KT8Z1f`) | Transaccional: onboarding self-service, invitations a store members, account management, contact form, BetterAuth verification, impersonation | `src/lib/email/send.ts` (nodemailer SMTP) | Coolify (VPS modern). Vars `BREVO_*` completas. `.env` local + Coolify. Toggle `E2E_DISABLE_TRANSACTIONAL_EMAIL=1` para tests. | **Activo** (Abr 2026) | Es el que mas tipos de email envia. Multiple flows. |
| **Presskit.AR** | `presskit-ar` | `presskit.ar` | `noreply@presskit.ar` | `Presskit.AR` (termina en `BBfDfZ`) | Transaccional: confirmacion de pre-registro de tag/perfil | `src/lib/services/email.service.ts` → `src/lib/email.ts` (nodemailer SMTP, vars genericas `SMTP_*`) | `.env` local + presuntamente Coolify. Tambien tiene `BREVO_API_KEY` declarada en `.env.example` pero el codigo activo usa SMTP. | **Activo** (presunto) | Codigo usa env vars **genericas** `SMTP_HOST/USER/PASS/FROM` apuntando a Brevo, no convencion `BREVO_*`. Si se cambia de proveedor no hay que tocar codigo. |
| **ÍTERA Estudio** | `itera-estudio` | `iteraestudio.com` | `noreply@iteraestudio.com` (default `EMAIL_FROM`) | `ÍTERA Estudio` | Transaccional: BetterAuth verification email (15 creditos free al verificar) | `lib/mail.ts` (nodemailer SMTP, vars genericas `SMTP_*`) | `.env`/`.env.local` local + Coolify. | **Activo** (presunto) | Igual que Presskit: usa `SMTP_*` genericas, no `BREVO_*`. Compatible con Brevo si el host apunta al relay. |
| **Bambu Web Corporativa** | `bambu-web-corporativa-catalogo` | `bambuoficial.com.ar` | `noreply@bambuoficial.com.ar` | `Bambu Web Corporativa Form` | Forms web: contact form publico → manda a `CONTACT_RECIPIENT_EMAIL` | `src/lib/services/email.service.ts` (Brevo API REST `https://api.brevo.com/v3/smtp/email`) | `.env` local + Coolify. Vars `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CONTACT_RECIPIENT_EMAIL`. Validacion en `src/lib/env.ts` exige las 3 juntas. | **Activo** (presunto) | Caso "form simple" → API REST en lugar de SMTP. Fire-and-forget desde el route handler. |
| **Linkea2** | `linkea2` | `linkea2.com` (estado a confirmar) | a configurar via `EMAIL_FROM_ADDRESS` (placeholder `hola@itera.com` en `.env.example`) | (no visible en captura, posiblemente reusa otra) | Transaccional: onboarding (welcome, completed, followup) procesados por cron `/api/cron/process-emails` | `src/lib/email.ts` (Brevo API REST) | `.env` local. Vars `BREVO_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `CRON_SECRET`. | **Preparado** | Codigo y schema de jobs listos. Sender por configurar al sender real `noreply@linkea2.com`. Confirmar si la zona DNS tiene SPF/DKIM/DMARC. |
| **Alquímica Web Corporativa Form** | `alquimica-web-corporativa` | `alquimicaoficial.com.ar` (a confirmar en Brevo) | (sin sender configurado en codigo) | `Alquímica Web Corporativa Form` | Forms web (planeado): contact form | **Sin codigo** — el repo no tiene `nodemailer`, ni `BREVO_*` env, ni `email.service.ts` | (no aplica) | **Pendiente** | Key creada en Brevo de forma preventiva. Cuando se implemente seguir patron de Bambu (API REST). |
| **ITERA Lat** (landing principal) | `itera-lat` | `itera.lat` (a confirmar) | `admin@itera.lat` (uso histórico, no en codigo) | `ITERA Lat Web` | Forms web (planeado / historico): formulario landing | **Sin codigo** — repo es landing estatica (`next` + `framer-motion` + `lucide-react`). No tiene nodemailer ni Brevo en deps. | (no aplica) | **Pendiente** | Key creada en Brevo. Si se quiere reactivar el form, decidir API REST (es solo landing) y agregar dep. |
| **Racca Web** | `racca-web` | (no creado en Brevo aun) | (a definir) | (no creada aun) | Form de contacto (planeado) | **Sin codigo activo** — tiene `nodemailer ^8.0.5` en `package.json` pero `STATE.md` marca el form como "Pendiente" | (no aplica) | **Pendiente** | No esta en captura de Brevo todavia. Cuando arranque, crear sender + key + DNS + agregar a este inventario. |
| **iteralex.com Marketing** | (parte de `itera-lex`) | `iteralex.com` | `noreply@iteralex.com` | reusa `ITERA Lex` | Mismo proyecto que ITERA Lex (la marketing site se sirve por proxy desde el mismo repo). No es proyecto separado. | (mismo) | (mismo) | **Activo** (subset) | Solo dejar nota: el path `/contacto` y `/acceso` ambos disparan emails a `admin@itera.lat` desde el SaaS. |
| **iteraestudio.com - generador de imagenes API** | (parte de `itera-estudio`) | (mismo) | (mismo) | reusa `ÍTERA Estudio` | Backend del servicio interno `POST /api/v1/generate` (Bearer `ITERA_API_KEY`). No envia emails — pero comparte la cuenta de email del SaaS para verificacion. | (mismo) | (mismo) | **Activo** (subset) | Aclaracion: la API de imagenes en si **no envia emails**, solo el SaaS web de ÍTERA Estudio (signup verification) lo hace. |

### Resumen por estado

| Estado | Proyectos |
|---|---|
| **Activo** (envia hoy o esta semana) | ITERA Lex, Shope.AR, Presskit.AR, ÍTERA Estudio, Bambu Web Corporativa |
| **Preparado** (codigo listo, falta dato de runtime / sender real / confirmacion) | Linkea2 |
| **Pendiente** (sin codigo, key/sender pre-creados) | Alquímica Web Corporativa, ITERA Lat, Racca Web |
| **Desconocido** | (ninguno por ahora — todos los repos enumerados en la captura tienen estado claro) |

### Resumen por metodo de envio

| Metodo | Proyectos | Cuando |
|---|---|---|
| **SMTP via nodemailer** (canonico ITERA) | ITERA Lex, Shope.AR, Presskit.AR, ÍTERA Estudio | SaaS con multiples tipos de email |
| **API REST (`api.brevo.com/v3/smtp/email`)** | Bambu Web, Linkea2 | Sites estaticos con contact form / cron emails con un solo template |
| **No implementado todavia** | Alquímica, ITERA Lat, Racca Web | — |

## Criterios de control de cuota Brevo

### Que cuenta como consumo

Brevo cuenta **emails enviados con exito** desde la cuenta. No cuenta:
- bounces hard (rebotan antes de salir)
- envios bloqueados por SPF/DKIM/DMARC (no salen)
- envios skipeados localmente (`shouldSkipTransactionalEmail()`, `noop` mode)
- consumo de la API REST con response distinto de 201

Si la API REST de Brevo devuelve 2xx **o** el SMTP responde `250 2.0.0 Ok`,
ese email cuenta para la cuota.

### Plan gratuito (referencia)

- Brevo Free: 300 emails/dia (limite diario, no mensual). Sin SLA.
- Brevo Starter ($25/mes aprox): ~20.000 emails/mes, sin limite diario, dominios autenticados.
- Brevo Business: dedicated IP, sub-accounts, mas analitica.

> Confirmar plan actual de la cuenta `admin@itera.lat` desde el dashboard
> (Settings → Plan / Billing). Este doc no asume un plan especifico.

### Quien envia hoy (consumo activo)

| Proyecto | Volumen estimado | Dependencia de cuota |
|---|---|---|
| **ITERA Lex** | Bajo (<15/dia hoy en beta cerrada). Ver desglose por template abajo. | Cada lead/consulta + cada email del pipeline manual + cada ticket. Crece linealmente con leads + clientes activos. |
| **Shope.AR** | Bajo-medio (varios por onboarding nuevo) | Onboarding self-service dispara welcome + verificacion + invitations. Por cada nuevo store ~3-5 emails. |
| **Presskit.AR** | Bajo (1 por pre-registro) | 1 email por pre-registro publico. |
| **ÍTERA Estudio** | Medio (1 por signup) | Solo verification email. Crece con signups. |
| **Bambu Web** | Muy bajo (<5/dia) | Solo cuando alguien llena el form de contacto. |

**Total combinado hoy**: muy por debajo de 300/dia (free tier alcanza). El driver
principal es **Shope.AR onboarding** + **ITERA Lex lista de espera**. Si alguno
de los dos hace una campana o se vuelve viral, conviene revisar plan.

### Detalle ITERA Lex — plantillas activas (snapshot 2026-05-12)

> Todos los builders viven en `src/lib/email/templates.ts`. Tras la migración
> 2026-05-12 todas usan el wrapper oscuro (`wrapEmailDark` para emails al
> usuario, `wrapEmailDarkCompact` para emails internos/admin). Plain-text
> fallbacks intactos.

| # | Template | Receptor | Disparador (call site) | Frecuencia esperada |
|---|---|---|---|---|
| 1 | `buildLeadReceivedEmailHtml` | `admin@itera.lat` (constante `CONTACT_NOTIFICATION_RECIPIENT` en `src/app/(marketing)/contacto/actions.ts`) | Submit del form `/contacto` o `/acceso` (público, sin auth). Subject distinto si `asunto === 'Solicitar acceso anticipado'`. | 1 por submit. Hoy ~2-5/semana. |
| 2 | `buildLeadOnboardingInvitationEmailHtml` | Lead | Acción admin desde `src/lib/admin/trial-email-action-helpers.ts` y `src/lib/services/trial-email-timeline.service.ts`. Manual. | 1 por lead aprobado. |
| 3 | `buildLeadAccessReadyEmailHtml` | Lead | Acción admin (idem helpers + timeline service). También se dispara al crear tenant desde `src/app/(admin)/admin/__tests__/tenant-actions.test.ts` flow. Manual. | 1 por activación. |
| 4 | `buildTrialDay10ReminderEmailHtml` | Cliente en trial | Acción admin (helpers + timeline service). **No hay cron** — se dispara manual desde el panel admin. | 1 por cliente, día 10/14. |
| 5 | `buildTrialEndedDecisionEmailHtml` | Cliente en trial | Acción admin (idem). Incluye `BankDetails` (envs `BANK_TITULAR/CBU/ALIAS/BANCO`, override desde dialog admin). Manual. | 1 por cliente, día 14. |
| 6 | `buildFounderPaymentReceivedEmailHtml` | Cliente | Acción admin tras confirmar transferencia. Manual. | 1 por pago confirmado. |
| 7 | `buildPreNormalPricingNoticeEmailHtml` | Cliente fundador | Acción admin ~3 meses post-pago, antes de pasar a precio normal. Manual. Incluye `BankDetails`. | 1 por cliente, mes 3 del período fundador. |
| 8 | `buildSupportTicketCreatedCustomerEmailHtml` | Usuario que creó el ticket | `src/app/(app)/soporte/actions.ts → createSupportTicketAction`. | 1 por ticket. Hoy <5/semana. |
| 9 | `buildSupportTicketCreatedAdminEmailHtml` | `SUPPORT_ADMIN_EMAIL ?? SUPERADMIN_EMAIL` (= `admin@itera.lat` hoy, no hay `SUPPORT_ADMIN_EMAIL` seteado) | Idem `createSupportTicketAction`. | 1 por ticket. |
| 10 | `buildSupportTicketReplyEmailHtml` | Usuario dueño del ticket | `src/app/(admin)/admin/tickets/actions.ts → adminReplySupportTicketAction` (skip si `isInternalNote`). | 1 por respuesta no interna. |
| 11 | `buildTransactionalTestEmailHtml` | A elección por CLI | Script `pnpm email:test <addr>` (`scripts/send-test-transactional-email.ts`). | On-demand (smoke test dev). |
| 12 | `buildTrialInvitationEmailHtml` | — (legacy) | Sin call site productivo. Solo se ejercita en tests para garantizar el escape. Candidato a remover si no vuelve a usarse. | 0 |

**Sumario para ITERA Lex hoy**:
- Driver dominante: pipeline manual de leads. 1 lead que recorre todo el embudo dispara ~6-7 emails repartidos en 3 meses (templates 2 → 7).
- Form público (template 1) suma ~2-5 emails/semana al admin.
- Soporte (templates 8-10): hoy <5/semana, dos emails por cada ticket creado + uno por cada respuesta del admin.
- Smoke test (template 11): cuenta para la cuota cada vez que se corre `pnpm email:test`. No abusarlo.
- Total estimado actual: **~10-15 emails/semana**, lejos del free-tier de 300/día. Si se abre la beta o entran 10 leads en una semana, podría picar a ~50-80 emails/semana — sigue holgado.

### Solo preparado / pendiente (no consumen)

- **Linkea2**: codigo listo pero `BREVO_API_KEY` no esta seteada en runtime.
  Cuando se active el cron, sube consumo (welcome + completed + followup =
  3 emails por nuevo onboarding).
- **Alquímica, ITERA Lat, Racca**: 0 envios. Solo ocupan slot de "key creada"
  en Brevo (no afecta cuota).

### Recomendaciones

1. **Auditoria de senders cada 6 meses**: bajar a la cuenta Brevo, listar
   senders + keys, comparar con este inventario. Eliminar lo que no se usa.
2. **Volumetria mensual**: revisar Brevo Dashboard → Statistics. Si se acerca
   al 60% del limite del plan, replantear:
   - Subir de plan (si justificado por proyectos activos).
   - Mover proyectos de bajo valor a un proveedor distinto (SES, Resend) para
     liberar cuota.
3. **Separar cuentas si crece >1 SaaS pago**: cuando Shope.AR o ITERA Lex sean
   pagos con clientes reales, conviene tener cuenta Brevo dedicada para evitar
   que un bug en otro proyecto consuma cuota o afecte reputation del IP
   compartido.
4. **Dedicated IP**: solo justificado si el volumen mensual supera ~50k. Hoy
   estamos lejos.
5. **No mezclar marketing emails y transactional**: Brevo separa los flujos
   (Email Campaigns vs Transactional). Si en algun momento se manda
   newsletter/marketing, usar Campaigns y mantener las keys SMTP solo para
   transactional.
6. **Bounce handling**: Brevo desactiva senders que rebotan mucho. Si un
   proyecto dispara muchos hard bounces (lista vieja, emails invalidos),
   afecta a TODOS los demas (misma cuenta, mismo IP compartido).

## Checklist al sumar un nuevo SaaS

Basado en `reference_brevo_smtp.md` § "Checklist para proyecto nuevo" + el
proceso operativo aprendido en ITERA Lex y Shope.AR.

1. **Crear sender** en Brevo (Settings → Senders, Domains & Dedicated IPs → tab
   Senders → Add a sender):
   - Nombre visible: nombre del proyecto (ej: `Mi App`)
   - Email: `noreply@dominio-del-proyecto.com`
   - Si el dominio aun no esta verificado, Brevo no deja completarlo.
2. **Verificar dominio** (Settings → Domains → Add a domain):
   - Brevo da 3 records DNS (SPF, DKIM, DMARC).
   - Cargar en Cloudflare (o el DNS del dominio).
   - Volver a Brevo → "Authenticate this domain". Esperar verificacion.
3. **Generar SMTP key con nombre del proyecto** (Settings → SMTP & API → tab
   SMTP → Generate a new SMTP key):
   - Nombre: identico al del proyecto (`Mi App`). El nombre aparece en este
     inventario y en `reference_brevo_smtp.md`.
   - Copiar la key una sola vez (Brevo no la muestra de nuevo).
4. **Decidir metodo**: SMTP via nodemailer (recomendado para SaaS) vs API REST
   (recomendado solo para sites estaticos con contact form). Ver guia canonica
   § "SMTP vs API REST".
5. **Cargar env vars** en `.env.local` y en runtime (Coolify u otro):
   - SMTP: `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`,
     `BREVO_SMTP_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.
   - API REST: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (+ `CONTACT_RECIPIENT_EMAIL`
     si es contact form).
   - En Coolify: `BREVO_SMTP_KEY` y `BREVO_SENDER_EMAIL` con `--is-literal`.
6. **Smoke test desde local** (si el proyecto tiene script equivalente al
   `pnpm email:test` de ITERA Lex):
   ```bash
   pnpm email:test admin@itera.lat
   ```
   Validar que Brevo Dashboard → Statistics → Last events muestre el envio.
7. **Test desde flujo real**: gatillar el flujo de prod (signup, contact form,
   pre-registro). Verificar inbox del destinatario. No confiar solo en logs:
   un envio puede dar 2xx y caer en spam o ser rechazado en post-processing.
8. **Revisar logs**:
   - App: log de envio + messageId.
   - Brevo: Dashboard → Statistics → Email events. "Last used on" en la key
     debe haberse actualizado.
9. **Validar runtime contra container productivo** (si aplica): comparar
   longitud + sha256 de la key entre `.env.local`, Coolify env, y env real
   del container. Comando en guia canonica § "Verificacion operativa
   validada".
10. **Registrar en este inventario**: agregar fila a la tabla "Inventario por
    proyecto" arriba con todos los campos. No commitear keys ni longitudes —
    solo nombres y rutas.

## Mantenimiento de este documento

- Actualizar cuando se agregue/elimine un proyecto o se cambie sender/key.
- Revisar cada vez que la guia canonica `reference_brevo_smtp.md` cambie.
- Sincronizar con la cuenta Brevo real cada 6 meses (auditoria de senders).
- Si se rota una key (revocar y crear nueva), mantener el mismo `name` para
  que las referencias en este doc no queden obsoletas.
