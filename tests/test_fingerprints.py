"""
Tests for Dynamic, Recipient-Specific Forensic Fingerprints.
"""

from app.fingerprint.generator import generate_covert_fingerprint, unpack_covert_fingerprint_payload

def test_fingerprint_generation_uniqueness_recipients():
    rec_a, pack_a = generate_covert_fingerprint("DOC-100", "alice", "bob", "hash1", "pdf")
    rec_b, pack_b = generate_covert_fingerprint("DOC-100", "alice", "charlie", "hash1", "pdf")

    assert rec_a.fingerprint_id != rec_b.fingerprint_id
    assert rec_a.recipient_id == "bob"
    assert rec_b.recipient_id == "charlie"

def test_fingerprint_generation_uniqueness_sessions():
    # Same recipient, same document, different decryption sessions
    rec_1, _ = generate_covert_fingerprint("DOC-100", "alice", "bob", "hash1", "pdf")
    rec_2, _ = generate_covert_fingerprint("DOC-100", "alice", "bob", "hash1", "pdf")

    assert rec_1.fingerprint_id != rec_2.fingerprint_id
    assert rec_1.session_id != rec_2.session_id

def test_fingerprint_payload_packing_and_crc_verification():
    rec, packed = generate_covert_fingerprint("DOC-100", "alice", "bob", "hash1", "pdf")
    unpacked = unpack_covert_fingerprint_payload(packed)

    assert unpacked["f"] == rec.fingerprint_id
    assert unpacked["d"] == "DOC-100"
    assert unpacked["r"] == "bob"

    # Corrupt payload -> CRC verification must fail
    bad_packed = bytearray(packed)
    bad_packed[15] ^= 0xFF
    try:
        unpack_covert_fingerprint_payload(bytes(bad_packed))
        assert False, "Should have raised CRC mismatch error"
    except Exception:
        pass
