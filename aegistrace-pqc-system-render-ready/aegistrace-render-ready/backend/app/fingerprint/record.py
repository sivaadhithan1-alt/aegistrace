"""
Canonical Decryption Provenance Record.
Defines schema and cryptographic signing operations for decryption events.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.config import CRYPTO_CONFIG
from app.crypto.pqc import sig_engine, b64_encode, b64_decode
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

class DecryptionRecord(BaseModel):
    event_id: str
    document_id: str
    document_hash: str
    recipient_id: str
    session_id: str
    fingerprint_id: str
    timestamp: str
    algorithm_versions: Dict[str, str]
    watermark_version: str
    forensic_copy_hash: str

def create_canonical_decryption_record(
    event_id: str,
    document_id: str,
    document_hash: str,
    recipient_id: str,
    session_id: str,
    fingerprint_id: str,
    timestamp: str,
    forensic_copy_hash: str
) -> Dict[str, Any]:
    """
    Constructs the canonical dictionary representing a verified decryption event.
    """
    record = {
        "event_id": event_id,
        "document_id": document_id,
        "document_hash": document_hash,
        "recipient_id": recipient_id,
        "session_id": session_id,
        "fingerprint_id": fingerprint_id,
        "timestamp": timestamp,
        "algorithm_versions": {
            "kem": CRYPTO_CONFIG.kem_algorithm,
            "sig": CRYPTO_CONFIG.signature_algorithm,
            "aead": CRYPTO_CONFIG.aead_algorithm,
            "hash": CRYPTO_CONFIG.hash_algorithm
        },
        "watermark_version": "1.0-covert",
        "forensic_copy_hash": forensic_copy_hash
    }
    return record

def sign_decryption_record(
    record: Dict[str, Any],
    recipient_dsa_secret_key: bytes
) -> Dict[str, Any]:
    """
    Signs the canonicalized decryption record using recipient's ML-DSA-65 private key.
    Returns signed envelope dictionary.
    """
    canonical_bytes = canonicalize(record)
    record_hash = canonical_hash_sha3_256(record)
    signature = sig_engine.sign(recipient_dsa_secret_key, canonical_bytes)

    return {
        "record": record,
        "record_hash_sha3": record_hash,
        "signature_info": {
            "algorithm": CRYPTO_CONFIG.signature_algorithm,
            "signature": b64_encode(signature),
            "signer_id": record["recipient_id"]
        }
    }

def verify_signed_decryption_record(
    signed_envelope: Dict[str, Any],
    recipient_dsa_public_key: bytes
) -> bool:
    """
    Verifies that the canonical decryption record was signed by the recipient's ML-DSA-65 public key.
    """
    record = signed_envelope.get("record", {})
    sig_info = signed_envelope.get("signature_info", {})
    sig_bytes = b64_decode(sig_info.get("signature", ""))

    canonical_bytes = canonicalize(record)
    return sig_engine.verify(recipient_dsa_public_key, canonical_bytes, sig_bytes)
