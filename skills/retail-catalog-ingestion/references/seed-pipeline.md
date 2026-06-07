# Seed Pipeline

## Goal

Turn a classified retail dataset into two curated layers:

- `seed-candidates`: strong prefilter, still broad enough for review
- `seed-final`: final demo selection after family-aware logical dedupe

## Stage 1: Build `seed-candidates`

Input:

- classified CSV or JSONL with fields such as `familyCanonica`, `condition`, `marketplace`, `categoriaValidaParaSeed`, `motivoExclusionPotencial`, `duplicateClusterExacto`, `duplicateClusterLogico`, and family-specific variant fields

Strong default prefilter:

- `categoriaValidaParaSeed = true`
- `marketplace = false`
- `condition = nuevo`
- `familyCanonica in (iPhone, iPad, MacBook, Watch, AirPods)`
- exclude `motivoExclusionPotencial in (ruido_categoria, no_apple_core)`
- exclude non-empty `duplicateClusterExacto`

Outputs:

- `seed-candidates.csv`
- `seed-candidates.jsonl`
- `seed-candidates-summary.md`

Minimum summary:

- input count
- surviving count
- counts by family
- iPhone counts by `iphoneLinea` and `iphoneVariante`
- top exclusion reasons
- clusters still present in `duplicateClusterLogico`

Expected real-world outcome:

- a strong prefilter can remove most of the source dataset
- exact duplicate removal does not eliminate logical clusters
- the candidate layer should still be reviewed family by family before calling it final

## Stage 2: Review before logical dedupe

Inspect the candidate layer for:

- whether `iPhone` keeps all useful variants
- whether `MacBook`, `Watch`, and `iPad` still contain obvious repeats
- whether any family became too small because the filter was too aggressive
- whether accessories should be added back depending on the demo

If the candidate set looks too thin, loosen one dimension at a time:

1. include `Accesorios`
2. allow selected marketplace records with strong metadata
3. allow selected logical duplicate clusters for manual review

Do not relax all dimensions at once.

## Stage 3: Build `seed-final`

Use family-aware rules:

- `iPhone`
  Keep distinct `iphoneLinea + iphoneVariante + storage + color`
- `iPad`
  Prefer one record per `modeloCanonico + storage + color + condition`
- `MacBook`
  Prefer one record per `modeloCanonico + storage + color + condition`
- `Watch`
  Prefer one record per `modeloCanonico + color + condition`, adding storage only if it is meaningful in the source
- `AirPods`
  Prefer one record per `modeloCanonico + color + condition`

Outputs:

- `seed-final.csv`
- `seed-final.jsonl`
- `seed-final-summary.md`

Minimum final summary:

- final count
- counts by family
- applied logical dedupe policy
- preserved iPhone variants
- excluded edge cases worth revisiting

## Validation loop

After building `seed-candidates` or `seed-final`:

1. compare counts against the full classified dataset
2. inspect a few kept and excluded examples per family
3. note any obstacle caused by real data
4. update this skill if the actual process differs from the documented one

## Practical notes from Frávega Apple

- CSV booleans may appear as `True` and `False` strings rather than native booleans; normalize them before filtering.
- Empty duplicate cluster columns should be treated as empty strings, not as falsey assumptions that vary by parser.
- `motivoExclusionPotencial` can contain `duplicado_exacto` even when the product otherwise passes the seed filter; excluding non-empty `duplicateClusterExacto` is the safer exact-dedupe rule.
- Final consolidated manifests may exist before a later curation pass, but the classified export should be the source of truth for seed building.
