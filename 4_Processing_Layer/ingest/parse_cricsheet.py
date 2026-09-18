"""
Phase 1 - Ingest
================
Parses Cricsheet JSON match files (https://cricsheet.org/format/json/) into a
flat, ball-by-ball "deliveries" table and writes it to Parquet.

Usage (from project root, using the rapids/py3.11 environment):
    python edge_pipeline/ingest/parse_cricsheet.py --format IPL
    python edge_pipeline/ingest/parse_cricsheet.py --format ALL

This is intentionally plain pandas + stdlib json: parsing thousands of small
JSON files is I/O/CPU-bound on many small objects, not a GPU-friendly
workload. The GPU acceleration happens downstream in
`edge_pipeline/features/compute_form_features.py`, once the data is a big
flat table.
"""

import argparse
import json
import sys
import time
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from edge_pipeline.config import DELIVERIES_PARQUET, RAW_DATA_DIRS


def parse_match_file(path: Path, fmt_label: str) -> list[dict]:
    """Parse a single Cricsheet JSON match file into a list of delivery rows."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    info = data.get("info", {})
    match_id = path.stem
    dates = info.get("dates", [])
    match_date = dates[0] if dates else None
    season = info.get("season")
    season = str(season) if season is not None else None
    venue = info.get("venue")
    city = info.get("city")
    match_type = info.get("match_type", fmt_label)
    gender = info.get("gender")
    event_name = (info.get("event") or {}).get("name")
    outcome = info.get("outcome", {}) or {}
    winner = outcome.get("winner")
    teams = info.get("teams", [])
    team_a = teams[0] if len(teams) > 0 else None
    team_b = teams[1] if len(teams) > 1 else None

    rows = []
    for innings_idx, innings in enumerate(data.get("innings", []), start=1):
        batting_team = innings.get("team")
        bowling_team = team_b if batting_team == team_a else team_a

        for over_block in innings.get("overs", []):
            over_num = over_block.get("over")
            for ball_idx, delivery in enumerate(
                over_block.get("deliveries", []), start=1
            ):
                runs = delivery.get("runs", {}) or {}
                extras = delivery.get("extras", {}) or {}
                wickets = delivery.get("wickets") or []
                wicket = wickets[0] if wickets else {}

                rows.append(
                    {
                        "match_id": match_id,
                        "format": match_type,
                        "date": match_date,
                        "season": season,
                        "venue": venue,
                        "city": city,
                        "event": event_name,
                        "gender": gender,
                        "team_a": team_a,
                        "team_b": team_b,
                        "winner": winner,
                        "innings": innings_idx,
                        "batting_team": batting_team,
                        "bowling_team": bowling_team,
                        "over": over_num,
                        "ball_in_over": ball_idx,
                        "batter": delivery.get("batter"),
                        "bowler": delivery.get("bowler"),
                        "non_striker": delivery.get("non_striker"),
                        "runs_batter": runs.get("batter", 0),
                        "runs_extras": runs.get("extras", 0),
                        "runs_total": runs.get("total", 0),
                        "is_wide": "wides" in extras,
                        "is_noball": "noballs" in extras,
                        "is_bye": "byes" in extras,
                        "is_legbye": "legbyes" in extras,
                        "is_wicket": len(wickets) > 0,
                        "wicket_kind": wicket.get("kind"),
                        "player_out": wicket.get("player_out"),
                    }
                )
    return rows


def parse_folder(folder: Path, fmt_label: str) -> pd.DataFrame:
    files = sorted(folder.glob("*.json"))
    if not files:
        raise FileNotFoundError(f"No .json match files found in {folder}")

    print(f"[{fmt_label}] Found {len(files)} match files in {folder}")
    all_rows = []
    start = time.time()
    for i, path in enumerate(files, start=1):
        try:
            all_rows.extend(parse_match_file(path, fmt_label))
        except Exception as exc:  # keep going; report bad files at the end
            print(f"  ! Failed to parse {path.name}: {exc}")
        if i % 200 == 0 or i == len(files):
            print(f"  ...{i}/{len(files)} files parsed")

    df = pd.DataFrame(all_rows)
    elapsed = time.time() - start
    print(
        f"[{fmt_label}] Parsed {len(df):,} deliveries from {len(files)} matches in {elapsed:.1f}s"
    )
    return df


def main():
    parser = argparse.ArgumentParser(
        description="Parse Cricsheet JSON into a deliveries Parquet table"
    )
    parser.add_argument(
        "--format",
        choices=list(RAW_DATA_DIRS.keys()) + ["ALL"],
        default="IPL",
        help="Which competition folder to parse (default: IPL)",
    )
    args = parser.parse_args()

    formats = list(RAW_DATA_DIRS.keys()) if args.format == "ALL" else [args.format]

    for fmt in formats:
        folder = RAW_DATA_DIRS[fmt]
        df = parse_folder(folder, fmt)
        out_path = Path(str(DELIVERIES_PARQUET).format(fmt=fmt.lower()))
        df.to_parquet(out_path, index=False)
        print(f"[{fmt}] Wrote {out_path} ({out_path.stat().st_size / 1e6:.1f} MB)\n")


if __name__ == "__main__":
    main()
