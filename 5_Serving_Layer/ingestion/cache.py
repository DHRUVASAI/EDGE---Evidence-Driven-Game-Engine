"""EDGE Ingestion Layer - Cache Module
High-performance caching layer to preserve API quota hits and provide sub-5ms lookup latency.
"""

import functools
import time
from typing import Any, Dict, Optional

_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}
_DEFAULT_TTL = 300  # 5 minutes for live data


def get_cache(key: str) -> Optional[Any]:
    """Retrieve an entry from the in-memory cache if not expired."""
    if key in _MEMORY_CACHE:
        entry = _MEMORY_CACHE[key]
        if time.time() < entry["expires_at"]:
            return entry["val"]
        else:
            del _MEMORY_CACHE[key]
    return None


def set_cache(key: str, val: Any, ttl_seconds: int = _DEFAULT_TTL) -> None:
    """Store an entry in the in-memory cache with an expiration timestamp."""
    _MEMORY_CACHE[key] = {
        "val": val,
        "expires_at": time.time() + ttl_seconds
    }


def clear_cache() -> None:
    """Clear all in-memory cached entries."""
    _MEMORY_CACHE.clear()


def memoize_lru(maxsize: int = 128):
    """LRU Cache decorator for internal function memoization."""
    return functools.lru_cache(maxsize=maxsize)
