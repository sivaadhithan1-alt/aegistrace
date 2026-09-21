"""
Unit and Integration Tests for Post-Quantum Cryptography & Envelope Encryption.
Tests NIST FIPS 203 ML-KEM-768, NIST FIPS 204 ML-DSA-65, and AES-256-GCM AEAD.
"""

import pytest
import os
from app.crypto.pqc import kem_engine, sig_engine, PQCError
from app.crypto.envelope import (
    encrypt_payload_aes_gcm, decrypt_payload_aes_gcm,
    create_secure_document_package, decrypt_secure_document_package,
    EnvelopeEncryptionError
)
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

def test_ml_kem_768_keygen_and_encapsulation():
    pk, sk = kem_engine.generate_keypair()
    assert len(pk) > 0
    assert len(sk) > 0

    ct, shared_secret_sender = kem_engine.encapsulate(pk)
    assert len(ct) > 0
    assert len(shared_secret_sender) == 32

    shared_secret_recip = kem_engine.decapsulate(sk, ct)
    assert shared_secret_sender == shared_secret_recip

def test_ml_kem_decapsulation_wrong_ciphertext():
    pk, sk = kem_engine.generate_keypair()
    ct, ss1 = kem_engine.encapsulate(pk)
    
    # Modify ciphertext
    bad_ct = bytearray(ct)
    bad_ct[10] ^= 0xFF
    ss2 = kem_engine.decapsulate(sk, bytes(bad_ct))
    # ML-KEM uses implicit rejection (produces pseudorandom garbage on bad ciphertext)
    assert ss1 != ss2

def test_ml_dsa_65_signing_and_verification():
    vk, sk = sig_engine.generate_keypair()
    message = b"Classified military orders for operation Trident"
    sig = sig_engine.sign(sk, message)
    assert len(sig) > 0

    # Valid verification
    assert sig_engine.verify(vk, message, sig) is True

    # Tampered message must fail verification
    bad_msg = message + b" (tampered)"
    assert sig_engine.verify(vk, bad_msg, sig) is False

    # Wrong verification key must fail
    vk2, _ = sig_engine.generate_keypair()
    assert sig_engine.verify(vk2, message, sig) is False

def test_aes_256_gcm_authenticated_encryption():
    key = os.urandom(32)
    plaintext = b"Sensitive document payload data"
    aad = b"authenticated header data"

    ct, iv, tag = encrypt_payload_aes_gcm(plaintext, key, aad)
    recovered = decrypt_payload_aes_gcm(ct, key, iv, tag, aad)
    assert recovered == plaintext

    # Tamper with ciphertext -> must fail closed
    bad_ct = bytearray(ct)
    bad_ct[0] ^= 0x01
    with pytest.raises(EnvelopeEncryptionError):
        decrypt_payload_aes_gcm(bytes(bad_ct), key, iv, tag, aad)

    # Tamper with AAD -> must fail closed
    with pytest.raises(EnvelopeEncryptionError):
        decrypt_payload_aes_gcm(ct, key, iv, tag, b"altered aad")

def test_multi_recipient_sdoc_package():
    # Sender Alice
    _, alice_sk = sig_engine.generate_keypair()
    alice_vk, _ = sig_engine.generate_keypair()

    # Recipients Bob & Charlie
    bob_ek, bob_dk = kem_engine.generate_keypair()
    charlie_ek, charlie_dk = kem_engine.generate_keypair()

    doc_data = b"CONFIDENTIAL DEFENSE DOCUMENT 2026"
    pkg = create_secure_document_package(
        document_bytes=doc_data,
        document_id="TEST-DOC-001",
        filename="plan.pdf",
        mime_type="application/pdf",
        sender_id="alice",
        sender_signing_secret_key=alice_sk,
        recipient_public_keys={"bob": bob_ek, "charlie": charlie_ek},
        fingerprint_enabled=True
    )

    # Bob decrypts
    bob_out, _ = decrypt_secure_document_package(pkg, "bob", bob_dk)
    assert bob_out == doc_data

    # Charlie decrypts
    charlie_out, _ = decrypt_secure_document_package(pkg, "charlie", charlie_dk)
    assert charlie_out == doc_data

    # Unauthorized David fails
    david_ek, david_dk = kem_engine.generate_keypair()
    with pytest.raises(EnvelopeEncryptionError):
        decrypt_secure_document_package(pkg, "david", david_dk)
