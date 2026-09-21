"""
Application Security & Forensic Audit Logger.
Maintains persistent audit logs for all security-critical operations.
"""

import json
import uuid
import datetime
from typing import Optional, Dict, Any

from app.database.db import get_db_connection

def log_audit_event(
    action: str,
    actor_id: str,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1 (Local Air-Gap Enclave)"
) -> str:
    log_id = f"AUD-{uuid.uuid4().hex[:12].upper()}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    details_str = json.dumps(details or {}, separators=(',', ':'))

    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO audit_logs (log_id, action, actor_id, target_id, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (log_id, action, actor_id, target_id, details_str, ip_address, timestamp)
        )
        conn.commit()
    finally:
        conn.close()

    return log_id

def get_recent_audit_logs(limit: int = 100) -> list[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT log_id, action, actor_id, target_id, details, ip_address, timestamp
            FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (limit,)
        ).fetchall()

        results = []
        for r in rows:
            results.append({
                "log_id": r["log_id"],
                "action": r["action"],
                "actor_id": r["actor_id"],
                "target_id": r["target_id"],
                "details": json.loads(r["details"]) if r["details"] else {},
                "ip_address": r["ip_address"],
                "timestamp": r["timestamp"]
            })
        return results
    finally:
        conn.close()
