"""
=============================================================================
EDGE ARCHITECTURE - LAYER 1: DATA SOURCES
File: cricapi_live_feed.py

PURPOSE:
  Provides the real-time REST endpoint definitions, HTTP headers, and API
  quota configurations for CricAPI / CricketData.org ongoing match feeds.
=============================================================================
"""

import os
from typing import Dict, Any, Optional

class CricAPILiveFeed:
    """Connector configuration and client endpoints for live cricket match feeds."""

    BASE_URL = "https://api.cricapi.com/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("CRICKETDATA_API_KEY") or os.getenv("CRICAPI_KEY")

    def get_current_matches_url(self) -> str:
        """Returns the endpoint URL for currently active live matches."""
        return f"{self.BASE_URL}/currentMatches?apikey={self.api_key}&offset=0"

    def get_match_info_url(self, match_id: str) -> str:
        """Returns the scorecard detail endpoint for a specific match."""
        return f"{self.BASE_URL}/match_info?apikey={self.api_key}&id={match_id}"
