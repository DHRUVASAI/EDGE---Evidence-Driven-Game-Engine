"""
Phase 2 - Transform
====================
Turns the flat `deliveries` table (one row per ball) into two per-player,
per-match aggregate tables:

  - player_match_batting: runs, balls faced, 4s, 6s, SR, dismissal for every
    batter in every match
  - player_match_bowling: overs, runs conceded, wickets, economy, and a
    death-overs economy split for every bowler in every match

This mirrors what `edge_pipeline/cloud/transform.sql` does in BigQuery SQL;
the two are kept logically identical so the pipeline can run either locally
(pandas/cuDF) or in BigQuery once a GCP project is wired up.

Usage:
    python edge_pipeline/transform/build_match_aggregates.py --format IPL
"""

import argparse
import sys
import time
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from edge_pipeline.config import (
    BATTING_PARQUET,
    BOWLING_PARQUET,
    DELIVERIES_PARQUET,
    RAW_DATA_DIRS,
)


def classify_phase(fmt: str, over: int) -> str:
    """Powerplay / middle / death split. Test matches have no meaningful phase."""
    if fmt == "Test":
        return "na"
    if fmt in ("ODI", "ODM"):
        if over < 10:
            return "powerplay"
        if over < 40:
            return "middle"
        return "death"
    # T20 / IT20 / IPL etc.
    if over < 6:
        return "powerplay"
    if over < 16:
        return "middle"
    return "death"


def build_batting(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["is_four"] = (df["runs_batter"] == 4) & (~df["is_wide"])
    df["is_six"] = (df["runs_batter"] == 6) & (~df["is_wide"])
    # Balls faced: legal deliveries + no-balls, but not wides (standard convention)
    df["ball_faced"] = ~df["is_wide"]

    bat_group_cols = [
        "match_id",
        "format",
        "date",
        "season",
        "venue",
        "team_a",
        "team_b",
        "batting_team",
        "bowling_team",
        "batter",
    ]
    batting = df.groupby(bat_group_cols, as_index=False, dropna=False).agg(
        runs=("runs_batter", "sum"),
        balls_faced=("ball_faced", "sum"),
        fours=("is_four", "sum"),
        sixes=("is_six", "sum"),
    )
    batting = batting.rename(columns={"batter": "player", "bowling_team": "opponent"})
    batting["strike_rate"] = (
        batting["runs"] / batting["balls_faced"].replace(0, pd.NA)
    ) * 100

    # Dismissal: was this player out in this match (any innings)?
    dismissed = (
        df[df["is_wicket"]]
        .groupby(["match_id", "player_out"], as_index=False)
        .size()
        .rename(columns={"player_out": "player", "size": "_dismissed_count"})
    )
    dismissed["was_dismissed"] = True
    batting = batting.merge(
        dismissed[["match_id", "player", "was_dismissed"]],
        on=["match_id", "player"],
        how="left",
    )
    batting["was_dismissed"] = batting["was_dismissed"].fillna(False)
    return batting


def build_bowling(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["phase"] = [classify_phase(f, o) for f, o in zip(df["format"], df["over"])]
    df["legal_ball"] = ~(df["is_wide"] | df["is_noball"])
    # Runs charged to the bowler exclude byes/legbyes
    df["runs_conceded"] = (
        df["runs_total"] - df[["is_bye", "is_legbye"]].any(axis=1) * df["runs_extras"]
    )
    # Run-outs (and stumpings credited differently) aren't credited as bowler wickets except run-outs excluded
    df["bowler_wicket"] = df["is_wicket"] & (df["wicket_kind"] != "run out")

    bowl_group_cols = [
        "match_id",
        "format",
        "date",
        "season",
        "venue",
        "team_a",
        "team_b",
        "bowling_team",
        "batting_team",
        "bowler",
    ]
    bowling = df.groupby(bowl_group_cols, as_index=False, dropna=False).agg(
        balls_bowled=("legal_ball", "sum"),
        runs_conceded=("runs_conceded", "sum"),
        wickets=("bowler_wicket", "sum"),
    )
    bowling = bowling.rename(columns={"bowler": "player", "batting_team": "opponent"})
    bowling["overs"] = (bowling["balls_bowled"] // 6) + (
        bowling["balls_bowled"] % 6
    ) / 10
    bowling["economy"] = bowling["runs_conceded"] / (
        bowling["balls_bowled"].replace(0, pd.NA) / 6
    )

    # Death-overs economy (T20/ODI only) as a separate, merged-in column
    death = df[df["phase"] == "death"]
    death_agg = death.groupby(bowl_group_cols, as_index=False, dropna=False).agg(
        death_balls=("legal_ball", "sum"),
        death_runs=("runs_conceded", "sum"),
    )
    death_agg = death_agg.rename(
        columns={"bowler": "player", "batting_team": "opponent"}
    )
    death_agg["death_economy"] = death_agg["death_runs"] / (
        death_agg["death_balls"].replace(0, pd.NA) / 6
    )

    bowling = bowling.merge(
        death_agg[bowl_group_cols[:1] + ["player"] + ["death_economy"]].rename(
            columns={"bowler": "player"}
        )
        if "bowler" in death_agg.columns
        else death_agg[["match_id", "player", "death_economy"]],
        on=["match_id", "player"],
        how="left",
    )
    return bowling


def main():
    parser = argparse.ArgumentParser(
        description="Build player-match batting/bowling aggregates"
    )
    parser.add_argument(
        "--format", choices=list(RAW_DATA_DIRS.keys()) + ["ALL"], default="IPL"
    )
    args = parser.parse_args()
    formats = list(RAW_DATA_DIRS.keys()) if args.format == "ALL" else [args.format]

    for fmt in formats:
        in_path = Path(str(DELIVERIES_PARQUET).format(fmt=fmt.lower()))
        if not in_path.exists():
            print(
                f"[{fmt}] Skipping - {in_path} not found. Run parse_cricsheet.py first."
            )
            continue

        df = pd.read_parquet(in_path)
        start = time.time()

        batting = build_batting(df)
        bat_path = Path(str(BATTING_PARQUET).format(fmt=fmt.lower()))
        batting.to_parquet(bat_path, index=False)

        bowling = build_bowling(df)
        bowl_path = Path(str(BOWLING_PARQUET).format(fmt=fmt.lower()))
        bowling.to_parquet(bowl_path, index=False)

        elapsed = time.time() - start
        print(f"[{fmt}] {len(batting):,} batting rows -> {bat_path.name}")
        print(f"[{fmt}] {len(bowling):,} bowling rows -> {bowl_path.name}")
        print(f"[{fmt}] Transform took {elapsed:.2f}s\n")


if __name__ == "__main__":
    main()
