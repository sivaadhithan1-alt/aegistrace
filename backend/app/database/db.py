"""
Local SQLite Database Engine with WAL Mode, Indexes, and Integrity Checks.
"""

import sqlite3
from typing import Generator
from app.config import DATABASE_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    from app.database.schema import create_tables
    conn = get_db_connection()
    try:
        create_tables(conn)
    finally:
        conn.close()

init_database = init_db
