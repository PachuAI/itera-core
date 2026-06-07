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
├── itera-claude-system/  ← root (META-INFRA, NO MOVER)
├── itera-context/        ← root (META-INFRA, NO MOVER)
├── itera-social/         ← root (META-INFRA, NO MOVER)
└── .claude/              ← root (config workspace, NO MOVER)
```

### Decisiones firmes (ya consultadas con el usuario)
- **Las 3 meta-infra (`itera-claude-system`, `itera-context`, `itera-social`) QUEDAN en el root.**
  Están cableadas por path absoluto ~42 veces en `~/.claude/CLAUDE.md` + skills (itera-social 21,
  itera-claude-system 14, itera-context 7). Moverlas rompe skills (brandboard, guías Coolify/DB/seed,
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
- Actualizar **`itera-claude-system/PROJECT-MAP.md`** con las rutas nuevas (es el índice que lee `/sync`).
- Cross-refs opcionales en docs de meta-infra (~10 links a linkea2/shope-ar/itera-estudio/itera-lex) → opcional actualizar.

### Estado de backup de repos (al 2026-06-05) — TODO RESPALDADO
- Todos los repos tienen remote y los "commits ahead" están en ramas que existen en remoto (sin riesgo).
- Respaldados esta semana: `solodev`, `my-voice` (PachuAI privados); `itera-lex-tools` workspace
  (`iteralat/itera-lex-tools` privado, versiona solo docs raíz); `jubilo-refactor-visual` (PachuAI privado).
- itera-lex-tools son 3 sub-repos hermanos (web/api/egress) bajo `iteralat`, cada uno con su git.

---

## FRENTE 2 — `~/` (home) — clutter a clasificar

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

### Decisiones PENDIENTES (preguntar al usuario en la nueva sesión)
- **Ubicación del vault:** opción A `~/vault` nuevo y limpio; opción B repurposear `itera-context`
  (ya es markdown de negocio con git+backup). El usuario quiso "definirlo juntos".
- **Instalación:** todavía NO instalado. Recomendado en Mint: Flatpak
  `flatpak install flathub md.obsidian.Obsidian`. Alternativa: .deb oficial de obsidian.md.
- Candidatos a poblar el vault: business context (itera-context), brain-dump egress/IP
  (`itera-lex-tools/notas-estrategia-egress-ip.md`), análisis jubilo, notas de `my-voice`, notas
  sueltas del home (itera-lex-contexto-movil.md, transcripts).

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
```
```
