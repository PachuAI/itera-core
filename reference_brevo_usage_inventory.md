# Brevo — Inventario de uso en proyectos ITERA

> Snapshot al 2026-05-12. Actualizado 2026-05-27 (sumado **ÍTERA Lex Tools**).
> Complementa la guia canonica `reference_brevo_smtp.md`.
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
| **ÍTERA Lex Tools** | `itera-lex-tools/web` | `iteralex.com` (compartido con el SaaS; mismo domain auth) | `noreply@iteralex.com` (display name efectivo `ÍTERA Lex`; `send.ts` normaliza el legacy `ÍTERA Lex Tools`) | Key SMTP **dedicada**, distinta de la del SaaS (longitud 90, sha256 `ee83c672…`; nombre Brevo probable `ÍTERA Lex Tools`, confirmar en dashboard) | Transaccional self-serve para abogados: (a) **verificación de email** BetterAuth (activo), (b) **reset de contraseña** (activo), (c) **bienvenida** (pending wiring). | `src/lib/email/send.ts` (nodemailer SMTP; bloquea links localhost salvo `ITERA_TOOLS_ALLOW_LOCALHOST_EMAILS=true`) + builders en `src/lib/email/` + wrapper branded `wrap.ts` (paleta del SaaS, encabezado textual `ÍTERA Lex`) + registry `registry.ts`. Visor de previews propio en `/admin/dev/emails` (gated `requireAdminSession`). | Coolify app `rmfj4cm2d1e328s34f0f09eh` (`ITERA Lex Tools Web`, contexto `modern-linux-desktop`, `herramientas.iteralex.com`). Vars `BREVO_SMTP_*` + `BREVO_SENDER_*` confirmadas en runtime; `.env.local` espejo. | **Activo** (May 2026) | Comparte sender + dominio `iteralex.com` con el SaaS → reputación de bounce/IP compartida. Desde 2026-05-27 el header del email no usa imagen remota, para evitar íconos de imagen rota en Gmail. Volumen depende de `SELF_SERVICE_SIGNUP_ENABLED`. |
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
| **Activo** (envia hoy o esta semana) | ITERA Lex, ÍTERA Lex Tools, Shope.AR, Presskit.AR, ÍTERA Estudio, Bambu Web Corporativa |
| **Preparado** (codigo listo, falta dato de runtime / sender real / confirmacion) | Linkea2 |
| **Pendiente** (sin codigo, key/sender pre-creados) | Alquímica Web Corporativa, ITERA Lat, Racca Web |
| **Desconocido** | (ninguno por ahora — todos los repos enumerados en la captura tienen estado claro) |

### Resumen por metodo de envio

| Metodo | Proyectos | Cuando |
|---|---|---|
| **SMTP via nodemailer** (canonico ITERA) | ITERA Lex, ÍTERA Lex Tools, Shope.AR, Presskit.AR, ÍTERA Estudio | SaaS con multiples tipos de email |
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
| **ÍTERA Lex Tools** | Muy bajo (hoy) | 1 verificación por alta self-serve + (cuando se cablee) 1 por reset de contraseña. Crece con registros de abogados; gated por `SELF_SERVICE_SIGNUP_ENABLED`. |

**Total combinado hoy**: muy por debajo de 300/dia (free tier alcanza). El driver
principal es **Shope.AR onboarding** + **ITERA Lex lista de espera**. Si alguno
de los dos hace una campana o se vuelve viral, conviene revisar plan.

### Detalle ITERA Lex — templates (snapshot 2026-05-16)

> Todos los builders viven en `src/lib/email/templates.ts`. Tras la migración
> 2026-05-12 todos los activos usan el wrapper oscuro (`wrapEmailDark` para
> emails al usuario, `wrapEmailDarkCompact` para emails internos/admin).
> Plain-text fallbacks intactos.
>
> Cada fila incluye:
> - **Key**: identificador estable usado en la timeline (`trial-email-timeline.service.ts`) y en el visor de previews. Si no participa de la timeline de trial, queda fuera de scope del enum `TrialEmailTimelineKey` y se nombra ad-hoc.
> - **Builder**: nombre del export en `templates.ts`. `—` = pendiente de crear.
> - **Estado**: `Activo` (productivo) · `Pendiente` (en pipeline pero falta builder + wiring) · `Legacy` (existe el builder pero sin call site productivo, candidato a remover).

| # | Key | Builder | Receptor | Estado | Call site / disparador | Frecuencia esperada |
|---|---|---|---|---|---|---|
| 1 | `lead_received` (form público) | `buildLeadReceivedEmailHtml` | `admin@itera.lat` (constante `CONTACT_NOTIFICATION_RECIPIENT`) | **Activo** | `src/app/(marketing)/contacto/actions.ts` — submit de `/contacto` o `/acceso`. Subject distinto si `asunto === 'Solicitar acceso anticipado'`. | 1 por submit. Hoy ~2-5/semana. |
| 2 | `onboarding_invitation` | `buildLeadOnboardingInvitationEmailHtml` | Lead | **Activo** | `src/lib/admin/trial-email-action-helpers.ts → createInvitationEmailSender()`. Se dispara desde panel admin (`src/app/(admin)/admin/trial-email-actions.ts`) o flujo lead. Manual. | 1 por lead aprobado. |
| 3 | `first_access` (acceso listo) | `buildLeadAccessReadyEmailHtml` | Usuario del tenant recién creado | **Activo** | `trial-email-action-helpers.ts → createAccessEmailSender()` + `sendProvisionedFirstAccessEmail()` (auto al crear tenant desde el lead). Manual o auto post-provisioning. | 1 por activación. |
| 4 | `trial_day_2` | `—` (pendiente) | Tenant admin | **Pendiente** | Timeline ya define key + audience + scheduling (día 2 desde `trialStartsAt`). Falta: (a) builder en `templates.ts`, (b) sender en `trial-email-action-helpers.ts`, (c) wiring en `trial-email-timeline.service.ts` (hoy retorna `unavailableReason: 'Template pendiente'`). Trigger = `automatic` (eventualmente cron, hoy ni eso). | 1 por tenant, día 2 del trial. |
| 5 | `trial_day_5` | `—` (pendiente) | Tenant admin | **Pendiente** | Igual que `trial_day_2` pero día 5. Subject sugerido (ya en service): "Una causa completa de punta a punta". | 1 por tenant, día 5 del trial. |
| 6 | `trial_day_10` | `buildTrialDay10ReminderEmailHtml` | Tenant admin | **Activo** | `trial-email-action-helpers.ts → createTrialDay10ReminderEmailSender()`. Trigger en timeline = `manual` (no hay cron). Subject incluye `daysLeft` dinámico. | 1 por cliente, día 10/14. |
| 7 | `trial_ended_decision` | `buildTrialEndedDecisionEmailHtml` | Tenant admin | **Activo** | `trial-email-action-helpers.ts → createTrialEndedDecisionEmailSender(bankDetails)`. Incluye `BankDetails` (envs `BANK_TITULAR/CBU/ALIAS/BANCO`, override desde dialog admin). Manual. | 1 por cliente, día 14. |
| 8 | `founder_payment_received` | `buildFounderPaymentReceivedEmailHtml` | Tenant admin | **Activo** | `trial-email-action-helpers.ts → createFounderPaymentReceivedEmailSender({ founderStartAt, founderEndAt, normalStartAt, normalPriceLabel })`. Manual, tras confirmar transferencia. | 1 por pago confirmado. |
| 9 | `pre_normal_pricing_notice` | `buildPreNormalPricingNoticeEmailHtml` | Tenant admin (fundador) | **Activo** | `trial-email-action-helpers.ts → createPreNormalPricingNoticeEmailSender(bankDetails)`. Manual, ~7 días antes del fin del período fundador. Incluye `BankDetails`. | 1 por cliente, mes 3 del fundador. |
| 10 | `support_ticket_created_customer` | `buildSupportTicketCreatedCustomerEmailHtml` | Usuario que creó el ticket | **Activo** | `src/app/(app)/soporte/actions.ts → sendTicketCreatedEmails()`. | 1 por ticket. Hoy <5/semana. |
| 11 | `support_ticket_created_admin` | `buildSupportTicketCreatedAdminEmailHtml` | `SUPPORT_ADMIN_EMAIL ?? SUPERADMIN_EMAIL` (= `admin@itera.lat` hoy) | **Activo** | Idem `sendTicketCreatedEmails()`. | 1 por ticket. |
| 12 | `support_ticket_reply` | `buildSupportTicketReplyEmailHtml` | Usuario dueño del ticket | **Activo** | `src/app/(admin)/admin/tickets/actions.ts → adminReplySupportTicketAction` (skip si `isInternalNote`). | 1 por respuesta no interna. |
| 13 | `transactional_test` (smoke test) | `buildTransactionalTestEmailHtml` | A elección por CLI | **Activo** (no productivo) | Script `pnpm email:test <addr>` (`scripts/send-test-transactional-email.ts`). | On-demand (smoke test dev). |
| 14 | `trial_invitation_legacy` | `buildTrialInvitationEmailHtml` | — | **Legacy** | Sin call site productivo. Solo se ejercita en tests para garantizar el escape. Candidato a remover si no vuelve a usarse. | 0 |

**Sumario para ITERA Lex hoy** (sólo activos productivos):
- Driver dominante: pipeline manual de leads. 1 lead que recorre todo el embudo dispara ~6-7 emails repartidos en 3 meses (rows 2 → 9).
- Form público (row 1) suma ~2-5 emails/semana al admin.
- Soporte (rows 10-12): hoy <5/semana, dos emails por cada ticket creado + uno por cada respuesta del admin.
- Smoke test (row 13): cuenta para la cuota cada vez que se corre `pnpm email:test`. No abusarlo.
- Total estimado actual: **~10-15 emails/semana**, lejos del free-tier de 300/día. Si se abre la beta o entran 10 leads en una semana, podría picar a ~50-80 emails/semana — sigue holgado.

**Pendientes (rows 4-5)**: cuando se implementen y queden en automático, suman 2 emails extra por cada tenant nuevo durante los primeros 5 días. Con 10 nuevos tenants/mes el impacto sigue siendo despreciable (20/mes). Cuando se implementen, mover su fila a `Activo` y confirmar trigger (manual vs cron `/api/cron/...`).

### Visor de previews local

Para inspeccionar el HTML de cada template renderizado con datos de ejemplo
sin disparar envíos reales, ITERA Lex expone un visor interno bajo
`/admin/dev/emails` (gated por `getSuperAdminOrRedirect`). El visor:

- Lista todos los templates de la tabla anterior (activos, pendientes y legacy) leyendo el registry central en `src/lib/email/registry.ts`.
- Renderiza el HTML en un iframe con viewport toggleable (desktop / mobile).
- Permite editar los `input` props (form auto-generado a partir del registry).
- Reemplaza la imagen embedida vía CID (`cid:itera-logo-wordmark-inverse@iteralex`) por el asset local `/logo-wordmark-inverse.png` para que se vea en el browser sin pasar por Brevo.
- Para templates con estado `Pendiente` muestra un placeholder con la metadata + link a la fila correspondiente de este inventario.

Disponible en este repo. Otros SaaS de la cuenta Brevo (Shope.AR, ÍTERA Lex Tools)
mantienen su propio inventario y su propio visor.

### Detalle ÍTERA Lex Tools — templates (snapshot 2026-05-27)

> Portal público `herramientas.iteralex.com` con cuentas self-serve para abogados
> (Google o email/password con verificación). Builders en `web/src/lib/email/` con
> wrapper branded dark `wrap.ts` (replica la paleta de `wrapEmailDark` del SaaS).
> Desde 2026-05-27 el encabezado usa texto `ÍTERA Lex`, no imagen remota, para
> evitar logos rotos cuando Gmail bloquea imágenes. `send.ts` bloquea links
> `localhost` salvo opt-in explícito `ITERA_TOOLS_ALLOW_LOCALHOST_EMAILS=true`.
> Visor de previews propio en `/admin/dev/emails` (gated `requireAdminSession`), registry en
> `web/src/lib/email/registry.ts`.

| # | Key | Builder | Estado | Disparador / nota |
|---|---|---|---|---|
| 1 | `email_verification` | `buildVerificationEmailHtml` | **Activo** | `src/lib/auth.ts` → BetterAuth `emailVerification.sendVerificationEmail`. Branded. |
| 2 | `password_reset` | `buildPasswordResetEmailHtml` | **Activo** | UI `/recuperar` + `/restablecer-contrasena` + cableado BetterAuth (`sendResetPassword` + `authClient.resetPassword`). |
| 3 | `welcome` | `buildWelcomeEmailHtml` | **Diseñado (pending wiring)** | Onboarding post-verificación (jurisprudencia / valores UMA-IUS-JUS / fallos guardados). HTML listo; falta cablear el hook que lo dispara. |
| 4 | `saved_rulings_digest` | `buildSavedRulingsDigestEmailHtml` | **Diseñado (pending wiring)** | Digest de novedades de fallos guardados (lista título/tribunal/fecha/link → `/cuenta?tab=fallos`). Falta detección de novedades + cron. |
| 5 | `email_change` | `buildEmailChangeEmailHtml` | **Diseñado (pending wiring)** | Confirmación al nuevo correo. Falta habilitar BetterAuth `changeEmail` + UI de cuenta. |
| 6 | `account_deletion` | `buildAccountDeletionEmailHtml` | **Diseñado (pending wiring)** | Confirmación con link de baja (borra cuenta + fallos guardados). Falta habilitar BetterAuth `deleteUser` + UI de cuenta. |

> "Diseñado (pending wiring)": el HTML branded está listo y se previsualiza en el visor (status `pending` + builder presente), pero todavía no hay disparador que los envíe.

Sender `noreply@iteralex.com` (display `ÍTERA Lex Tools`), key SMTP **dedicada** (≠
key del SaaS, verificado por hash). Vars `BREVO_*` confirmadas en runtime Coolify
(`rmfj4cm2d1e328s34f0f09eh`). El volumen real depende de `SELF_SERVICE_SIGNUP_ENABLED`.

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
