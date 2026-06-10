# HANDOFF — Organización de la máquina (projects + home + Obsidian)

> Documento de traspaso para retomar en sesión limpia. Generado 2026-06-05.
> Máquina: `pachu-desktop-linux` (Linux Mint 22.3). Home: `/home/pachu`.

## Objetivo

Ordenar TODO el desorden acumulado, en 3 frentes independientes:
1. **`~/projects/`** — 28 carpetas planas de repos → estructura por categorías.
2. **`~/` (home)** — se pobló de archivos sueltos, media pesada y carpetas que el usuario ya no reconoce.
3. **Obsidian** — montar la capa de conocimiento (notas/docs) separada del código.

Regla mental clave: **código ≠ conocimiento.** El código se ordena con filesystem+git. El
conocimiento (notas, business context, análisis) con Obsidian. NO mezclar (ver sección Obsidian).

---

## ⚠️ REGLAS DE SEGURIDAD (aprendidas a los golpes esta semana)

1. **NUNCA `rm -rf` de algo que no esté en git sin mostrarle al usuario qué es y confirmar.**
   Esta sesión se borró `jubilo-refactor-visual/` (6 docs de análisis sin backup) tras un "se puede
   borrar" — hubo que recuperarlo de los transcripts. No repetir.
2. **Para material valioso o dudoso: MOVER a `~/_revisar-borrar/` en vez de borrar.** Borrado real
   solo después de confirmar.
3. **Verificar backup (git push) ANTES de borrar nada.** Si no está en git ni en otro lado, primero respaldar.
4. **Recuperación de archivos generados por Claude:** los transcripts en
   `~/.claude/projects/<cwd-encoded>/*.jsonl` guardan el `content` completo de cada `Write`. Si se
   borró algo que Claude generó, se puede reconstruir parseando el jsonl (buscar tool_use Write).
5. **No batchear llamadas Bash frágiles** (multilínea, `VAR=$(...)`, psql) en un solo bloque paralelo:
   si una falla, el harness cancela todo el lote. (Regla del CLAUDE.md global.)
6. **Read antes de Edit/Write. Mirar el target antes de borrar/sobrescribir.**

---

## FRENTE 1 — `~/projects/` (reorg de repos)

### Estructura objetivo
```
~/projects/
├── saas/          shope-ar, linkea2, itera-estudio, itera-chatbots-platform,
│                  itera-lat, presskit-ar, itera-lex-docs, itera-lex-tools, itera-lex-mcp
├── clientes/      racca-web, alquimica-crm, alquimica-hub, alquimica-web-corporativa,
│                  bambu-web-corporativa-catalogo, abundancia-hogar, jubilo-refactor-visual
├── personal/      pachu-dev, my-voice
├── archive/       itera-tube, wsp-facil, itera-yt-downloader
├── scratch/       solodev, open-design, ultimate-ux-ui   (renombrar: sin espacios)
├── itera-lex/                  ← root TEMPORAL (DIFERIDO: tests en curso, no mover)
├── itera-lex-calendar-outbox/  ← root (worktree de itera-lex, NO tocar)
├── itera-lex-wt-archivos-ux/   ← root (worktree de itera-lex, NO tocar)
├── worktrees/                  ← root (worktrees de itera-lex-tools api/web, resuelto)
├── itera-core/  ← root (META-INFRA, NO MOVER)
├── itera-context/        ← root (META-INFRA, NO MOVER)
├── itera-social/         ← root (META-INFRA, NO MOVER)
└── .claude/              ← root (config workspace, NO MOVER)
```

### Decisiones firmes (ya consultadas con el usuario)
- **Las 3 meta-infra (`itera-core`, `itera-context`, `itera-social`) QUEDAN en el root.**
  Están cableadas por path absoluto ~42 veces en `~/.claude/CLAUDE.md` + skills (itera-social 21,
  itera-core 14, itera-context 7). Moverlas rompe skills (brandboard, guías Coolify/DB/seed,
  API imágenes). NO mover, NO reescribir esos paths.
- **`itera-lex` NO se toca** — hay tests corriendo. Se migra a `saas/` en otra sesión. Sus 2 worktrees
  (`itera-lex-calendar-outbox`, `itera-lex-wt-archivos-ux`) quedan en root.
  - worktree `ui/archivos-carga-menu` → ya mergeada en master (descartable).
  - worktree `fix/calendar-sync-outbox` → NO mergeada, 1 commit local-only sin pushear: preservar antes de remover.
- **`jubilo-refactor-visual` → `clientes/`** — ahora es proyecto real de cliente (refactor visual de
  un sistema Symfony con datos médicos de pacientes). ⚠️ Contiene `archivos-sistema-original/` y
  `scraping-prod/` con DATOS SENSIBLES — ya están en `.gitignore`, NUNCA pushear esos paths. Repo
  privado `PachuAI/jubilo-refactor-visual` ya existe (solo tiene los 6 .md de análisis).

### Caveats de ejecución
- Cerrar dev servers / procesos de un repo ANTES de `mv` (un mv con proceso adentro lo rompe).
- `git mv` no aplica (son repos enteros): mover la carpeta con `mv`, el `.git` viaja con ella.
- Tras mover: `git -C <nueva-ruta> status && git remote -v` para verificar integridad.
- Actualizar **`itera-core/PROJECT-MAP.md`** con las rutas nuevas (es el índice que lee `/sync`).
- Cross-refs opcionales en docs de meta-infra (~10 links a linkea2/shope-ar/itera-estudio/itera-lex) → opcional actualizar.

### Estado de backup de repos (al 2026-06-05) — TODO RESPALDADO
- Todos los repos tienen remote y los "commits ahead" están en ramas que existen en remoto (sin riesgo).
- Respaldados esta semana: `solodev`, `my-voice` (PachuAI privados); `itera-lex-tools` workspace
  (`iteralat/itera-lex-tools` privado, versiona solo docs raíz); `jubilo-refactor-visual` (PachuAI privado).
- itera-lex-tools son 3 sub-repos hermanos (web/api/egress) bajo `iteralat`, cada uno con su git.

---

## FRENTE 2 — `~/` (home) — clutter a clasificar

> ⚠️ **DIFERIDO (2026-06-09) — FUERA DEL PLAN ACTIVO.** El usuario lo hará por su cuenta como tarea
> extra ("las carpetas a ese nivel no afectan mucho"). NO es bloqueante para el vault. El inventario
> de abajo queda como referencia. Lo único del home que toca el vault son 3 notas sueltas (ver
> «Actualización 2026-06-09» al final).

El usuario NO reconoce buena parte de esto. Para CADA item: investigar qué es → clasificar
KEEP / MOVER-a-su-lugar / BORRAR / BACKUP-primero. NO borrar nada pesado sin confirmar.

### Carpetas grandes (investigar qué son antes de decidir)
| Item | Tamaño | Acción sugerida |
|---|---|---|
| `videonuevo/` | **27G** | ¿proyecto de video? ¿assets Remotion? Investigar, probablemente mover a un lugar de media o limpiar renders |
| `Descargas/` | 14G (160 items) | carpeta real de descargas. Triage interno |
| `SAAS-AL-DESNUDO-1` | 5.3G | ¿curso/material? Investigar |
| `assets/` | 4.5G | ¿assets compartidos? ¿de itera-social? Investigar destino |
| `dumps/` | 46M | DB dumps — posible dato sensible. Revisar, mover a lugar seguro o borrar |
| `Downloads/` | 173M (4 items) | **DUPLICADO de Descargas** (mezcla locale es/en). Consolidar en Descargas y eliminar |
| `jubilo-recuperado/` | 48K | copia de respaldo que hizo Claude. Ya está en GitHub → se puede borrar |

### Archivos sueltos
| Item | Acción sugerida |
|---|---|
| `credenciales-prueba-mp` (508B) | ⚠️ credenciales. Revisar contenido, mover a gestor seguro o borrar |
| `2026-05-01...mp4`, `2026-06-01...mp4` (x3, chicos) | grabaciones de pantalla. ¿Sirven? Mover a Vídeos o borrar |
| `footage-test-codex-5-5.mp4` (168M) | footage de test. Probable borrar |
| `video-verificacion-google-oauth-calendar-uso.mp4` (26M) | evidencia de verificación Google. ¿Guardar? |
| `itera-lex-contexto-movil.md` (16K) | nota de itera-lex → ¿mover a repo o al vault Obsidian? |
| `transcript-ui-depth` + `.md` (12K c/u) | transcript duplicado → consolidar/vault |
| `texto-prueba.txt`, `texto-.prueba` (4K) | pruebas → probable borrar |
| `testt00226896.` (0 bytes) | basura → borrar |

### Nota sobre dirs ocultos del home (.config, .cache, .nvm, etc.)
Son normales del sistema. NO tocar salvo `.cache` si se quiere liberar espacio (seguro de vaciar).

---

## FRENTE 3 — Obsidian (capa de conocimiento)

### Modelo mental (NO violar)
- **Obsidian es para conocimiento/notas, NO para reorganizar repos de código.** No mueve carpetas git.
- **NUNCA hacer que `~/projects` sea el vault** → Obsidian indexaría node_modules/.next/.venv = inservible.
- El vault es una carpeta DEDICADA, separada del código.
- Docs específicos de un proyecto SE QUEDAN en su repo (`.planning/`, `docs/`, `CLAUDE.md`). El vault
  es para conocimiento TRANSVERSAL (negocio, estrategia, aprendizajes cross-proyecto, notas personales).

### Decisiones — ✅ RESUELTAS 2026-06-09
Obsidian instalado y arquitectura de vault elegida (**vault contenedor `~/vault` con symlinks**).
Detalle completo, hallazgos y plan de ejecución en **«Actualización 2026-06-09» al final del doc**.

---

## Qué YA se hizo esta semana (NO rehacer)
- Backups creados: solodev, my-voice, itera-lex-tools (workspace docs), jubilo-refactor-visual.
- itera-lex: archivados 10 planes ejecutados en `.planning/archive/` (commit `7cce8bef`).
- Movido `respuesta.md` (root projects) → `itera-lex-tools/notas-estrategia-egress-ip.md`.
- Movido `ITERA FONDO TRANSPARENTE.png` (root projects) → `itera-social/`.
- Recuperado y respaldado jubilo (estaba borrado).
- Auditoría completa de `itera-lex/.planning/`: pendiente de ejecutar (ver más abajo).

## Pendientes que quedaron de la auditoría de itera-lex/.planning (opcional, otra tarea)
- Borrable: `.planning/quality-gate-artifacts/` (17M, gitignored) + `.planning/private/` (9.7M, gitignored).
- Archivar: 6 reportes/docs puntuales + 4 .md sueltos del root del repo (auditoria-final-beta-cerrada,
  diagnostico, simplificando-drive, ultimos-findings).
- Mover a `guides/`: REFACTOR-SISTEMA-PUNTOS-DE-CORTE.md, QA-DIRECTORIO-ADMIN.md.
- STATE.md pesa 255KB → candidato a podar histórico.

## Orden sugerido para la nueva sesión
1. Leer este doc. Releer el inventario real (las cosas cambian).
2. Confirmar las decisiones pendientes (Obsidian vault, meta-infra en root ya confirmado).
3. **Frente 2 primero parcial:** identificar qué son las carpetas grandes del home (27G/5.3G/4.5G) —
   ahí está el grueso del desorden y posibles datos sensibles.
4. Ejecutar reorg de `~/projects` (Frente 1).
5. Triage del home (Frente 2).
6. Instalar + montar Obsidian (Frente 3).
7. Actualizar PROJECT-MAP.md.

---

## Actualización 2026-06-08 — decisiones nuevas (sesión cierre iteralex)

### Frente 1 — ajuste a la estructura objetivo
- **`saas/` lleva los repos DIRECTOS** (shope-ar, linkea2, itera-estudio, itera-chatbots-platform,
  itera-lat, presskit-ar, …). **NO** se crea carpeta "ecosistema" por SaaS.
- **Única excepción: `saas/iteralex/`** — agrupa los 4 repos del ecosistema ÍTERA Lex (itera-lex,
  itera-lex-docs, itera-lex-mcp, itera-lex-tools) porque es extenso. Ya ejecutado (sub-hito iteralex cerrado).
- **Frente 1 COMPLETO ✅ EJECUTADO 2026-06-08.** Movidos los ~20 repos a `saas/` (6) /
  `clientes/` (7) / `personal/` (2) / `archive/` (3) / `scratch/` (3, incl. `ultimate-ux-ui`
  renombrado sin espacios). `worktrees/` vacío borrado. Git + cambios sin commitear preservados en
  todos. Cross-refs de paths arregladas (sed, 181 archivos; 0 rotos en fuente — `.next/` builds se
  regeneran). Namespaces de memoria de Claude de 9 repos renombrados a
  `-home-pachu-projects-<cat>-<repo>`. Estructura final en root: solo `itera-core` / `itera-context`
  / `itera-social` + las 6 categorías. Mapa en `PROJECT-MAP.md` § Estructura física.

### Rename de la meta-infra: `itera-claude-system` → `itera-core` ✅ EJECUTADO 2026-06-08
Motivo: el nombre venía de "guías para un Claude viejo que trabajaba solo". Hoy es cross-agent
(Claude + Codex) y heterogéneo (skills, _template, guides, scripts, reports, PROJECT-MAP,
TOOLING-STANDARD, INFRA). `itera-core` lo describe como núcleo técnico-operativo y cierra el trío
`itera-core / itera-context / itera-social`.

Qué se hizo:
- `mv ~/projects/itera-claude-system ~/projects/itera-core` (git intacto, rama main).
- `sed itera-claude-system→itera-core` en: `~/.claude/CLAUDE.md` (13), `~/.codex/AGENTS.md` (5),
  **62 archivos** en `~/projects` (docs/CLAUDE.md/guides/scripts/SKILL.md de ~12 repos) y memorias.
- **Re-symlink de los skills:** `itera-core/scripts/link-skill.sh --all` (los symlinks en
  `~/.claude/skills` + `~/.codex/skills` apuntaban al path viejo; 0 rotos tras el re-link).
- Commit del rename en `itera-core`. Los OTROS repos quedaron con la ref actualizada en working
  tree SIN commitear (1 línea c/u) — commitearlos cuando se decida (varios tienen trabajo ajeno).

- Repo GitHub renombrado a `PachuAI/itera-core` (`gh repo rename`; remote local actualizado).
  El commit del rename quedó local (sin pushear, según convención).

Pendiente:
- Limpiar ruido suelto del root (`INFO.txt`, `modelo prompt.txt`, `*.OBSOLETE.md`, changelogs sueltos).

---

## Actualización 2026-06-09 — Frente 3 DECIDIDO + Frente 2 diferido

### Frente 2 (home) → DIFERIDO (fuera del plan activo)
El usuario lo hará por su cuenta como tarea extra. NO bloquea el vault. El inventario de la sección
Frente 2 queda como referencia. Las únicas cosas del home que toca el vault son 3 notas sueltas (ver plan).

### Frente 3 (Obsidian) → DECIDIDO + parcialmente ejecutado

**Obsidian INSTALADO esta sesión** (no requiere hacerlo de nuevo):
- appimage 1.12.7 movido `~/Descargas/` → **`~/Applications/Obsidian-1.12.7.AppImage`** (ejecutable).
- lanzador en menú: `~/.local/share/applications/obsidian.desktop`; icono en `~/.local/share/icons/obsidian.png`.
- Verificado que arranca (cargó el runtime Electron). Instalación por appimage, NO Flatpak.

**Hallazgo que destrabó la decisión:** `itera-context` pesa 4,5 G pero su `.git` son 13 M — el 99,9%
es la carpeta `ITERA/` (gitignored): `REELS/` = 4,4 G de `.mp4` + 25 PSDs + 310 PNGs + una mini-web.
El conocimiento real son 162 `.md` = 2,8 M. itera-context NO es "puro negocio": es markdown de
negocio + un cajón de assets pesados.

**Arquitectura elegida: VAULT CONTENEDOR `~/vault` con symlinks** (Obsidian en Linux sigue symlinks).
Descartadas: A (vault = itera-context: el `.obsidian/` ensucia el repo y obliga a meter lo personal
en un repo de negocio versionado) y B (vault nuevo + migrar negocio + reapuntar paths: más trabajo
para el mismo resultado). C-symlink gana: lo personal vive en el vault (nunca en GitHub del negocio),
itera-context queda intacto (su git y sus paths cableados en `~/.claude/CLAUDE.md` siguen), y el
`.obsidian/` vive en `~/vault`.

Estructura objetivo:
```
~/vault/                  (raíz Obsidian · .obsidian vive acá)
├── personal/  referencias/  inbox/   (carpetas REALES del vault)
├── negocio   → ~/projects/itera-context        (symlink · pendiente, ver paso 2)
└── my-voice  → ~/projects/personal/my-voice    (symlink · YA creado)
```

**EJECUTADO 2026-06-09 — vault montado y funcional:**
1. ✅ **Hallazgo:** `itera-context/ITERA/` (4,5 G) era **duplicado EXACTO** de `~/assets/brand/`
   (555 archivos, diff de árbol vacío). itera-social descartado como destino (ya pesa 5,8 G, es repo
   git con remote, y su gitignore no cubría esos assets). El hogar canónico de assets de marca ya es
   `~/assets/brand/`. → `ITERA/` movido a **`~/_revisar-borrar/itera-context-ITERA/`** (reversible).
   itera-context pasó de **4,5 G → 27 M**, git intacto y limpio.
   ⚠️ **PENDIENTE manual del usuario:** montar el disco externo **"WORK MEDIA"** (donde apunta
   `~/assets/customers`) para confirmar si hay una 3ª copia respaldada; recién ahí **borrar definitivo**
   `~/_revisar-borrar/itera-context-ITERA/`. Hoy las 2 copias (ITERA movida + `~/assets/brand/`) son
   locales sin git, por eso no se borró.
2. ✅ `~/vault/` creado: carpetas reales `personal/ referencias/ inbox/` + symlinks
   `negocio → ~/projects/itera-context` y `my-voice → ~/projects/personal/my-voice` (ambos resuelven).
3. ✅ Notas del home migradas a `~/vault/inbox/`: `itera-lex-contexto-movil.md` y
   `transcript-ui-depth.md` (eran 2 transcripts idénticos salvo 1 byte; se conservó el `.md`).
   Borrados: `texto-prueba.txt` (basura) y `transcript-ui-depth` (duplicado).
4. ✅ Git del vault: repo **`PachuAI/vault` (PRIVATE)** creado y pusheado (commit `1de27c0`). Los
   symlinks `negocio`/`my-voice` y la cache de `.obsidian` están gitignorados.

**Único pendiente (acción del usuario, no necesita Claude):** abrir `~/vault` en Obsidian desde el
menú y usarlo. `.obsidian/` se creará en `~/vault` (no toca itera-context). Ajustar "Excluded files"
solo si molesta algo.

Doctrina (no violar): vault = conocimiento transversal; docs de CÓDIGO de cada proyecto se quedan en
su repo; nunca hacer `~/projects` el vault.
