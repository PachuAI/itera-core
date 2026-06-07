#!/usr/bin/env python3
import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


VALID_FAMILIES = {"iPhone", "iPad", "MacBook", "Watch", "AirPods"}
EXCLUDED_REASONS = {"ruido_categoria", "no_apple_core"}


def parse_args():
    parser = argparse.ArgumentParser(description="Build seed-candidate exports from a classified retail CSV.")
    parser.add_argument("--input-csv", required=True, help="Path to the classified CSV input.")
    parser.add_argument("--outdir", required=True, help="Directory where seed-candidate outputs will be written.")
    return parser.parse_args()


def parse_bool(value):
    return str(value).strip().lower() in {"true", "1", "yes", "y"}


def clean(value):
    return (value or "").strip()


def row_passes(row):
    if not parse_bool(row.get("categoriaValidaParaSeed")):
        return False, "categoria_invalida"
    if parse_bool(row.get("marketplace")):
        return False, "marketplace"
    if clean(row.get("condition")).lower() != "nuevo":
        return False, f"condition:{clean(row.get('condition')).lower() or 'vacio'}"
    if clean(row.get("familyCanonica")) not in VALID_FAMILIES:
        return False, f"family:{clean(row.get('familyCanonica')) or 'vacia'}"
    if clean(row.get("motivoExclusionPotencial")) in EXCLUDED_REASONS:
        return False, f"motivo:{clean(row.get('motivoExclusionPotencial'))}"
    if clean(row.get("duplicateClusterExacto")):
        return False, "duplicate_exacto"
    return True, "kept"


def iphone_key(row):
    linea = clean(row.get("iphoneLinea")) or "desconocido"
    variante = clean(row.get("iphoneVariante")) or "base"
    return f"{linea}/{variante}"


def write_csv(path, rows, fieldnames):
    with path.open("w", encoding="utf8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_jsonl(path, rows):
    with path.open("w", encoding="utf8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_summary(path, input_rows, kept_rows, exclusion_counts, family_counts, iphone_counts, logical_counts):
    lines = [
        "# Seed Candidates Summary",
        "",
        "## Totales",
        f"- input clasificado: `{len(input_rows)}`",
        f"- seed candidates: `{len(kept_rows)}`",
        "",
        "## Conteo por familia",
    ]

    for family, count in sorted(family_counts.items(), key=lambda item: (-item[1], item[0])):
        lines.append(f"- {family}: `{count}`")

    lines.extend(["", "## iPhone por línea y variante"])
    if iphone_counts:
        for key, count in sorted(iphone_counts.items(), key=lambda item: (-item[1], item[0])):
            lines.append(f"- {key}: `{count}`")
    else:
        lines.append("- sin iPhone en esta selección")

    lines.extend(["", "## Exclusiones principales"])
    for reason, count in exclusion_counts.most_common(10):
        lines.append(f"- {reason}: `{count}`")

    lines.extend(["", "## Clusters lógicos todavía presentes"])
    if logical_counts:
        for cluster, count in logical_counts.most_common(15):
            lines.append(f"- {cluster}: `{count}`")
    else:
        lines.append("- sin clusters lógicos repetidos en seed-candidates")

    path.write_text("\n".join(lines) + "\n", encoding="utf8")


def main():
    args = parse_args()
    input_path = Path(args.input_csv)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    with input_path.open("r", encoding="utf8", newline="") as fh:
        rows = list(csv.DictReader(fh))

    kept = []
    exclusion_counts = Counter()
    family_counts = Counter()
    iphone_counts = Counter()
    logical_counts = Counter()

    for row in rows:
        ok, reason = row_passes(row)
        if not ok:
            exclusion_counts[reason] += 1
            continue

        kept.append(row)
        family = clean(row.get("familyCanonica")) or "desconocido"
        family_counts[family] += 1

        if family == "iPhone":
            iphone_counts[iphone_key(row)] += 1

        logical_cluster = clean(row.get("duplicateClusterLogico"))
        if logical_cluster:
            logical_counts[logical_cluster] += 1

    fieldnames = list(rows[0].keys()) if rows else []
    write_csv(outdir / "seed-candidates.csv", kept, fieldnames)
    write_jsonl(outdir / "seed-candidates.jsonl", kept)
    write_summary(
        outdir / "seed-candidates-summary.md",
        rows,
        kept,
        exclusion_counts,
        family_counts,
        iphone_counts,
        logical_counts,
    )

    print(f"input_rows={len(rows)}")
    print(f"kept_rows={len(kept)}")
    print(f"output_dir={outdir}")


if __name__ == "__main__":
    main()
