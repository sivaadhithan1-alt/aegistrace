"""
Forensic Watermark Encryption & Fail-Closed Integrity Tests.
Verifies AES-256-GCM encryption of payloads, absence of plaintext metadata leaks, and fail-closed behavior on tampering.
"""

import pytest
from app.fingerprint.generator import (
    generate_covert_fingerprint,
    unpack_covert_fingerprint_payload,
    WATERMARK_MAGIC,
    WATERMARK_VERSION_BYTE
)

def test_watermark_payload_authenticated_encryption():
    doc_id = "DOC-SEC-999"
    sender_id = "arjun"
    recipient_id = "rahul"
    session_id = "SESS-SEC-123"
    event_id = "EVT-DEC-456"
    
    rec, packed_payload = generate_covert_fingerprint(
        document_id=doc_id,
        sender_id=sender_id,
        recipient_id=recipient_id,
        content_hash="abc123sha3hash",
        watermark_adapter="PDF-MultiLayer-Adapter-v1",
        session_id=session_id,
        decryption_event_id=event_id
    )
    
    # 1. Check binary header
    assert packed_payload.startswith(WATERMARK_MAGIC)
    
    # 2. Check that plaintext identifying strings DO NOT appear anywhere in the binary container
    assert recipient_id.encode('utf-8') not in packed_payload
    assert doc_id.encode('utf-8') not in packed_payload
    assert session_id.encode('utf-8') not in packed_payload
    assert event_id.encode('utf-8') not in packed_payload
    assert rec.fingerprint_id.encode('utf-8') not in packed_payload
    
    # 3. Check authenticated unpacking with valid key
    unpacked = unpack_covert_fingerprint_payload(packed_payload)
    assert unpacked["f"] == rec.fingerprint_id
    assert unpacked["d"] == doc_id
    assert unpacked["r"] == recipient_id
    assert unpacked["s"] == session_id
    assert unpacked["e"] == event_id

def test_watermark_payload_tampered_ciphertext_fails():
    rec, packed_payload = generate_covert_fingerprint(
        document_id="DOC-SEC-101",
        sender_id="arjun",
        recipient_id="priya",
        content_hash="contenthash",
        watermark_adapter="PDF-MultiLayer-Adapter-v1"
    )
    
    # Modify ciphertext byte
    tampered = bytearray(packed_payload)
    tampered[22] ^= 0x55
    
    with pytest.raises(ValueError) as excinfo:
        unpack_covert_fingerprint_payload(bytes(tampered))
    assert "tag verification failed" in str(excinfo.value).lower() or "authentication" in str(excinfo.value).lower()

def test_watermark_payload_tampered_tag_fails():
    rec, packed_payload = generate_covert_fingerprint(
        document_id="DOC-SEC-102",
        sender_id="arjun",
        recipient_id="priya",
        content_hash="contenthash",
        watermark_adapter="PDF-MultiLayer-Adapter-v1"
    )
    
    # Modify GCM authentication tag (last 20 bytes include 16B tag + 4B CRC)
    tampered = bytearray(packed_payload)
    tampered[-10] ^= 0xAA
    
    with pytest.raises(ValueError) as excinfo:
        unpack_covert_fingerprint_payload(bytes(tampered))
    assert "tag verification failed" in str(excinfo.value).lower() or "authentication" in str(excinfo.value).lower()

def test_watermark_payload_tampered_nonce_fails():
    rec, packed_payload = generate_covert_fingerprint(
        document_id="DOC-SEC-103",
        sender_id="arjun",
        recipient_id="priya",
        content_hash="contenthash",
        watermark_adapter="PDF-MultiLayer-Adapter-v1"
    )
    
    # Modify GCM Nonce (bytes 5 to 17)
    tampered = bytearray(packed_payload)
    tampered[8] ^= 0xFF
    
    with pytest.raises(ValueError) as excinfo:
        unpack_covert_fingerprint_payload(bytes(tampered))
    assert "tag verification failed" in str(excinfo.value).lower() or "authentication" in str(excinfo.value).lower()

def test_watermark_payload_tampered_version_fails():
    rec, packed_payload = generate_covert_fingerprint(
        document_id="DOC-SEC-104",
        sender_id="arjun",
        recipient_id="priya",
        content_hash="contenthash",
        watermark_adapter="PDF-MultiLayer-Adapter-v1"
    )
    
    # Modify version byte (byte 4)
    tampered = bytearray(packed_payload)
    tampered[4] = 0x99
    
    with pytest.raises(ValueError) as excinfo:
        unpack_covert_fingerprint_payload(bytes(tampered))
    assert "version" in str(excinfo.value).lower()
