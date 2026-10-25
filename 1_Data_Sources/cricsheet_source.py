"""
=============================================================================
EDGE ARCHITECTURE - LAYER 1: DATA SOURCES
File: cricsheet_source.py

PURPOSE:
  Defines the schema loader and data access specification for historical
  ball-by-ball JSON match archives covering IPL, ODI, T20, and Test formats
  from Cricsheet (800K+ deliveries, 4,500+ matches).
=============================================================================
"""

import os
import json
from typing import Dict, Any, List

class CricsheetSource:
    """Manages raw ball-by-ball JSON match archive access and paths."""

    SUPPORTED_FORMATS = ["ipl", "odis", "t20", "tests"]

    def __init__(self, data_root: str = "other/data"):
        self.data_root = data_root

    def get_format_directory(self, match_format: str) -> str:
        """Returns the archive path for a given cricket match format."""
        if match_format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {match_format}. Must be one of {self.SUPPORTED_FORMATS}")
        return os.path.join(self.data_root, match_format)

    def load_match(self, match_format: str, match_id: str) -> Dict[str, Any]:
        """Loads and returns a single match JSON payload by format and ID."""
        file_path = os.path.join(self.get_format_directory(match_format), f"{match_id}.json")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Match file not found: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
