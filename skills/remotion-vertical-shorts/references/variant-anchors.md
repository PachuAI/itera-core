# Variant Anchors Catalog

Anchors (variant native coordinates, 1504×940) for elements inside variants that have been calibrated in production. Reuse these when targeting the same variant. Add new entries when calibrating a new variant.

To calibrate a variant not in this catalog, see `references/calibrating-anchors.md`.

## Shell-wide constants (apply to every variant of every `screen/*-framed` story)

The DashboardShell uses `grid-template-columns: 250px 1fr 44px`. So:

| Region | Variant X range |
|---|---|
| Sidebar | 0 - 250 |
| Main content | 250 - 1460 |
| Right rail | 1460 - 1504 |

| Region | Variant Y range |
|---|---|
| Topbar shell (page title + search + actions) | 0 - 50 |
| Page body (whatever the active view renders) | 50 - 940 |

## `screen/causas-framed` → `Ficha: información` (and derived `Ficha: *` variants)

Calibrated 2026-05-15 with `CalibrationGrid` inside `<LaptopFrame>` at macro-zoom 1.58, micro-zoom 1.0.

### Tabs row (the CausaFichaWidget tab strip)

All tabs sit at `y=290` (variant coords). X spread:

| Tab | Variant X (center) |
|---|---|
| Información | 325 |
| Partes (2) | 480 |
| Movimientos (7) | 605 |
| Tareas (4) | 745 |
| Notas (3) | 890 |
| Archivos (15) | 1015 |
| Equipo (1) | 1140 |
| Presupuestos (2) | 1265 |

Tab strip total span: ~250 (Información left edge) to ~1410 (Presupuestos right edge). ~150 variant px per tab.

The orange underline of the active tab sits ~30 variant px below the label centers (around `y=320`).

### Header of the ficha (above the tabs)

| Element | Variant coord |
|---|---|
| `PEREYRA, ANA M. C/ SUPERMERCADO NORTE SRL S/ IGUALDAD SALARIAL` title | x ≈ 480, y ≈ 220 |
| `A cargo de: MR Martín Ríos | Judicial | Activa | ... | Urgente | En mediación` | x ≈ 480, y ≈ 250 |
| `← Volver a Causas` link | x ≈ 280, y ≈ 175 |

### Body of `Ficha: información`

| Element | Variant coord |
|---|---|
| `Tipo: Judicial` | x ≈ 290, y ≈ 420 |
| `Estado: Activa` | x ≈ 720, y ≈ 420 |
| `Jurisdicción: Neuquén` | x ≈ 290, y ≈ 470 |
| `Cliente: Ana María Pereyra` | x ≈ 720, y ≈ 470 |
| `Fuero: Laboral` | x ≈ 290, y ≈ 520 |
| `Abogado a cargo: Martín Ríos` | x ≈ 720, y ≈ 520 |
| `Juzgado: Juzgado Laboral 3` | x ≈ 290, y ≈ 570 |
| `Fecha ingreso: 1 de junio de 2025` | x ≈ 720, y ≈ 570 |
| `Nº Expediente: EXP-2025-007456` | x ≈ 290, y ≈ 625 |
| `Fecha vencimiento: Sin datos` | x ≈ 720, y ≈ 625 |

### Body of `Ficha: tareas` / `Ficha: movimientos` / `Ficha: archivos`

The list area starts at `y ≈ 410` and rows are ~50 variant px tall:

| Row | Variant Y (center) |
|---|---|
| Row 1 | 455 |
| Row 2 | 505 |
| Row 3 | 555 |
| Row 4 | 605 |

For `Ficha: tareas`, the columns are approximately:

| Column | Variant X (center) |
|---|---|
| Tarea (título) | 320 |
| Prioridad badge | 700 |
| Asignado a | 880 |
| Vencimiento | 1130 |

(Adjust by `±20` once verified; columns shift slightly depending on content width.)

## Adding a new variant

Calibrate, then append a section. Use the template:

```md
## `screen/<story>-framed` → `<variant name>`

Calibrated YYYY-MM-DD.

### <region>

| Element | Variant coord |
|---|---|
| <name> | x ≈ ?, y ≈ ? |
```

Always include the date and the macro/micro zoom you used (in case the rendering pipeline shifts). If you used `<CalibrationGrid>` standalone (no laptop), call that out — the math is the same but worth flagging.
