#!/usr/bin/env python3
"""Fast local->production snapshot push for the PJ Rio Negro own index.

Run from itera-lex-tools/api. This script intentionally avoids
verify_content_package(), which checks rows one by one and is too slow for
mass RN promotions.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse


ART = timezone(timedelta(hours=-3))
CONFIRMATION = "push-snapshot-rn-to-produccion"
DEFAULT_SCOPES = (
    ("fallos", "jurisdiccional", 2026),
    ("fallos", "stj", 2026),
    ("sumarios", "jurisdiccional", 2024),
    ("sumarios", "stj", 2024),
    ("sumarios", "stj", 2026),
)

TOTALS_SQL = """
WITH active AS (
  SELECT DISTINCT ON (documento_id) *
  FROM extractos_rio_negro
  WHERE activo = TRUE AND estado IN ('generado','manual','revisado')
    AND COALESCE(NULLIF(BTRIM(texto), ''), NULLIF(BTRIM(resumen_itera), '')) IS NOT NULL
  ORDER BY documento_id,
    CASE estado WHEN 'revisado' THEN 1 WHEN 'manual' THEN 2 ELSE 3 END,
    actualizado_en DESC NULLS LAST,
    id DESC
)
SELECT d.tipo, d.ambito,
       COUNT(*) AS docs,
       COUNT(*) FILTER (WHERE d.texto_oficial IS NOT NULL AND LENGTH(BTRIM(d.texto_oficial)) > 0) AS con_texto,
       COUNT(a.id) AS extractos,
       COUNT(a.id) FILTER (
         WHERE jsonb_typeof(a.clasificacion->'tags_busqueda')='array'
           AND jsonb_array_length(a.clasificacion->'tags_busqueda') > 0
       ) AS con_tags,
       COUNT(a.id) FILTER (WHERE a.anclas IS NOT NULL AND a.anclas <> '{}'::jsonb) AS con_anclas,
       COUNT(a.id) FILTER (
         WHERE COALESCE(a.modelo,'') <> '' AND COALESCE(a.version_prompt,'') <> ''
       ) AS con_modelo_prompt,
       COUNT(a.id) FILTER (WHERE a.requiere_revision IS TRUE) AS requiere_revision
FROM documentos_rio_negro d
LEFT JOIN active a ON a.documento_id = d.id
WHERE d.tipo IN ('fallos','sumarios') AND d.ambito IN ('stj','jurisdiccional')
GROUP BY d.tipo,d.ambito
ORDER BY d.tipo,d.ambito
"""


def parse_scope(raw: str) -> tuple[str, str, int]:
    normalized = raw.replace(":", "/")
    parts = [part.strip() for part in normalized.split("/") if part.strip()]
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("scope debe ser tipo/ambito/anio")
    tipo, ambito, anio_raw = parts
    if tipo not in {"fallos", "sumarios"}:
        raise argparse.ArgumentTypeError("tipo invalido")
    if ambito not in {"jurisdiccional", "stj"}:
        raise argparse.ArgumentTypeError("ambito invalido")
    try:
        anio = int(anio_raw)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("anio invalido") from exc
    return tipo, ambito, anio


def read_scopes_file(path: Path) -> list[tuple[str, str, int]]:
    scopes: list[tuple[str, str, int]] = []
    for lineno, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        try:
            scopes.append(parse_scope(line))
        except argparse.ArgumentTypeError as exc:
            raise argparse.ArgumentTypeError(f"{path}:{lineno}: {exc}") from exc
    return scopes


def load_repo_modules(api_root: Path) -> None:
    if not (api_root / "scripts" / "rio_negro_sync_content.py").exists():
        raise RuntimeError("Corré este script desde itera-lex-tools/api o pasá --api-root.")
    sys.path.insert(0, str(api_root))


def fetch_doc_keys(url: str) -> set[tuple[str, str, str]]:
    from scripts.rio_negro_sync_content import configure_database
    from app.jurisprudencia.rio_negro_index import db

    configure_database(url)
    conn = db.get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT tipo, ambito, id_fuente FROM documentos_rio_negro")
            return {(row["tipo"], row["ambito"], str(row["id_fuente"])) for row in cur.fetchall()}
    finally:
        db.close_conn(conn)


def aggregate_totals(url: str) -> list[dict]:
    from scripts.rio_negro_sync_content import configure_database
    from app.jurisprudencia.rio_negro_index import db

    configure_database(url)
    conn = db.get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(TOTALS_SQL)
            return [dict(row) for row in cur.fetchall()]
    finally:
        db.close_conn(conn)


def assert_local_superset(local_url: str, prod_url: str) -> None:
    local_keys = fetch_doc_keys(local_url)
    prod_keys = fetch_doc_keys(prod_url)
    missing_in_local = sorted(prod_keys - local_keys)
    if missing_in_local:
        sample = ", ".join(f"{tipo}/{ambito}/{id_fuente}" for tipo, ambito, id_fuente in missing_in_local[:10])
        raise RuntimeError(
            "PROD tiene documentos que no existen en local. Hacer pull primero. "
            f"missing_in_local={len(missing_in_local)} sample={sample}"
        )
    print(
        f"preflight local_superset ok: prod_minus_local=0 local_extra={len(local_keys - prod_keys)}",
        flush=True,
    )


def backup_prod_rn(prod_url: str, backup_dir: Path) -> Path:
    parsed = urlparse(prod_url)
    backup_dir.mkdir(parents=True, exist_ok=True)
    dump = backup_dir / f"rn-prod-pre-snapshot-push-{datetime.now(ART).strftime('%Y%m%d-%H%M%S')}.dump"
    env = os.environ.copy()
    env["PGPASSWORD"] = unquote(parsed.password or "")
    subprocess.run(
        [
            "pg_dump",
            "-Fc",
            "--no-owner",
            "--no-privileges",
            "-h",
            parsed.hostname or "localhost",
            "-p",
            str(parsed.port or 5432),
            "-U",
            parsed.username or "itera_lex_tools",
            "-d",
            (parsed.path or "/").lstrip("/"),
            "-t",
            "documentos_rio_negro",
            "-t",
            "extractos_rio_negro",
            "-t",
            "lotes_contenido_rio_negro",
            "-f",
            str(dump),
        ],
        check=True,
        env=env,
    )
    subprocess.run(["pg_restore", "--list", str(dump)], check=True, stdout=subprocess.DEVNULL)
    print(f"backup_ok {dump} bytes={dump.stat().st_size}", flush=True)
    return dump


def backup_prod_scopes(
    *,
    prod_url: str,
    backup_dir: Path,
    scopes: list[tuple[str, str, int]],
) -> Path:
    from scripts.rio_negro_sync_content import configure_database
    from app.jurisprudencia.rio_negro_index import db
    from app.jurisprudencia.rio_negro_index.content_sync import (
        PACKAGE_SCHEMA_VERSION,
        RioNegroContentScope,
        _canonical_rows,
        _content_checksum,
        _fetch_export_documents,
        _fetch_export_extracts,
        _file_checksums,
        _scope_payload,
        _write_jsonl,
    )

    configure_database(prod_url)
    db.init_rio_negro_index_db()
    backup_root = (
        backup_dir
        / f"rn-prod-scoped-pre-snapshot-push-{datetime.now(ART).strftime('%Y%m%d-%H%M%S')}"
    )
    backup_root.mkdir(parents=True, exist_ok=False)

    packages: list[dict] = []
    total_docs = 0
    total_extracts = 0
    for tipo, ambito, anio in scopes:
        created_at = datetime.now(ART)
        scope = RioNegroContentScope(tipo=tipo, ambito=ambito, anio=anio)
        scope_label = f"{tipo}/{ambito}/{anio}"
        package_id = (
            f"rn-content-produccion-backup-{tipo}-{ambito}-{anio}-"
            f"{created_at.strftime('%Y%m%d-%H%M%S')}"
        )
        package_dir = backup_root / package_id
        package_dir.mkdir(parents=False, exist_ok=False)
        docs = _canonical_rows(_fetch_export_documents(scope))
        extracts = _canonical_rows(_fetch_export_extracts(scope))
        _write_jsonl(package_dir / "documentos.jsonl", docs)
        _write_jsonl(package_dir / "extractos.jsonl", extracts)
        checksums = _file_checksums(package_dir, ["documentos.jsonl", "extractos.jsonl"])
        manifest = {
            "schema_version": PACKAGE_SCHEMA_VERSION,
            "package_id": package_id,
            "source": "rio_negro",
            "source_env": "produccion",
            "operator": "rn-fast-snapshot-scoped-backup",
            "created_at": created_at.isoformat(),
            "scope": _scope_payload(scope),
            "counts": {"documentos": len(docs), "extractos": len(extracts)},
            "checksums": checksums,
            "content_checksum": _content_checksum(checksums),
        }
        (package_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        packages.append(
            {
                "scope": scope_label,
                "package_dir": str(package_dir),
                "counts": manifest["counts"],
                "content_checksum": manifest["content_checksum"],
            }
        )
        total_docs += len(docs)
        total_extracts += len(extracts)

    backup_manifest = {
        "created_at": datetime.now(ART).isoformat(),
        "kind": "rn_prod_scoped_content_backup",
        "scopes": [f"{tipo}/{ambito}/{anio}" for tipo, ambito, anio in scopes],
        "packages": packages,
        "counts": {"documentos": total_docs, "extractos": total_extracts},
        "rollback_hint": (
            "Each package contains the pre-push content rows for its scope. For a scoped rollback "
            "after adding rows, first remove or isolate the current target scope intentionally, then "
            "re-import the relevant package with the repo content-sync importer. Use --backup-mode "
            "full when the rollback plan requires a direct full-table restore."
        ),
    }
    (backup_root / "scoped-backup-manifest.json").write_text(
        json.dumps(backup_manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        f"backup_scoped_ok {backup_root} scopes={len(scopes)} "
        f"docs={total_docs} extractos={total_extracts}",
        flush=True,
    )
    return backup_root


def push_scopes(
    *,
    local_url: str,
    prod_url: str,
    scopes: list[tuple[str, str, int]],
    output_dir: Path,
    apply: bool,
) -> None:
    from scripts.rio_negro_sync_content import configure_database, print_import_result
    from app.jurisprudencia.rio_negro_index.content_sync import (
        RioNegroContentScope,
        RioNegroImportOptions,
        export_content_package,
        import_content_package,
    )

    for tipo, ambito, anio in scopes:
        scope = RioNegroContentScope(tipo=tipo, ambito=ambito, anio=anio)
        print(f"### {'apply' if apply else 'dry-run'} snapshot {tipo}/{ambito}/{anio}", flush=True)
        configure_database(local_url)
        exported = export_content_package(
            output_dir=output_dir,
            scope=scope,
            source_env="local",
            operator="rn-fast-snapshot-push",
        )
        manifest = exported["manifest"]
        package_dir = Path(exported["package_dir"])
        print(
            f"export {manifest['package_id']}: "
            f"docs={manifest['counts']['documentos']} extractos={manifest['counts']['extractos']}",
            flush=True,
        )
        configure_database(prod_url)
        result = import_content_package(
            package_dir=package_dir,
            options=RioNegroImportOptions(
                dry_run=not apply,
                force_reviewed=True,
                source_env="local",
                target_env="produccion",
                operator="rn-fast-snapshot-push",
            ),
        )
        print_import_result("apply" if apply else "dry-run", result["result"])


def print_totals(label: str, totals: list[dict]) -> None:
    print(f"== {label} totals ==", flush=True)
    for row in totals:
        print(
            f"{row['tipo']}/{row['ambito']}: docs={row['docs']} con_texto={row['con_texto']} "
            f"extractos={row['extractos']} tags={row['con_tags']} anclas={row['con_anclas']} "
            f"modelo_prompt={row['con_modelo_prompt']} review={row['requiere_revision']}",
            flush=True,
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fast RN local->production snapshot push.")
    parser.add_argument("--api-root", type=Path, default=Path.cwd())
    parser.add_argument("--scope", action="append", type=parse_scope, default=[])
    parser.add_argument(
        "--scopes-file",
        type=Path,
        default=None,
        help="Archivo con un scope tipo/ambito/anio por linea. Permite blancos y comentarios #.",
    )
    parser.add_argument("--default-demo-scopes", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--confirm", default="")
    parser.add_argument("--skip-backup", action="store_true")
    parser.add_argument(
        "--backup-mode",
        choices=["scoped", "full"],
        default="scoped",
        help="En --apply, scoped guarda solo los scopes tocados; full hace pg_dump de tablas RN.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/rio-negro-content-packages")
        / f"fast-snapshot-{datetime.now(ART).strftime('%Y%m%d-%H%M%S')}",
    )
    parser.add_argument(
        "--backup-dir",
        type=Path,
        default=Path("data/rn-prod-backups"),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.apply and args.confirm != CONFIRMATION:
        raise RuntimeError(f"Para aplicar agregá --confirm {CONFIRMATION}")
    load_repo_modules(args.api_root.resolve())

    from scripts.rio_negro_sync_content import (
        DEFAULT_PROD_APP_UUID,
        DEFAULT_PROD_DB_NAME,
        DEFAULT_PROD_DB_USER,
        DEFAULT_PROD_PG_UUID,
        DEFAULT_TUNNEL_PORT,
        DEFAULT_VPS,
        TunnelConfig,
        local_juris_database_url,
        prod_target,
    )

    scopes = []
    if args.scopes_file:
        scopes.extend(read_scopes_file(args.scopes_file))
    scopes.extend(args.scope)
    if args.default_demo_scopes:
        scopes.extend(DEFAULT_SCOPES)
    scopes = list(dict.fromkeys(scopes))
    if not scopes:
        raise RuntimeError("Indicá --scope tipo/ambito/anio o --default-demo-scopes.")

    local_url = local_juris_database_url()
    config = TunnelConfig(
        DEFAULT_VPS,
        DEFAULT_PROD_PG_UUID,
        DEFAULT_PROD_APP_UUID,
        DEFAULT_PROD_DB_NAME,
        DEFAULT_PROD_DB_USER,
        DEFAULT_TUNNEL_PORT,
    )
    with prod_target(config) as prod:
        assert_local_superset(local_url, prod.url)
        if args.apply and not args.skip_backup:
            if args.backup_mode == "full":
                backup_prod_rn(prod.url, args.backup_dir)
            else:
                backup_prod_scopes(prod_url=prod.url, backup_dir=args.backup_dir, scopes=scopes)
        push_scopes(
            local_url=local_url,
            prod_url=prod.url,
            scopes=scopes,
            output_dir=args.output_dir,
            apply=args.apply,
        )
        local_totals = aggregate_totals(local_url)
        prod_totals = aggregate_totals(prod.url)
    print_totals("local", local_totals)
    print_totals("prod", prod_totals)
    if local_totals != prod_totals:
        if not args.apply:
            print("aggregate_verify_skipped_dry_run_mismatch", flush=True)
            return 0
        raise RuntimeError("Los totales agregados local/prod no coinciden.")
    print("aggregate_verify_ok", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
