"""
=============================================================================
EDGE ARCHITECTURE - LAYER 1: DATA SOURCES
File: sportmonks_catalog.py

PURPOSE:
  Defines the schema mapping and record parser for the 17,385-player
  SportMonks biographical and skill metadata catalog (birth date, batting
  style, bowling arm, bowling type, and international country).
=============================================================================
"""

from typing import Dict, Any, Optional

class SportmonksCatalog:
    """Player biographical metadata schema and dictionary mapper."""

    EXPECTED_COLUMNS = [
        "player_id", "fullname", "firstname", "lastname",
        "dateofbirth", "gender", "battingstyle", "bowlingstyle",
        "position", "country_id"
    ]

    @staticmethod
    def normalize_row(row: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """Cleans and standardizes raw CSV player records into EDGE schema."""
        return {
            "name": row.get("fullname") or f"{row.get('firstname', '')} {row.get('lastname', '')}".strip(),
            "batting_style": row.get("battingstyle"),
            "bowling_style": row.get("bowlingstyle"),
            "dob": row.get("dateofbirth"),
            "gender": row.get("gender", "m")
        }
