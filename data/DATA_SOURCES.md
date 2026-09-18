# Data Sources & Reference Documentation

The EDGE Cricket Analytics platform relies on multi-tier data ingestion spanning historical ball-by-ball archives, player metadata catalogs, and real-time API services.

## 1. Primary Datasets

### A. Cricsheet Historical Match Archives
* **Format**: JSON / CSV
* **Directory Locations**: `ipl/`, `odis/`, `t20/`, `tests/`
* **Coverage**: Complete ball-by-ball records covering IPL, Test, ODI, and T20 International matches.
* **Source Reference**: [https://cricsheet.org/](https://cricsheet.org/)

### B. Player Metadata Catalog
* **File**: `players_data_with_all_info.csv`
* **Records**: 17,385 international & domestic players.
* **Fields**: Player ID, First Name, Last Name, Full Name, DOB, Gender, Batting Style, Bowling Style, Playing Position, Country ID, Country Name, Image Path.
* **Source Reference**: Sourced from Sportmonks Cricket API dataset.

### C. Real-Time API Layer (CricketData API)
* **Endpoint Provider**: `cricketdata.org` (formerly CricAPI)
* **Usage**: Live score polling, upcoming match schedules, and fallback player profile searches.
* **Authentication**: Environment key stored securely in `.env` (`CRICKETDATA_API_KEY`), preserved from Git commits.

## 2. Storage & Large File Management
* **Data Protection**: API keys, credentials, and raw environment configurations are ignored via `.gitignore`.
* **Parquet Caching**: Processed delivery features are serialized locally to `.parquet` format under `edge_pipeline/data/processed/`.
