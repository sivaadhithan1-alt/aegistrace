"""
System Configuration for AegisTrace PQC Secure Document Distribution System.
Fully offline and air-gapped ready.
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(os.getenv("AEGISTRACE_BASE_DIR", str(Path.cwd()))).expanduser().resolve()
DATA_DIR = Path(os.getenv("AEGISTRACE_DATA_DIR", str(BASE_DIR / "data"))).expanduser().resolve()
KEYSTORE_DIR = DATA_DIR / "keystores"
DOCUMENT_DIR = DATA_DIR / "documents"
FORENSIC_DIR = DATA_DIR / "forensic_exports"
DATABASE_PATH = DATA_DIR / "aegistrace.db"
LEDGER_STORAGE_PATH = DATA_DIR / "ledger_blocks.json"

for d in [DATA_DIR, KEYSTORE_DIR, DOCUMENT_DIR, FORENSIC_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class CryptoSuiteConfig(BaseModel):
    kem_algorithm: str = "ML-KEM-768"       # NIST FIPS 203
    signature_algorithm: str = "ML-DSA-65"  # NIST FIPS 204
    aead_algorithm: str = "AES-256-GCM"     # Authenticated Encryption
    hash_algorithm: str = "SHA3-256"        # NIST FIPS 202
    kdf_algorithm: str = "HKDF-SHA3-256"
    version: str = "1.0-PQC"

CRYPTO_CONFIG = CryptoSuiteConfig()

# Air-gapped deployment enforcement flags
AIR_GAP_MODE = os.getenv("AEGISTRACE_AIR_GAP_MODE", "true").lower() in {"1", "true", "yes", "on"}
EXTERNAL_NETWORK_ALLOWED = os.getenv("AEGISTRACE_EXTERNAL_NETWORK_ALLOWED", "false").lower() in {"1", "true", "yes", "on"}
TELEMETRY_ENABLED = os.getenv("AEGISTRACE_TELEMETRY_ENABLED", "false").lower() in {"1", "true", "yes", "on"}

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Validator Node Identities for Institutional Permissioned Consensus
DEFAULT_VALIDATOR_NODES = [
    {
        "node_id": "val-sec-01",
        "name": "Node 1 — Security Office",
        "role": "Security Compliance",
        "public_key_ref": "sec-office-ml-dsa-pk",
        "status": "ONLINE"
    },
    {
        "node_id": "val-audit-02",
        "name": "Node 2 — Audit Office",
        "role": "Independent Audit",
        "public_key_ref": "audit-office-ml-dsa-pk",
        "status": "ONLINE"
    },
    {
        "node_id": "val-ops-03",
        "name": "Node 3 — Operations Command",
        "role": "Operational Authority",
        "public_key_ref": "ops-command-ml-dsa-pk",
        "status": "ONLINE"
    },
    {
        "node_id": "val-rec-04",
        "name": "Node 4 — Records Archive",
        "role": "Institutional Archives",
        "public_key_ref": "records-archive-ml-dsa-pk",
        "status": "ONLINE"
    },
    {
        "node_id": "val-ver-05",
        "name": "Node 5 — Verification Division",
        "role": "Forensic Verification",
        "public_key_ref": "verification-ml-dsa-pk",
        "status": "ONLINE"
    }
]

# BFT Consensus Threshold: 3 of 5 (60% quorum)
CONSENSUS_THRESHOLD_NUM = 3
CONSENSUS_TOTAL_VALIDATORS = 5
