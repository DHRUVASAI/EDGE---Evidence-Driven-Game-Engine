"""
Phase 3 - GPU-Accelerated Feature Engineering
==============================================
Computes rolling-window form features for each player:
- Recent batting form (last 5/10 innings): avg, SR, 4s/6s rate, dismissal rate
- Recent bowling form (last 5/10 innings): economy, wicket rate, death economy
- Venue-specific stats (home/away/neutral)
- Opponent-specific stats (head-to-head)
- Workload (balls bowled last 14 days)

Usage:
    # Pandas baseline (run first to get baseline timing)
    python edge_pipeline/features/compute_form_features.py --format IPL --backend pandas

    # cuDF accelerated (same code, just swap backend)
    python edge_pipeline/features/compute_form_features.py --format IPL --backend cudf

    # Run both and compare (benchmark mode)
    python edge_pipeline/features/compute_form_features.py --format IPL --benchmark
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
    FORM_FEATURES_PARQUET,
    FORM_WINDOW_LONG,
    FORM_WINDOW_SHORT,
    RAW_DATA_DIRS,
)


def compute_batting_features(batting_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute rolling batting form features per player.
    Input: player_match_batting (one row per player per match)
    Output: same rows + rolling features
    """
    df = batting_df.copy()
    df = df.sort_values(["player", "date"]).reset_index(drop=True)

    # Ensure numeric
    for col in ["runs", "balls_faced", "fours", "sixes", "was_dismissed", "strike_rate"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Strike rate per innings (use existing strike_rate column)
    df["sr"] = df["strike_rate"]

    # Rolling windows
    for window in [FORM_WINDOW_SHORT, FORM_WINDOW_LONG]:
        # Rolling averages (expanding within player)
        grp = df.groupby("player", group_keys=False)

        df[f"rolling_{window}_avg_runs"] = grp["runs"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_avg_sr"] = grp["sr"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_avg_balls"] = grp["balls_faced"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_dismissal_rate"] = grp["was_dismissed"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_four_rate"] = grp["fours"].transform(
            lambda x: x.rolling(window, min_periods=1).sum()
        ) / grp["balls_faced"].transform(lambda x: x.rolling(window, min_periods=1).sum()).replace(0, pd.NA)
        df[f"rolling_{window}_six_rate"] = grp["sixes"].transform(
            lambda x: x.rolling(window, min_periods=1).sum()
        ) / grp["balls_faced"].transform(lambda x: x.rolling(window, min_periods=1).sum()).replace(0, pd.NA)

    return df


def compute_bowling_features(bowling_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute rolling bowling form features per player.
    Input: player_match_bowling (one row per player per match)
    Output: same rows + rolling features
    """
    df = bowling_df.copy()
    df = df.sort_values(["player", "date"]).reset_index(drop=True)

    # Ensure numeric
    for col in ["balls_bowled", "runs_conceded", "wickets", "economy", "death_economy"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Rolling windows
    for window in [FORM_WINDOW_SHORT, FORM_WINDOW_LONG]:
        grp = df.groupby("player", group_keys=False)

        df[f"rolling_{window}_avg_economy"] = grp["economy"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_avg_wickets"] = grp["wickets"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_wicket_rate"] = grp["wickets"].transform(
            lambda x: x.rolling(window, min_periods=1).sum()
        ) / grp["balls_bowled"].transform(lambda x: x.rolling(window, min_periods=1).sum()).replace(0, pd.NA) * 6  # per over
        df[f"rolling_{window}_avg_death_economy"] = grp["death_economy"].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f"rolling_{window}_workload_balls"] = grp["balls_bowled"].transform(
            lambda x: x.rolling(window, min_periods=1).sum()
        )

    return df


def compute_venue_features(batting_df: pd.DataFrame, bowling_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Compute venue-specific historical averages per player.
    """
    # Batting venue stats
    bat_venue = batting_df.groupby(["player", "venue"], as_index=False).agg(
        venue_matches=("match_id", "count"),
        venue_avg_runs=("runs", "mean"),
        venue_avg_sr=("sr", "mean"),
        venue_dismissal_rate=("was_dismissed", "mean"),
    )
    batting_df = batting_df.merge(bat_venue, on=["player", "venue"], how="left")

    # Bowling venue stats
    bowl_venue = bowling_df.groupby(["player", "venue"], as_index=False).agg(
        venue_bowl_matches=("match_id", "count"),
        venue_avg_economy=("economy", "mean"),
        venue_avg_wickets=("wickets", "mean"),
    )
    bowling_df = bowling_df.merge(bowl_venue, on=["player", "venue"], how="left")

    return batting_df, bowling_df


def compute_opponent_features(batting_df: pd.DataFrame, bowling_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Compute opponent-specific (head-to-head) historical averages per player.
    """
    # Batting vs opponent
    bat_opp = batting_df.groupby(["player", "opponent"], as_index=False).agg(
        opp_matches=("match_id", "count"),
        opp_avg_runs=("runs", "mean"),
        opp_avg_sr=("sr", "mean"),
        opp_dismissal_rate=("was_dismissed", "mean"),
    )
    batting_df = batting_df.merge(bat_opp, on=["player", "opponent"], how="left")

    # Bowling vs opponent
    bowl_opp = bowling_df.groupby(["player", "opponent"], as_index=False).agg(
        opp_bowl_matches=("match_id", "count"),
        opp_avg_economy=("economy", "mean"),
        opp_avg_wickets=("wickets", "mean"),
    )
    bowling_df = bowling_df.merge(bowl_opp, on=["player", "opponent"], how="left")

    return batting_df, bowling_df


def compute_workload_features(bowling_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute recent workload (balls bowled in last 14 days) per player per match.
    """
    df = bowling_df.copy()
    df = df.sort_values(["player", "date"]).reset_index(drop=True)
    df["date"] = pd.to_datetime(df["date"])

    # For each row, sum balls_bowled in previous 14 days (excluding current match)
    def workload_14player(group):
        dates = group["date"].values
        balls = group["balls_bowled"].values
        result = []
        for i, (d, b) in enumerate(zip(dates, balls)):
            mask = (dates < d) & (dates >= d - pd.Timedelta(days=14))
            result.append(balls[mask].sum())
        return pd.Series(result, index=group.index)

    df["workload_14d"] = df.groupby("player", group_keys=False).apply(workload_14player)
    return df


def run_feature_engineering(fmt: str, backend: str = "pandas") -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Main feature engineering pipeline.
    Returns: (batting_features_df, bowling_features_df)
    """
    # Load data
    bat_path = Path(str(BATTING_PARQUET).format(fmt=fmt.lower()))
    bowl_path = Path(str(BOWLING_PARQUET).format(fmt=fmt.lower()))

    if not bat_path.exists() or not bowl_path.exists():
        raise FileNotFoundError(f"Parquet files not found for {fmt}. Run transform first.")

    batting = pd.read_parquet(bat_path)
    bowling = pd.read_parquet(bowl_path)

    print(f"[{fmt}] Loaded {len(batting):,} batting rows, {len(bowling):,} bowling rows")

    # Compute features
    batting = compute_batting_features(batting)
    bowling = compute_bowling_features(bowling)
    batting, bowling = compute_venue_features(batting, bowling)
    batting, bowling = compute_opponent_features(batting, bowling)
    bowling = compute_workload_features(bowling)

    # Save
    out_bat = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_batting"))
    out_bowl = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_bowling"))

    batting.to_parquet(out_bat, index=False)
    bowling.to_parquet(out_bowl, index=False)

    print(f"[{fmt}] Saved batting features -> {out_bat.name} ({len(batting):,} rows)")
    print(f"[{fmt}] Saved bowling features -> {out_bowl.name} ({len(bowling):,} rows)")

    return batting, bowling


def benchmark_backends(fmt: str):
    """Run both pandas and cuDF and compare speed."""
    print(f"\n{'='*60}")
    print(f"BENCHMARK: {fmt} - pandas vs cuDF")
    print(f"{'='*60}")

    # Pandas baseline
    print("\n[1/2] Running pandas baseline...")
    start = time.time()
    run_feature_engineering(fmt, backend="pandas")
    pandas_time = time.time() - start
    print(f"    pandas time: {pandas_time:.2f}s")

    # cuDF accelerated
    print("\n[2/2] Running cuDF accelerated...")
    try:
        import cudf.pandas
        cudf.pandas.install()
        print("    cuDF pandas acceleration enabled")
    except ImportError:
        print("    cuDF not available, skipping")
        return

    start = time.time()
    run_feature_engineering(fmt, backend="cudf")
    cudf_time = time.time() - start
    print(f"    cuDF time: {cudf_time:.2f}s")

    # Results
    speedup = pandas_time / cudf_time if cudf_time > 0 else float('inf')
    print(f"\n{'='*60}")
    print(f"RESULTS: pandas={pandas_time:.2f}s  cuDF={cudf_time:.2f}s  speedup={speedup:.1f}x")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Compute rolling form features (pandas/cuDF)")
    parser.add_argument("--format", choices=list(RAW_DATA_DIRS.keys()) + ["ALL"], default="IPL")
    parser.add_argument("--backend", choices=["pandas", "cudf"], default="pandas")
    parser.add_argument("--benchmark", action="store_true", help="Run both backends and compare")
    args = parser.parse_args()

    if args.backend == "cudf":
        try:
            import cudf.pandas
            cudf.pandas.install()
            print("cuDF pandas acceleration enabled")
        except ImportError:
            print("cuDF not installed. Run: pip install cudf-cu12")
            sys.exit(1)

    formats = list(RAW_DATA_DIRS.keys()) if args.format == "ALL" else [args.format]

    if args.benchmark:
        for fmt in formats:
            benchmark_backends(fmt)
    else:
        for fmt in formats:
            run_feature_engineering(fmt, backend=args.backend)


if __name__ == "__main__":
    main()