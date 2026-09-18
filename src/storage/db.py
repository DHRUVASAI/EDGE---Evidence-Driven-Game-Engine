"""EDGE Storage Layer - Database Engine Module
Handles database connections (PostgreSQL / SQLite fallback) for match and player storage.
"""

import os
import sqlite3
from typing import Dict, List, Any, Optional

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/cricmetrics")
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCAL_SQLITE_PATH = os.path.join(PROJECT_ROOT, "data", "edge_storage.db")


def get_sqlite_conn():
    """Create a local SQLite connection as a fallback storage mechanism."""
    os.makedirs(os.path.dirname(LOCAL_SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(LOCAL_SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_storage_schema():
    """Initialize relational database tables for match and player metrics."""
    conn = get_sqlite_conn()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            country TEXT,
            batting_style TEXT,
            bowling_style TEXT,
            position TEXT,
            image_path TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS match_metrics (
            match_id TEXT PRIMARY KEY,
            tournament TEXT,
            teams TEXT,
            date TEXT,
            result TEXT,
            win_probability TEXT
        )
    """)

    conn.commit()
    conn.close()
    print("[EDGE Storage] Database schema initialized successfully.")


if __name__ == "__main__":
    init_storage_schema()
