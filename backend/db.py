import sqlite3
from pathlib import Path
from typing import Optional, Tuple

DB_PATH = Path(__file__).resolve().parent / "crawler.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS monitors (
                id TEXT PRIMARY KEY,
                url TEXT UNIQUE NOT NULL,
                match TEXT NOT NULL,
                interval_hours INTEGER NOT NULL,
                email_to TEXT NOT NULL
            )
            """
        )


def get_monitor_by_url(url: str) -> Optional[sqlite3.Row]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM monitors WHERE url = ?", (url,)).fetchone()
        return row


def get_monitor_by_id(monitor_id: str) -> Optional[sqlite3.Row]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM monitors WHERE id = ?", (monitor_id,)).fetchone()
        return row


def insert_monitor(
    monitor_id: str, url: str, match: str, interval_hours: int, email_to: str
) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO monitors (id, url, match, interval_hours, email_to) VALUES (?, ?, ?, ?, ?)",
            (monitor_id, url, match, interval_hours, email_to),
        )


def upsert_monitor(
    monitor_id: str, url: str, match: str, interval_hours: int, email_to: str
) -> Tuple[str, bool]:
    existing = get_monitor_by_url(url)
    if existing:
        return existing["id"], False
    insert_monitor(monitor_id, url, match, interval_hours, email_to)
    return monitor_id, True
