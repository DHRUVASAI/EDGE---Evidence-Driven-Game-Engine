# Layer 2: Ingestion Layer

Handles raw data ingestion, JSON parsing, CricAPI live score polling, and high-speed caching.

## Component Layout
* **Python ETL Ingestion Pipeline**: Located under `tools/etl/`
  - `ingest_jsons.py`: Parses Cricsheet ball-by-ball match JSON archives.
  - `ingest_csvs.py`: Ingests player career stats & metadata.
  - `compute_aggregates.py`: Aggregates player career totals per format.
* **Cache System**: Located under `src/data/`
  - `cached_matches.json`: Last known good live match scores serving as fallbacks when API quotas are exhausted.
  - In-memory LRU cache storing CricAPI search results.
