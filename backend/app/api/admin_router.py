"""
Security Administrator & Institutional Health API Router.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from app.config import CRYPTO_CONFIG, AIR_GAP_MODE
from app.database.db import get_db_connection
from app.identity.manager import identity_manager
from app.identity.pki import offline_pki
from app.ledger.chain import immutable_ledger
from app.ledger.consensus import consensus_engine
from app.audit.logger import get_recent_audit_logs
from app.crypto.pqc import run_pqc_preflight

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/pqc-preflight")
def get_pqc_preflight():
    """
    Executes live Post-Quantum Cryptography preflight diagnostics.
    """
    return run_pqc_preflight()

@router.get("/system-health")
def get_system_health():
    conn = get_db_connection()
    try:
        doc_count = conn.execute("SELECT count(*) as count FROM documents").fetchone()["count"]
        event_count = conn.execute("SELECT count(*) as count FROM decryption_events").fetchone()["count"]
    finally:
        conn.close()

    preflight = run_pqc_preflight()

    return {
        "deployment_mode": "OFFLINE_AIR_GAPPED",
        "air_gap_enforced": AIR_GAP_MODE,
        "pqc_preflight": preflight,
        "crypto_suite": {
            "kem": CRYPTO_CONFIG.kem_algorithm,
            "signature": CRYPTO_CONFIG.signature_algorithm,
            "aead": CRYPTO_CONFIG.aead_algorithm,
            "hash": CRYPTO_CONFIG.hash_algorithm,
            "kdf": CRYPTO_CONFIG.kdf_algorithm
        },
        "identity_pki": {
            "root_ca_id": offline_pki.ca_id,
            "root_ca_name": offline_pki.ca_name,
            "enrolled_users_count": len(identity_manager.users),
            "revocations_count": len(offline_pki.revocations)
        },
        "ledger_consensus": {
            "consensus_type": "BFT-PoA-ML-DSA-65",
            "total_validators": len(consensus_engine.validators),
            "online_validators": sum(1 for v in consensus_engine.validators.values() if v.status == "ONLINE"),
            "latest_block_height": immutable_ledger.latest_block.header.block_height,
            "total_blocks": len(immutable_ledger.chain)
        },
        "storage_metrics": {
            "total_encrypted_documents": doc_count,
            "total_forensic_decryption_events": event_count
        }
    }

@router.get("/audit-logs")
def get_audit_logs(limit: int = 100):
    return {"audit_logs": get_recent_audit_logs(limit)}
