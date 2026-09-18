"""
Phase 1/2 - BigQuery Loader
============================
Loads Parquet files to BigQuery tables:
- raw_deliveries
- player_match_batting
- player_match_bowling
- player_form_features (batting + bowling)
- player_form_score (final XI + scores)

Usage:
    python edge_pipeline/cloud/load_to_bq.py --project YOUR_PROJECT_ID --dataset edge_cricket --format IPL
"""

import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from edge_pipeline.config import (
    BATTING_PARQUET,
    BOWLING_PARQUET,
    DELIVERIES_PARQUET,
    FORM_FEATURES_PARQUET,
    PLAYER_SCORE_CSV,
    RAW_DATA_DIRS,
)

try:
    from google.cloud import bigquery
    from google.cloud.bigquery import LoadJobConfig, SourceFormat, WriteDisposition
    BQ_AVAILABLE = True
except ImportError:
    BQ_AVAILABLE = False
    print("google-cloud-bigquery not installed. Run: pip install google-cloud-bigquery")


# ============================================================
# TABLE SCHEMAS
# ============================================================

RAW_DELIVERIES_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("format", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("season", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("city", "STRING"),
    bigquery.SchemaField("event", "STRING"),
    bigquery.SchemaField("gender", "STRING"),
    bigquery.SchemaField("team_a", "STRING"),
    bigquery.SchemaField("team_b", "STRING"),
    bigquery.SchemaField("winner", "STRING"),
    bigquery.SchemaField("innings", "INTEGER"),
    bigquery.SchemaField("batting_team", "STRING"),
    bigquery.SchemaField("bowling_team", "STRING"),
    bigquery.SchemaField("over", "INTEGER"),
    bigquery.SchemaField("ball_in_over", "INTEGER"),
    bigquery.SchemaField("batter", "STRING"),
    bigquery.SchemaField("bowler", "STRING"),
    bigquery.SchemaField("non_striker", "STRING"),
    bigquery.SchemaField("runs_batter", "INTEGER"),
    bigquery.SchemaField("runs_extras", "INTEGER"),
    bigquery.SchemaField("runs_total", "INTEGER"),
    bigquery.SchemaField("is_wide", "BOOLEAN"),
    bigquery.SchemaField("is_noball", "BOOLEAN"),
    bigquery.SchemaField("is_bye", "BOOLEAN"),
    bigquery.SchemaField("is_legbye", "BOOLEAN"),
    bigquery.SchemaField("is_wicket", "BOOLEAN"),
    bigquery.SchemaField("wicket_kind", "STRING"),
    bigquery.SchemaField("player_out", "STRING"),
]

PLAYER_MATCH_BATTING_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("format", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("season", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("team_a", "STRING"),
    bigquery.SchemaField("team_b", "STRING"),
    bigquery.SchemaField("batting_team", "STRING"),
    bigquery.SchemaField("opponent", "STRING"),
    bigquery.SchemaField("player", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("runs", "INTEGER"),
    bigquery.SchemaField("balls_faced", "INTEGER"),
    bigquery.SchemaField("fours", "INTEGER"),
    bigquery.SchemaField("sixes", "INTEGER"),
    bigquery.SchemaField("strike_rate", "FLOAT"),
    bigquery.SchemaField("was_dismissed", "BOOLEAN"),
]

PLAYER_MATCH_BOWLING_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("format", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("season", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("team_a", "STRING"),
    bigquery.SchemaField("team_b", "STRING"),
    bigquery.SchemaField("bowling_team", "STRING"),
    bigquery.SchemaField("opponent", "STRING"),
    bigquery.SchemaField("player", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("balls_bowled", "INTEGER"),
    bigquery.SchemaField("runs_conceded", "INTEGER"),
    bigquery.SchemaField("wickets", "INTEGER"),
    bigquery.SchemaField("overs", "FLOAT"),
    bigquery.SchemaField("economy", "FLOAT"),
    bigquery.SchemaField("death_economy", "FLOAT"),
]

PLAYER_FORM_SCORE_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("team", "STRING"),
    bigquery.SchemaField("opponent", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("player", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("role", "STRING"),
    bigquery.SchemaField("form_score_100", "FLOAT"),
    bigquery.SchemaField("is_captain", "BOOLEAN"),
    bigquery.SchemaField("is_vice_captain", "BOOLEAN"),
    bigquery.SchemaField("selection_order", "INTEGER"),
    bigquery.SchemaField("rationale", "STRING"),
]

# ============================================================
# FEATURE TABLE SCHEMAS
# ============================================================

PLAYER_FORM_FEATURES_BATTING_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("format", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("season", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("team_a", "STRING"),
    bigquery.SchemaField("team_b", "STRING"),
    bigquery.SchemaField("batting_team", "STRING"),
    bigquery.SchemaField("opponent", "STRING"),
    bigquery.SchemaField("player", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("runs", "INTEGER"),
    bigquery.SchemaField("balls_faced", "INTEGER"),
    bigquery.SchemaField("fours", "INTEGER"),
    bigquery.SchemaField("sixes", "INTEGER"),
    bigquery.SchemaField("strike_rate", "FLOAT"),
    bigquery.SchemaField("was_dismissed", "BOOLEAN"),
    bigquery.SchemaField("sr", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_runs", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_sr", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_balls", "FLOAT"),
    bigquery.SchemaField("rolling_5_dismissal_rate", "FLOAT"),
    bigquery.SchemaField("rolling_5_four_rate", "FLOAT"),
    bigquery.SchemaField("rolling_5_six_rate", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_runs", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_sr", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_balls", "FLOAT"),
    bigquery.SchemaField("rolling_10_dismissal_rate", "FLOAT"),
    bigquery.SchemaField("rolling_10_four_rate", "FLOAT"),
    bigquery.SchemaField("rolling_10_six_rate", "FLOAT"),
    bigquery.SchemaField("venue_matches", "INTEGER"),
    bigquery.SchemaField("venue_avg_runs", "FLOAT"),
    bigquery.SchemaField("venue_avg_sr", "FLOAT"),
    bigquery.SchemaField("venue_dismissal_rate", "FLOAT"),
    bigquery.SchemaField("opp_matches", "INTEGER"),
    bigquery.SchemaField("opp_avg_runs", "FLOAT"),
    bigquery.SchemaField("opp_avg_sr", "FLOAT"),
    bigquery.SchemaField("opp_dismissal_rate", "FLOAT"),
]

PLAYER_FORM_FEATURES_BOWLING_SCHEMA = [
    bigquery.SchemaField("match_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("format", "STRING"),
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("season", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("team_a", "STRING"),
    bigquery.SchemaField("team_b", "STRING"),
    bigquery.SchemaField("bowling_team", "STRING"),
    bigquery.SchemaField("opponent", "STRING"),
    bigquery.SchemaField("player", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("balls_bowled", "INTEGER"),
    bigquery.SchemaField("runs_conceded", "INTEGER"),
    bigquery.SchemaField("wickets", "INTEGER"),
    bigquery.SchemaField("overs", "FLOAT"),
    bigquery.SchemaField("economy", "FLOAT"),
    bigquery.SchemaField("death_economy", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_economy", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_wickets", "FLOAT"),
    bigquery.SchemaField("rolling_5_wicket_rate", "FLOAT"),
    bigquery.SchemaField("rolling_5_avg_death_economy", "FLOAT"),
    bigquery.SchemaField("rolling_5_workload_balls", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_economy", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_wickets", "FLOAT"),
    bigquery.SchemaField("rolling_10_wicket_rate", "FLOAT"),
    bigquery.SchemaField("rolling_10_avg_death_economy", "FLOAT"),
    bigquery.SchemaField("rolling_10_workload_balls", "FLOAT"),
    bigquery.SchemaField("venue_bowl_matches", "INTEGER"),
    bigquery.SchemaField("venue_avg_economy", "FLOAT"),
    bigquery.SchemaField("venue_avg_wickets", "FLOAT"),
    bigquery.SchemaField("opp_bowl_matches", "INTEGER"),
    bigquery.SchemaField("opp_avg_economy", "FLOAT"),
    bigquery.SchemaField("opp_avg_wickets", "FLOAT"),
    bigquery.SchemaField("workload_14d", "INTEGER"),
]


# ============================================================
# LOAD FUNCTIONS
# ============================================================

def get_client(project_id: str) -> bigquery.Client:
    """Create BigQuery client."""
    return bigquery.Client(project=project_id)


def load_parquet_to_bq(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    table_id: str,
    parquet_path: Path,
    schema: list,
    write_disposition: WriteDisposition = WriteDisposition.WRITE_TRUNCATE,
) -> int:
    """Load a Parquet file to BigQuery."""
    table_ref = f"{project_id}.{dataset_id}.{table_id}"

    job_config = LoadJobConfig(
        source_format=SourceFormat.PARQUET,
        schema=schema,
        write_disposition=write_disposition,
        autodetect=False,
    )

    print(f"  Loading {parquet_path.name} -> {table_ref}...")
    with open(parquet_path, "rb") as f:
        job = client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()  # Wait for completion

    table = client.get_table(table_ref)
    print(f"    Loaded {table.num_rows:,} rows")
    return table.num_rows


def load_csv_to_bq(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    table_id: str,
    csv_path: Path,
    schema: list,
    write_disposition: WriteDisposition = WriteDisposition.WRITE_TRUNCATE,
) -> int:
    """Load a CSV file to BigQuery."""
    table_ref = f"{project_id}.{dataset_id}.{table_id}"

    job_config = LoadJobConfig(
        source_format=SourceFormat.CSV,
        schema=schema,
        write_disposition=write_disposition,
        autodetect=False,
        skip_leading_rows=1,
    )

    print(f"  Loading {csv_path.name} -> {table_ref}...")
    with open(csv_path, "rb") as f:
        job = client.load_table_from_file(f, table_ref, job_config=job_config)
    job.result()

    table = client.get_table(table_ref)
    print(f"    Loaded {table.num_rows:,} rows")
    return table.num_rows


def create_dataset_if_not_exists(client: bigquery.Client, project_id: str, dataset_id: str, location: str = "US"):
    """Create BigQuery dataset if it doesn't exist."""
    dataset_ref = f"{project_id}.{dataset_id}"
    try:
        client.get_dataset(dataset_ref)
        print(f"Dataset {dataset_ref} already exists")
    except Exception:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = location
        client.create_dataset(dataset)
        print(f"Created dataset {dataset_ref} in {location}")


def validate_row_counts(client: bigquery.Client, project_id: str, dataset_id: str, fmt: str):
    """Validate loaded row counts against expectations."""
    print(f"\n  Validating row counts for {fmt}...")

    # Count matches in raw_deliveries
    query = f"""
    SELECT
        COUNT(DISTINCT match_id) as matches,
        COUNT(*) as deliveries
    FROM `{project_id}.{dataset_id}.raw_deliveries`
    WHERE format = '{fmt.upper()}'
    """
    result = client.query(query).result()
    for row in result:
        print(f"    raw_deliveries: {row.matches} matches, {row.deliveries:,} deliveries")

    # Count batting rows
    query = f"""
    SELECT COUNT(*) as rows, COUNT(DISTINCT player) as players, COUNT(DISTINCT match_id) as matches
    FROM `{project_id}.{dataset_id}.player_match_batting`
    WHERE format = '{fmt.upper()}'
    """
    result = client.query(query).result()
    for row in result:
        print(f"    player_match_batting: {row.rows:,} rows, {row.players} players, {row.matches} matches")

    # Count bowling rows
    query = f"""
    SELECT COUNT(*) as rows, COUNT(DISTINCT player) as players, COUNT(DISTINCT match_id) as matches
    FROM `{project_id}.{dataset_id}.player_match_bowling`
    WHERE format = '{fmt.upper()}'
    """
    result = client.query(query).result()
    for row in result:
        print(f"    player_match_bowling: {row.rows:,} rows, {row.players} players, {row.matches} matches")


def run_load(project_id: str, dataset_id: str, fmt: str, location: str = "US"):
    """Main load pipeline for a format."""
    if not BQ_AVAILABLE:
        print("ERROR: google-cloud-bigquery not installed")
        sys.exit(1)

    client = get_client(project_id)
    create_dataset_if_not_exists(client, project_id, dataset_id, location)

    print(f"\n{'='*60}")
    print(f"LOADING {fmt} TO BIGQUERY: {project_id}.{dataset_id}")
    print(f"{'='*60}")

    # 1. raw_deliveries
    del_path = Path(str(DELIVERIES_PARQUET).format(fmt=fmt.lower()))
    if del_path.exists():
        load_parquet_to_bq(client, project_id, dataset_id, "raw_deliveries", del_path, RAW_DELIVERIES_SCHEMA)
    else:
        print(f"  SKIP: {del_path} not found")

    # 2. player_match_batting
    bat_path = Path(str(BATTING_PARQUET).format(fmt=fmt.lower()))
    if bat_path.exists():
        load_parquet_to_bq(client, project_id, dataset_id, "player_match_batting", bat_path, PLAYER_MATCH_BATTING_SCHEMA)
    else:
        print(f"  SKIP: {bat_path} not found")

    # 3. player_match_bowling
    bowl_path = Path(str(BOWLING_PARQUET).format(fmt=fmt.lower()))
    if bowl_path.exists():
        load_parquet_to_bq(client, project_id, dataset_id, "player_match_bowling", bowl_path, PLAYER_MATCH_BOWLING_SCHEMA)
    else:
        print(f"  SKIP: {bowl_path} not found")

    # 4. player_form_features (batting)
    feat_bat_path = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_batting"))
    if feat_bat_path.exists():
        load_parquet_to_bq(client, project_id, dataset_id, "player_form_features_batting", feat_bat_path, PLAYER_FORM_FEATURES_BATTING_SCHEMA)
    else:
        print(f"  SKIP: {feat_bat_path} not found")

    # 4b. player_form_features (bowling)
    feat_bowl_path = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_bowling"))
    if feat_bowl_path.exists():
        load_parquet_to_bq(client, project_id, dataset_id, "player_form_features_bowling", feat_bowl_path, PLAYER_FORM_FEATURES_BOWLING_SCHEMA)
    else:
        print(f"  SKIP: {feat_bowl_path} not found")

    # 5. player_form_score (final XI + scores)
    score_path = Path(str(PLAYER_SCORE_CSV).format(fmt=fmt.lower()))
    if score_path.exists():
        load_csv_to_bq(client, project_id, dataset_id, "player_form_score", score_path, PLAYER_FORM_SCORE_SCHEMA)
    else:
        print(f"  SKIP: {score_path} not found")

    # Validate
    validate_row_counts(client, project_id, dataset_id, fmt)

    print(f"\n{'='*60}")
    print(f"LOAD COMPLETE FOR {fmt}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Load Parquet/CSV to BigQuery")
    parser.add_argument("--project", required=True, help="GCP Project ID")
    parser.add_argument("--dataset", default="edge_cricket", help="BigQuery dataset ID")
    parser.add_argument("--format", choices=list(RAW_DATA_DIRS.keys()) + ["ALL"], default="IPL")
    parser.add_argument("--location", default="US", help="BigQuery location (US, EU, etc.)")
    args = parser.parse_args()

    formats = list(RAW_DATA_DIRS.keys()) if args.format == "ALL" else [args.format]

    for fmt in formats:
        run_load(args.project, args.dataset, fmt, args.location)


if __name__ == "__main__":
    main()