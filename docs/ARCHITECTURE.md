# EDGE Platform Architecture & Technical Documentation

## Overview
The **EDGE Cricket Analytics Platform** is a end-to-end cricket data processing, feature engineering, and analytics visualization system. It combines raw ball-by-ball match data from Cricsheet with player metadata from Sportmonks and real-time endpoints from CricketData API.

```
+-----------------------------------------------------------------------+
|                             EDGE SYSTEM                               |
|                                                                       |
|  +--------------------+   +---------------------+   +---------------+ |
|  | Cricsheet Datasets |   | CricketData API /   |   | Sportmonks    | |
|  | (IPL/ODI/T20/TEST) |   | In-Memory Cache     |   | Metadata DB   | |
|  +---------+----------+   +----------+----------+   +-------+-------+ |
|            |                         |                      |         |
|            v                         v                      v         |
|  +------------------------------------------------------------------+ |
|  |                   EDGE Pipeline Feature Engine                   | |
|  |            (Rolling Form Scores, Delivery Metrics)               | |
|  +-----------------------------------+------------------------------+ |
|                                      |                                |
|                                      v                                |
|  +------------------------------------------------------------------+ |
|  |                       Flask API & Web App                        | |
|  |                 (Dynamic Headshots, Live Scores)                 | |
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

## Core Modules

### 1. Data Pipeline (`edge_pipeline/`)
* **Config (`config.py`)**: Centralized path resolution for cross-platform execution (Windows / Linux / WSL).
* **Ingest (`edge_pipeline/ingest/`)**: Cricsheet JSON parsing and schema normalization.
* **Features (`edge_pipeline/features/`)**: Rolling window calculation for recent form (short-term = 5 innings, long-term = 10 innings).

### 2. Analytics Web Application (`Cricket-API-main/`)
* **`main.py`**: Flask server with cached CricketData API search (`@functools.lru_cache`) and fast local database lookup over 17,385+ player records.
* **`templates/index.html`**: Responsive dark-mode glassmorphism UI with dynamic player headshot resolution, live match scoring widgets, and upcoming schedule views.

## Data Flow & Optimization
1. **Search Query**: Received at `/api/cricketdata/players?name=<query>`.
2. **Local Fallback (0 Hits)**: Query evaluated against indexed local dataset (`players_data_with_all_info.csv`).
3. **API Query (Cached)**: If not found locally, queries `CricketData API` (`v1/players`) with LRU caching to preserve daily API quotas.
4. **Dynamic Image Resolution**: Generates ESPNcricinfo and Sportmonks CDN URLs dynamically with inline SVG fallback (`onerror`).
