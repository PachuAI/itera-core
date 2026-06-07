# Workflow

## Goal

Turn a retail listing into a restart-safe dataset that can later be classified, deduped, and turned into a seed without redoing the crawl.

## Recommended layout

Create one working directory per crawl:

```text
<outdir>/
  raw/
  normalized/
  assets/
  state/
```

Use these subpaths as the default shape:

- `raw/brand-search.html`
  Root listing or search HTML snapshot.
- `raw/listings/page-XXX.html`
  Raw HTML for each listing page.
- `raw/products/<sku>__<slug>/page.html`
  Raw HTML for each product detail page.
- `normalized/listing-pages/page-XXX.json`
  Parsed listing cards discovered on a page.
- `normalized/products/<sku>__<slug>/metadata.json`
  Normalized per-product record.
- `normalized/products/<sku>__<slug>/specs.txt`
  Human-readable extracted specs.
- `normalized/discovered-products.jsonl`
  Incremental append-only listing discoveries.
- `normalized/products.partial.jsonl`
  Optional append-only product manifest for in-progress runs.
- `normalized/products.jsonl`
  Final consolidated manifest rebuilt when the run finishes.
- `normalized/products.csv`
  Final consolidated CSV rebuilt when the run finishes.
- `assets/products/<sku>__<slug>/`
  Downloaded images.
- `state/progress.json`
  Canonical resume state.

## Listing discovery

1. Fetch the root listing page.
2. Capture:
   - total result count
   - real paginated endpoint
   - page size
3. Persist the root HTML before parsing.
4. Derive `totalPages` from `totalResults / pageSize`.

When a site hides pagination in client-side code, search its HTML for the actual endpoint string or embedded data blob. On Frávega the trigger was a `load('.../buscapagina?...PageNumber=')` fragment.

## Product extraction

For each listing card, collect at minimum:

- `sku`
- `title`
- `pageUrl`
- `imageUrl`
- `listPrice`
- `bestPrice`
- `pageNumber`

For each product detail page, normalize at minimum:

- `sku`
- `productId`
- `title`
- `sellerName`
- `breadcrumbs`
- `categories`
- `pageUrl`
- `canonicalUrl`
- `description`
- `variantSummary`
- `images`
- `specs`
- `source.extractedAt`
- `source.hasNextData`
- `source.hasLdJson`
- `listing`
- `imageAssets`

Fallbacks that proved useful:

- Prefer page-specific structured data when present.
- Fall back to listing-card title if the detail page title is generic.
- Fall back to `og:description` or visible description blocks if richer content is missing.
- Preserve both source image URLs and downloaded asset paths.

## Checkpointing

Store progress in `state/progress.json` with fields like:

- `startedAt`
- `baseUrl`
- `listing.totalResults`
- `listing.endpoint`
- `listing.pageSize`
- `listing.totalPages`
- `pagesCompleted`
- `productsCompleted`
- `lastUpdatedAt`
- `finishedAt`

Update progress after every completed product and every completed listing page.

## Resilience

Add retries for:

- `429`
- `408`
- `425`
- `500`
- `502`
- `503`
- `504`
- connection resets and transient network errors

Use exponential backoff plus jitter. Honor `Retry-After` when the server provides it.

Do not treat a single `500` or `503` as parser failure. In the Frávega run, page `30` returned repeated `500`s and later succeeded.

## Progress checks

During a live run, trust these signals in this order:

1. `state/progress.json`
2. number of directories under `normalized/products/`
3. live process output

Treat final manifests as stale until the run completes, because they may be rebuilt only at the end.

## Post-crawl curation

Once the crawl is complete:

1. classify products into canonical families and conditions
2. mark marketplace and category noise
3. compute exact and logical duplicate keys
4. produce a seed-candidate export
5. only then build the final demo seed
