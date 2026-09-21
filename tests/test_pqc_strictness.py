"""
Strict Post-Quantum Cryptography & Preflight Verification Tests.
Ensures NIST FIPS 203 ML-KEM-768 and NIST FIPS 204 ML-DSA-65 operate fail-closed.
"""

import pytest
from app.crypto.pqc import (
    PQCKeyEncapsulation,
    PQCDigitalSignature,
    run_pqc_preflight,
    REQUIRED_KEM,
    REQUIRED_SIG
)

def test_pqc_preflight_diagnostics():
    report = run_pqc_preflight()
    assert report["kem_algorithm"] == "ML-KEM-768"
    assert report["signature_algorithm"] == "ML-DSA-65"
    assert report["kem_available"] is True
    assert report["sig_available"] is True
    assert report["kem_self_test"] is True
    assert report["sig_self_test"] is True
    assert report["status"] == "HEALTHY_NATIVE_PQC"

def test_ml_kem_768_fail_closed_tamper():
    kem = PQCKeyEncapsulation()
    pk, sk = kem.generate_keypair()
    ct, ss1 = kem.encapsulate(pk)
    
    # Tamper with ciphertext
    tampered_ct = bytearray(ct)
    tampered_ct[10] ^= 0xFF
    
    # In ML-KEM, implicit rejection returns pseudo-random secret that does not match ss1
    ss_tampered = kem.decapsulate(sk, bytes(tampered_ct))
    assert ss_tampered != ss1

def test_ml_dsa_65_signature_verification_and_tamper_rejection():
    sig = PQCDigitalSignature()
    pk, sk = sig.generate_keypair()
    msg = b"AegisTrace-Defense-Payload-Top-Secret"
    
    signature = sig.sign(sk, msg)
    assert len(signature) > 0
    
    # Valid verification
    assert sig.verify(pk, msg, signature) is True
    
    # Modified message must fail
    assert sig.verify(pk, b"Tampered-Payload", signature) is False
    
    # Corrupted signature must fail
    bad_sig = bytearray(signature)
    bad_sig[5] ^= 0xAA
    assert sig.verify(pk, msg, bytes(bad_sig)) is False
