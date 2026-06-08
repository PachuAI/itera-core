# Project Map — ITERA

> Indice priorizado de todos los proyectos en `~/projects/`.
> La seccion **Tiers** refleja prioridad real de negocio (compromiso 2026).
> La seccion **Stack** sigue clasificando por capas tecnicas para propagar reglas via `/sync`.
> Ultima actualizacion: 2026-04-26

---

## Tiers de prioridad

### Tier 1 — Foco activo del semestre

Los dos SaaS que el roadmap marca como compromiso de cierre antes de septiembre 2026. Sin clientes pagos todavia, pero ambos avanzan dia a dia.

| Proyecto | Repo | Estado | Notas |
|----------|------|--------|-------|
| **Shopear** | `shope-ar` | Pivot a SaaS multitenant casi terminado | Sin clientes operativos pero queda muy poco. Avanza dia a dia. |
| **IteraLex** | `itera-lex` | Beta con estudio juridico amigo (validacion) | Frenado por verificacion Google Drive (auditoria externa cara). Plan B definido: agregar fuente alternativa de storage como fallback, pendiente de implementar. |

### Tier 2 — Importante, no urgente este semestre

Roadmap dice que tienen que estar online/funcionando, pero no son la pelea diaria.

| Proyecto | Repo | Estado | Notas |
|----------|------|--------|-------|
| **Linkea2** | `linkea2` | Pausado intencionalmente | El producto se llama **Linkea2** (juego de palabras, no "IteraLink" ni "Linkeados" ni "itera-link"). Tiene core implementado y multitenancy avanzada, pero se freno para no abrir un tercer frente mientras Shopear+IteraLex no esten cerrados. |
| **Itera Estudio** | `itera-estudio` | Multitenant listo, sin usuarios | Actua como wrapper personal de Gemini API y como ecosistema (sirve generacion de imagenes a Shopear/Linkea2). Sin plan de scale ni marketing este semestre. |
| **itera.lat** | `itera-lat` | En stand-by por modelo no definido | Pagina de la marca paraguas. Objetivo: terminarla esta semana. |
| **pachu.dev** | `pachu-dev` | Practicamente vacio | Marca personal. Requiere rebranding fuerte y landing minima que muestre IteraLex, Shopear y un par de cosas en lugar del ruido actual. |
| **presskit.ar** | `presskit-ar` | Avanzado, congelado por tiempo | Sideproject por pasion (musicos). Compromiso liviano: vivo con gente adentro. |

### Tier 2 — Meta-infraestructura

Carpetas que sostienen al resto. No son productos pero son load-bearing.

| Proyecto | Repo | Rol |
|----------|------|-----|
| **Sistema de reglas tecnicas** | `itera-core` | CLAUDE.md template, TOOLING-STANDARD, este PROJECT-MAP, guides operativas (seed, db tunnel, schema rollout) |
| **Contexto de negocio/marca** | `itera-context` | Master context, manual de marca, estrategia de contenido, BRIEFs de producto, infra (VPS/Coolify), DESIGN.md |
| **Taller grafico** | `itera-social` | Genera assets visuales (verticales, web-assets, logos, motion) de todos los SaaS via HTML + Playwright |

### Tier 3 — Clientes

Mantenimiento y cierres puntuales, sin roadmap propio.

| Proyecto | Repo | Estado |
|----------|------|--------|
| **Racca web** | `racca-web` | Web corporativa minimalista para amigo. En curso, casi terminada. |
| **Alquimica web corporativa** | `alquimica-web-corporativa` | Sin terminar, esperando feedback del cliente. |
| **Bambu web + catalogo** | `bambu-web-corporativa-catalogo` | En testing, pausado por feedback del cliente. |
| **Abundancia Hogar** | `abundancia-hogar` | En produccion. Tecnicamente terminado, abierto a bugfixes. |
| **Alquimica CRM** | `alquimica-crm` | En produccion. Mantenimiento sin roadmap. |
| **Alquimica Hub** | `alquimica-hub` | Cerrado. Sistema simple, no presenta problemas, ya no recibe features. |

### Tier 4 — Stand-by / archive

Repos vivos pero fuera de foco. No tocar salvo decision explicita.

| Proyecto | Repo | Estado |
|----------|------|--------|
| **IteraTube** | `itera-tube` | Sin foco, no esta en el roadmap |
| **WSP Facil** | `wsp-facil` | Sin foco, no esta en el roadmap |
| **YT Downloader** | `itera-yt-downloader` | Pausado, sin deploy |
| **Chatbots Platform** | `itera-chatbots-platform` | Stand-by |
| **IteraLex Docs** | `itera-lex-docs` | Pausado |
| **Mock Codex 5.5** | `mock-codex-5-5` | Scratch / experimento, candidato a borrar |

---

## Naming notes

- **Linkea2** es el nombre canonico del producto. Repo: `linkea2`. NO usar "IteraLink", "Linkeados" ni "itera-link" en docs nuevas.
- **IteraDesk** es el SaaS abstraido de Alquimica CRM. Sigue como standalone Laravel gestionado, no se esta portando ahora pero hay specs tecnicas en `itera-context/proyectos/itera-desk/` por si retoma.
- **Shopear** se escribe asi en marketing; el repo es `shope-ar` (dominio).

---

## Clasificacion tecnica por capas

> Util para propagar reglas via `/sync` entre proyectos del mismo stack.

| Proyecto | auth | crud | ai | files | marketing | Otras capas |
|----------|------|------|----|-------|-----------|-------------|
| itera-lex | BA+MT | P7 | Anthropic+Google | R2+Drive | landing+blog | calendar, payments, transcription, tts, pdf |
| itera-estudio | BA | P7 | Gemini | R2 | — | API interna (ecosistema) |
| linkea2 | BA | P7 | — (Itera Estudio API) | R2 | landing+SEO | banners IA, link-in-bio, MT en desarrollo |
| shope-ar | BA | P7 | — (Itera Estudio API) | R2 | landing+SEO | whatsapp (checkout), MT en desarrollo |
| itera-chatbots-platform | BA | P7 | AI SDK v6 | — | — | realtime (SSE widget) |
| bambu-web-corporativa-catalogo | BA | P7 | — | R2 | corporativa+catalogo | email (captacion) |
| alquimica-web-corporativa | BA | P7 | — | — | corporativa | email (contacto) |
| alquimica-hub | NA5 | P5 | — | R2 | link-in-bio | precios multi-lista |
| presskit-ar | NA5 | P5 | — | R2/local | — | email (nodemailer), pdf |
| itera-tube | NA5 | P5 | Gemini | — | — | tts (ElevenLabs), scraping (yt-dlp) |
| wsp-facil | NA5 | P5 | OpenAI+Gemini | — | — | transcription (Groq+Whisper+ElevenLabs) |
| itera-yt-downloader | NA5 | P5 | — | — | — | scraping (yt-dlp), realtime (SSE) |
| itera-lat | — | — | — | — | portfolio | — |
| itera-lex-docs | — | — | — | — | documentacion | — |
| pachu-dev | — | — | — | — | landing personal | — |
| racca-web | — | P? | — | — | corporativa | — |
| itera-social | — | — | — | — | — | taller grafico (HTML+Playwright) |

> **BA** = BetterAuth, **NA5** = NextAuth v5, **MT** = multi-tenant, **P7** = Prisma 7, **P5** = Prisma 5

---

## Grupos de afinidad (para `/sync`)

### Grupo 1 — SaaS (Tier 1 + 2)

**Proyectos**: itera-lex, itera-estudio, linkea2, shope-ar

**Stack comun**: Next.js 16 + Prisma 7 + BetterAuth + Tailwind v4 + shadcn/ui

**Reglas que fluyen dentro del grupo**:
- BetterAuth (globalThis singleton, nextCookies, disableRefresh, imports, CLI)
- Prisma 7 completo (prisma.config.ts, generated imports, $transaction, findMany+take)
- Multi-tenant: registro publico, tenant isolation, ownership validation
- Service layer obligatorio (auth -> authorize -> validate -> service -> audit -> revalidate)
- Security checklists completos (IDOR, FK validation, ownership, upload validation)
- DB ops: 3 carriles canonicos (seed via API + SSH tunnel + schema rollout manual). Cada repo lista sus datos especificos en su CLAUDE.md, no duplica metodo.
- Ecosistema: integracion via Itera Estudio API para generacion de imagenes (Shopear banners, Linkea2 banners)
- AI (donde aplique): prompts en ingles, rate limiting, confirmacion humana para side effects

**Referencia**: itera-lex es el proyecto mas maduro del grupo (MT completo, billing, AI).

**Notas**:
- linkea2 y shope-ar estan en transicion de single-tenant a multi-tenant.
- alquimica-hub es el repo legacy de Linkea2 (solo produccion del cliente, no recibe features).

### Grupo 2 — Web + Catalogo + Admin (clientes)

**Proyectos**: bambu-web-corporativa-catalogo, alquimica-web-corporativa, presskit-ar, racca-web

**Stack comun**: Next.js 16 + Prisma (5 o 7) + auth (donde aplique) + sitio publico + panel admin

**Reglas**:
- Admin panel con guard de auth
- Catalogo publico con SEO (sitemap, robots, OG images, metadata)
- Upload de imagenes a R2 (MIME validation, file.size server-side)
- Zod forms con React Hook Form
- Deploy Docker/Coolify
- Queries publicas filtrar por estado (published/active)

### Grupo 3 — Content Tools (Tier 4)

**Proyectos**: itera-tube, wsp-facil, itera-yt-downloader

**Stack comun**: Next.js 16 + Prisma 5 + NextAuth v5 + procesamiento de media

**Reglas**:
- yt-dlp CLI para scraping (NUNCA youtube-transcript npm)
- Rate limiting para APIs externas (Gemini, ElevenLabs, Groq)
- SSE/streaming para progreso en tiempo real
- AI analysis con parseo defensivo de responses
- Audio/video processing con limites de tamano

**Diferencias internas**:
- itera-tube: TTS (ElevenLabs), YouTube content
- wsp-facil: STT (Groq+Whisper+ElevenLabs Scribe), WhatsApp audio
- itera-yt-downloader: download + metadata extraction

### Grupo 4 — Marketing / Static

**Proyectos**: itera-lat, itera-lex-docs, pachu-dev

**Stack comun**: Next.js 16 + Tailwind v4 + contenido estatico

**Reglas**:
- SEO (metadata, sitemap, robots, OG images)
- Performance (next/image, lazy loading, Framer Motion)
- Sin Prisma, sin auth, sin server actions
- Deploy estatico o SSG

---

## Como usar este mapa

1. **Foco semanal**: si dudas que tocar, mira Tier 1 primero, despues Tier 2.
2. **Propagar reglas**: cuando un proyecto descubre un error/patron, verificar si aplica a otros del mismo grupo.
3. **`/sync`**: correr desde `~/projects/` para detectar reglas que estan en un proyecto pero no en otros del mismo grupo.
4. **Nuevo proyecto**: ubicarlo en el grupo correcto y copiar el CLAUDE.md del proyecto mas afin como base.
5. **Cross-pollination**: reglas de Grupo 1 pueden bajar a Grupo 2 (ej: security checklists). Reglas de Grupo 3 pueden subir a Grupo 1 (ej: rate limiting AI).
