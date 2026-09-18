# Layer 1: Data Sources

This directory documents and references the primary data feeds feeding into the EDGE Evidence-Driven Game Engine:

## 1. Cricsheet JSON Match Archives (`/ipl`, `/odis`, `/t20`, `/tests`)
- **Format**: Ball-by-ball match JSON files covering all international and IPL matches.
- **Coverage**: 800,000+ deliveries across 4,500+ matches.
- **Source Reference**: [https://cricsheet.org/](https://cricsheet.org/)

## 2. CricAPI Live Feed (CricketData.org)
- **Format**: Real-time HTTP REST endpoints for ongoing match scorecards and international schedules.
- **Quota Management**: Wrapped with in-memory caching to prevent API quota exhaustion.

## 3. Sportmonks Metadata Catalog (`/players_data_with_all_info.csv`)
- **Format**: CSV database containing 17,385 international & domestic player metadata records (IDs, full names, countries, batting/bowling styles).
