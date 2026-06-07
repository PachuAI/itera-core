---
name: retail-catalog-ingestion
description: Extract product data from retail storefronts into resumable raw and normalized datasets, then classify and prefilter them into seed candidates. Use when Codex needs to scrape a store category or brand listing, preserve restart-safe checkpoints, normalize product metadata and images, detect duplicate patterns, or build seed-ready catalog subsets without losing the original crawl.
---

# Retail Catalog Ingestion

Build retail catalog datasets in two stages: ingest first, curate second. Preserve enough raw material to restart or reclassify later without re-scraping.

## Workflow

1. Identify the real listing surface.
   Read the storefront HTML, locate total result counts, and capture the paginated endpoint actually used by the site. For Fravega this came from `buscapagina`, but keep the skill generic: prefer the site's own listing transport instead of inventing pagination.

2. Create a resumable output layout.
   Always separate `raw/`, `normalized/`, `assets/`, and `state/`. Write listing HTML, product HTML, normalized per-product metadata, downloaded images, and a canonical progress file. See [references/workflow.md](references/workflow.md).

3. Crawl incrementally and defensively.
   Persist each listing page and each product as soon as it is processed. Track `pagesCompleted`, `productsCompleted`, and `lastUpdatedAt` in `state/progress.json`. Add retry and backoff for `429`, `5xx`, and network failures before assuming the parser is broken.

4. Normalize product records.
   Emit one `metadata.json` per product with stable keys like SKU, title, seller, breadcrumbs, canonical URL, description, listing summary, images, and specs. Consolidated manifests such as `products.jsonl` or `products.csv` should be treated as end-of-run outputs, not as the live source of truth during a crawl.

5. Classify before deduping.
   Create an analysis layer that adds canonical family, condition, marketplace flags, seed validity, and duplicate keys. Keep these files outside the crawl artifacts if possible. Use `metadata.json` or the classified export as the basis for seed decisions.

6. Build seed candidates conservatively.
   Start with a strong prefilter, export `seed-candidates.csv/jsonl`, and summarize what survived. Then dedupe exact repeats, then handle logical duplicates family by family. Do not collapse legitimate variants too early.

7. Validate the curation layer with a real run.
   Run the seed-candidate step against the classified dataset, inspect counts and family mix, and update the skill if actual data exposes mismatches. Use [references/seed-pipeline.md](references/seed-pipeline.md) and the helper script in `scripts/build_seed_candidates.py`.

## Guardrails

- Preserve the raw crawl even if the seed ends up much smaller.
- Prefer restart-safe checkpoints over one-shot scripts.
- Measure live progress from `state/progress.json` plus the count of `normalized/products/*`, not from final manifests that may be stale mid-run.
- Treat thin metadata pages carefully. A generic title like `Frávega: Electrodomésticos...` or missing breadcrumbs often means the product detail page was partially useful and the listing card may be the better fallback.
- Separate `dataset fuente` from `seed demo`. The source crawl should stay broad; the seed should be curated.

## References

- Use [references/workflow.md](references/workflow.md) for the reusable crawl and normalization pattern.
- Use [references/fravega-apple-filters.md](references/fravega-apple-filters.md) for the first proven filter set based on the Frávega Apple dataset.
- Use [references/seed-pipeline.md](references/seed-pipeline.md) for the curation flow from classified dataset to `seed-candidates` and `seed-final`.
