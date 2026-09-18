"""EDGE Ingestion Layer - CricketData / CricAPI Data Ingest Engine
Handles fetching live scores, upcoming schedules, and player search data from CricketData API.
"""

import os
import requests
from typing import Dict, List, Any, Optional
from src.ingestion.cache import get_cache, set_cache

CRICKETDATA_API_KEY = os.getenv("CRICKETDATA_API_KEY", "793acd6f-8f1e-4730-986b-929859ebf7c5")
BASE_URL = "https://api.cricapi.com/v1"


def fetch_live_matches() -> List[Dict[str, Any]]:
    """Fetch live match scores from CricAPI or return cached data."""
    cache_key = "live_matches"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    if not CRICKETDATA_API_KEY:
        return []

    try:
        url = f"{BASE_URL}/currentMatches?apikey={CRICKETDATA_API_KEY}&offset=0"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            set_cache(cache_key, data, ttl_seconds=60)  # 1 min cache for live matches
            return data
    except Exception as e:
        print(f"[CricAPI Ingest] Error fetching live matches: {e}")

    return []


def fetch_upcoming_schedule() -> List[Dict[str, Any]]:
    """Fetch upcoming match schedules from CricAPI or return cached data."""
    cache_key = "upcoming_schedule"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    if not CRICKETDATA_API_KEY:
        return []

    try:
        url = f"{BASE_URL}/matches?apikey={CRICKETDATA_API_KEY}&offset=0"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            set_cache(cache_key, data, ttl_seconds=600)  # 10 min cache for schedules
            return data
    except Exception as e:
        print(f"[CricAPI Ingest] Error fetching schedule: {e}")

    return []


def search_api_players(player_name: str) -> List[Dict[str, Any]]:
    """Search players via CricAPI with name filtering and caching."""
    if not player_name or not CRICKETDATA_API_KEY:
        return []

    cache_key = f"player_search_{player_name.lower().strip()}"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    try:
        url = f"{BASE_URL}/players?apikey={CRICKETDATA_API_KEY}&offset=0"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            q_lower = player_name.lower()
            matching = [p for p in data if q_lower in p.get("name", "").lower()]
            set_cache(cache_key, matching, ttl_seconds=3600)  # 1 hr cache for searches
            return matching
    except Exception as e:
        print(f"[CricAPI Ingest] Error searching player '{player_name}': {e}")

    return []
