import os
from typing import Optional, Tuple

import psycopg2
import psycopg2.extras


def get_conn():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(db_url)


def init_db() -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS monitors (
                    id UUID PRIMARY KEY,
                    url TEXT UNIQUE NOT NULL,
                    match TEXT NOT NULL,
                    interval_hours INTEGER NOT NULL,
                    email_to TEXT NOT NULL
                )
                """
            )
            conn.commit()


def get_monitor_by_id(monitor_id: str) -> Optional[dict]:
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM monitors WHERE id = %s", (monitor_id,))
            row = cur.fetchone()
            return dict(row) if row else None


def upsert_monitor(
    monitor_id: str, url: str, match: str, interval_hours: int, email_to: str
) -> Tuple[str, bool]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO monitors (id, url, match, interval_hours, email_to)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (url)
                DO UPDATE SET
                    match = EXCLUDED.match,
                    interval_hours = EXCLUDED.interval_hours,
                    email_to = EXCLUDED.email_to
                RETURNING id, (xmax = 0) AS created
                """,
                (monitor_id, url, match, interval_hours, email_to),
            )
            row = cur.fetchone()
            conn.commit()
            return str(row[0]), bool(row[1])
