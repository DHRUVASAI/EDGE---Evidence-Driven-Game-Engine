"""
=============================================================================
EDGE ARCHITECTURE - LAYER 1: DATA SOURCES
File: espn_cdn_assets.py

PURPOSE:
  Specifies the ESPN Cricinfo content delivery network (CDN) path conventions,
  high-definition studio headshot endpoints, and asset resolution rules.
=============================================================================
"""

from typing import Optional

class ESPNCdnAssets:
    """Manages high-definition studio headshot asset URLs from ESPN Cricinfo CDN."""

    BASE_HEADSHOT_URL = "https://a.espncdn.com/i/headshots/cricket/players/full"
    HSCICDN_UPLOAD_URL = "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS"

    @classmethod
    def get_espn_headshot_url(cls, espn_id: str) -> Optional[str]:
        """Constructs a standardized ESPN CDN PNG headshot URL from an ESPN player ID."""
        if not espn_id or not espn_id.isdigit():
            return None
        return f"{cls.BASE_HEADSHOT_URL}/{espn_id}.png"

    @classmethod
    def get_hscicdn_url(cls, folder: str, file_id: str) -> str:
        """Constructs an HSciCDN asset URL for verified secondary media photos."""
        return f"{cls.HSCICDN_UPLOAD_URL}/{folder}/{file_id}.png"
