"""
Tests for ML-DSA-65 Signed Decryption Records & Canonical Verification.
Ensures deterministic serialization, post-quantum signature verification, and fail-closed tamper resistance.
"""

import pytest
from app.fingerprint.record import (
    create_canonical_decryption_record,
    sign_decryption_record,
    verify_signed_decryption_record
)
from app.identity.manager import identity_manager
from app.crypto.pqc import b64_decode, sig_engine

def test_signed_decryption_record_valid_verification():
    _, rahul_sk = identity_manager.get_user_keys_with_passphrase("rahul", "rahul_secret")
    user_info = identity_manager.get_public_user_info("rahul")
    rahul_pk_b64 = user_info["certificate"]["subject"]["public_keys"]["dsa_public_key"]
    rahul_pk = b64_decode(rahul_pk_b64)

    rec = create_canonical_decryption_record(
        event_id="EVT-TEST-001",
        document_id="DOC-TEST-001",
        document_hash="sha3_digest_abc123",
        recipient_id="rahul",
        session_id="SESS-TEST-001",
        fingerprint_id="FP-HASH-999",
        timestamp="2026-09-21T12:00:00Z",
        forensic_copy_hash="sha3_copy_hash_xyz"
    )

    signed_tx = sign_decryption_record(rec, rahul_sk)
    assert signed_tx["signature_info"]["algorithm"] == "ML-DSA-65"
    assert signed_tx["signature_info"]["signer_id"] == "rahul"

    # Verify signature
    is_valid = verify_signed_decryption_record(signed_tx, rahul_pk)
    assert is_valid is True

def test_signed_decryption_record_tampered_fields_fail():
    _, rahul_sk = identity_manager.get_user_keys_with_passphrase("rahul", "rahul_secret")
    user_info = identity_manager.get_public_user_info("rahul")
    rahul_pk_b64 = user_info["certificate"]["subject"]["public_keys"]["dsa_public_key"]
    rahul_pk = b64_decode(rahul_pk_b64)

    base_rec = create_canonical_decryption_record(
        event_id="EVT-TEST-002",
        document_id="DOC-TEST-002",
        document_hash="sha3_digest_original",
        recipient_id="rahul",
        session_id="SESS-TEST-002",
        fingerprint_id="FP-HASH-888",
        timestamp="2026-09-21T12:00:00Z",
        forensic_copy_hash="sha3_copy_hash_abc"
    )

    # 1. Tampered Document Hash
    tx_tampered_doc = sign_decryption_record(base_rec, rahul_sk)
    tx_tampered_doc["record"]["document_hash"] = "sha3_digest_tampered"
    assert verify_signed_decryption_record(tx_tampered_doc, rahul_pk) is False

    # 2. Tampered Recipient
    tx_tampered_recip = sign_decryption_record(base_rec, rahul_sk)
    tx_tampered_recip["record"]["recipient_id"] = "mallory_attacker"
    assert verify_signed_decryption_record(tx_tampered_recip, rahul_pk) is False

    # 3. Tampered Event ID
    tx_tampered_event = sign_decryption_record(base_rec, rahul_sk)
    tx_tampered_event["record"]["event_id"] = "EVT-FORGED-999"
    assert verify_signed_decryption_record(tx_tampered_event, rahul_pk) is False

    # 4. Tampered Timestamp
    tx_tampered_time = sign_decryption_record(base_rec, rahul_sk)
    tx_tampered_time["record"]["timestamp"] = "2026-01-01T00:00:00Z"
    assert verify_signed_decryption_record(tx_tampered_time, rahul_pk) is False

    # 5. Tampered Fingerprint ID Commitment
    tx_tampered_fp = sign_decryption_record(base_rec, rahul_sk)
    tx_tampered_fp["record"]["fingerprint_id"] = "FP-FORGED-000"
    assert verify_signed_decryption_record(tx_tampered_fp, rahul_pk) is False
