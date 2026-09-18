"""Shared configuration for the EDGE pipeline.

Paths are resolved relative to this file so the pipeline can be run from
Windows (python) or WSL (python in the `rapids` conda env) without edits.
"""

from pathlib import Path

# Root of the EDGE project (parent of this edge_pipeline/ directory)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Raw Cricsheet JSON folders (already present in the project)
RAW_DATA_DIRS = {
    "IPL": PROJECT_ROOT / "ipl",
    "ODI": PROJECT_ROOT / "odis",
    "T20": PROJECT_ROOT / "t20",
    "TEST": PROJECT_ROOT / "tests",
}

# Where the pipeline writes intermediate/processed data
PROCESSED_DIR = Path(__file__).resolve().parent / "data" / "processed"
BENCHMARK_DIR = Path(__file__).resolve().parent / "data" / "benchmarks"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)

DELIVERIES_PARQUET = PROCESSED_DIR / "deliveries_{fmt}.parquet"
BATTING_PARQUET = PROCESSED_DIR / "player_match_batting_{fmt}.parquet"
BOWLING_PARQUET = PROCESSED_DIR / "player_match_bowling_{fmt}.parquet"
FORM_FEATURES_PARQUET = PROCESSED_DIR / "player_form_features_{fmt}.parquet"
PLAYER_SCORE_CSV = PROCESSED_DIR / "player_form_score_{fmt}.csv"

# Rolling-window sizes (in number of innings) used for "recent form"
FORM_WINDOW_SHORT = 5
FORM_WINDOW_LONG = 10
