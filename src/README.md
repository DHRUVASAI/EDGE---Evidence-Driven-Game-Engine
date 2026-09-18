# Source Code Directory (`/src`)

This directory houses the core source code for the EDGE Cricket Analytics Platform:

## Directory Structure
* **`edge_pipeline/`**: Python ETL and feature engineering pipeline for Cricsheet data processing.
* **`Cricket-API-main/`**: Flask web application server (`main.py`) and UI templates (`templates/index.html`).

## Execution Commands
* **Run Web Application**: `python Cricket-API-main/main.py` (App starts on `http://localhost:5050`)
* **Run Feature Pipeline**: `python -m edge_pipeline.ingest.cricsheet`
