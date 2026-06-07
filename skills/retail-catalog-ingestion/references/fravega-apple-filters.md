# Fravega Apple Filters

## Dataset snapshot

Validated on the final crawl:

- total analyzed: `1552`
- `marketplace=true`: `457`
- `reacondicionados/renovados/refabricados/usados`: `766`
- exact duplicates: `341` products in `102` clusters
- logical duplicates: `644` products in `220` clusters

Family distribution:

- `iPhone`: `586`
- `iPad`: `313`
- `MacBook`: `308`
- `Watch`: `207`
- `Accesorios`: `74`
- `AirPods`: `33`
- `Otros`: `15`
- `Audio`: `6`
- `iMac`: `5`
- `Mac Mini`: `4`
- `Hogar`: `1`

## Classification fields

The analysis layer used these fields:

- `sku`
- `title`
- `slug`
- `productUrl`
- `familyCanonica`
- `subfamilia`
- `modeloCanonico`
- `storage`
- `color`
- `condition`
- `seller`
- `marketplace`
- `breadcrumb`
- `categoriaValidaParaSeed`
- `motivoExclusionPotencial`
- `duplicateKeyExacta`
- `duplicateKeyLogica`
- `duplicateClusterExacto`
- `duplicateClusterLogico`
- `esIphone`
- `iphoneLinea`
- `iphoneVariante`
- `notas`

## Proven prefilter for seed candidates

Use this as the strong first pass:

- `categoriaValidaParaSeed = true`
- `marketplace = false`
- `condition = nuevo`
- `familyCanonica in (iPhone, iPad, MacBook, Watch, AirPods)`
- exclude `motivoExclusionPotencial in (ruido_categoria, no_apple_core)`
- exclude any non-empty `duplicateClusterExacto`

This keeps the source crawl broad while turning the first seed-candidate layer into something much cleaner.

Validated result on the Frávega Apple classified export:

- input classified rows: `1552`
- seed candidates after this filter: `251`
- family mix in candidates:
  - `iPad`: `70`
  - `Watch`: `68`
  - `iPhone`: `65`
  - `MacBook`: `29`
  - `AirPods`: `19`

This means the strong filter is useful as a first pass, but it is not the final demo set yet.

## Dedupe rules

### Exact duplicate

Use normalized title or an equivalent exact textual key.

### Logical duplicate

Use a key like:

```text
family + modelo + storage + color + condition
```

Then review by family instead of globally.

## iPhone exception

Do not collapse iPhone variants aggressively. Preserve at least:

```text
iphoneLinea + iphoneVariante + storage + color
```

Examples of variants that should remain distinct:

- base vs `Plus`
- base vs `Pro`
- `Pro` vs `Pro Max`
- `17` vs `17 Air`
- same model with different storage
- same model and storage with different color

Even after the strong prefilter, `iPhone` still keeps a healthy mix by line and variant, which confirms the filter is not collapsing that family too early.

## Common exclusion reasons

Use these labels consistently:

- `ruido_categoria`
- `marketplace_raro`
- `no_apple_core`
- `duplicado_exacto`
- `duplicado_logico`
- `reacondicionado`
- `incompleto`
- `otro`

## Signals that a record is suspicious

- breadcrumbs missing or absurd for the intended vertical
- generic store title instead of product title
- seller missing and metadata too thin
- detail page with empty images/specs but listing card still populated
- marketplace-looking SKUs or listings with good card data but weak product pages

## Next extension points

Append future heuristics here rather than bloating `SKILL.md`:

- store-specific marketplace detection
- family taxonomies for other brands or verticals
- seed selection policies by demo type
- duplicate handling rules per family
- candidate-to-final reduction targets by demo type
