"""
Post-Quantum Cryptography (PQC) Engine — Strictly NIST FIPS 203 & FIPS 204.
Strictly enforces ML-KEM-768 and ML-DSA-65 without silent downgrades or classical fallbacks.
Fails closed if the required post-quantum primitives are unavailable.
"""

import base64
from typing import Tuple, Dict, Any
import oqs
from app.config import CRYPTO_CONFIG

# Query available mechanisms from liboqs provider
ENABLED_KEMS = oqs.get_enabled_kem_mechanisms()
ENABLED_SIGS = oqs.get_enabled_sig_mechanisms()

# Strictly require NIST standardized primitives
REQUIRED_KEM = "ML-KEM-768"
REQUIRED_SIG = "ML-DSA-65"

class PQCError(Exception):
    """Base exception for Post-Quantum cryptographic operations."""
    pass

class PQCProviderUnavailableError(PQCError):
    """Raised when the mandatory NIST PQC algorithms are not supported or disabled."""
    pass

def check_pqc_availability():
    """
    Validates that the mandatory FIPS 203 / 204 algorithms are available.
    Fails closed immediately if unavailable.
    """
    if REQUIRED_KEM not in ENABLED_KEMS:
        raise PQCProviderUnavailableError(
            f"Required PQC provider unavailable. ML-KEM-768 is not enabled in liboqs. "
            f"ML-KEM-768 / ML-DSA-65 cryptographic operations are disabled."
        )
    if REQUIRED_SIG not in ENABLED_SIGS:
        raise PQCProviderUnavailableError(
            f"Required PQC provider unavailable. ML-DSA-65 is not enabled in liboqs. "
            f"ML-KEM-768 / ML-DSA-65 cryptographic operations are disabled."
        )

# Enforce fail-closed check on module initialization
check_pqc_availability()

class PQCKeyEncapsulation:
    """
    Implements NIST FIPS 203 ML-KEM-768 Key Encapsulation Mechanism.
    Strictly uses ML-KEM-768 with zero fallback.
    """
    def __init__(self):
        check_pqc_availability()
        self.alg_name = REQUIRED_KEM

    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """
        Generates (public_key_bytes, secret_key_bytes).
        """
        try:
            with oqs.KeyEncapsulation(self.alg_name) as kem:
                public_key = kem.generate_keypair()
                secret_key = kem.export_secret_key()
                return public_key, secret_key
        except Exception as e:
            raise PQCError(f"Failed to generate ML-KEM-768 keypair: {e}") from e

    def encapsulate(self, public_key: bytes) -> Tuple[bytes, bytes]:
        """
        Performs ML-KEM-768 encapsulation against the recipient's public key.
        Returns (ciphertext_bytes, shared_secret_bytes).
        """
        try:
            with oqs.KeyEncapsulation(self.alg_name) as kem:
                ciphertext, shared_secret = kem.encap_secret(public_key)
                return ciphertext, shared_secret
        except Exception as e:
            raise PQCError(f"Failed to encapsulate secret with ML-KEM-768: {e}") from e

    def decapsulate(self, secret_key: bytes, ciphertext: bytes) -> bytes:
        """
        Performs ML-KEM-768 decapsulation using recipient's secret key.
        Returns shared_secret_bytes.
        """
        try:
            with oqs.KeyEncapsulation(self.alg_name, secret_key=secret_key) as kem:
                shared_secret = kem.decap_secret(ciphertext)
                if not shared_secret:
                    raise PQCError("Decapsulation resulted in empty shared secret")
                return shared_secret
        except Exception as e:
            raise PQCError(f"Failed to decapsulate ciphertext with ML-KEM-768: {e}") from e

class PQCDigitalSignature:
    """
    Implements NIST FIPS 204 ML-DSA-65 Digital Signature Algorithm.
    Strictly uses ML-DSA-65 with zero fallback.
    """
    def __init__(self):
        check_pqc_availability()
        self.alg_name = REQUIRED_SIG

    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """
        Generates (verification_public_key_bytes, signing_secret_key_bytes).
        """
        try:
            with oqs.Signature(self.alg_name) as sig:
                public_key = sig.generate_keypair()
                secret_key = sig.export_secret_key()
                return public_key, secret_key
        except Exception as e:
            raise PQCError(f"Failed to generate ML-DSA-65 keypair: {e}") from e

    def sign(self, secret_key: bytes, message: bytes) -> bytes:
        """
        Generates an ML-DSA-65 signature over the message bytes using the secret key.
        """
        try:
            with oqs.Signature(self.alg_name, secret_key=secret_key) as sig:
                signature = sig.sign(message)
                return signature
        except Exception as e:
            raise PQCError(f"Failed to sign message with ML-DSA-65: {e}") from e

    def verify(self, public_key: bytes, message: bytes, signature: bytes) -> bool:
        """
        Verifies an ML-DSA-65 signature over the message bytes using the public verification key.
        """
        try:
            with oqs.Signature(self.alg_name) as sig:
                return sig.verify(message, signature, public_key)
        except Exception:
            return False

def run_pqc_preflight() -> Dict[str, Any]:
    """
    Executes an end-to-end cryptographic preflight check for ML-KEM-768 and ML-DSA-65.
    Verifies key generation, encapsulation/decapsulation, and signature verification.
    """
    report = {
        "provider": "liboqs-native",
        "kem_algorithm": REQUIRED_KEM,
        "signature_algorithm": REQUIRED_SIG,
        "kem_available": REQUIRED_KEM in ENABLED_KEMS,
        "sig_available": REQUIRED_SIG in ENABLED_SIGS,
        "kem_self_test": False,
        "sig_self_test": False,
        "status": "FAIL_CLOSED"
    }

    if not (report["kem_available"] and report["sig_available"]):
        report["error"] = "Required PQC provider unavailable. ML-KEM-768 / ML-DSA-65 cryptographic operations are disabled."
        return report

    try:
        # Test ML-KEM-768
        kem = PQCKeyEncapsulation()
        pk, sk = kem.generate_keypair()
        ct, ss1 = kem.encapsulate(pk)
        ss2 = kem.decapsulate(sk, ct)
        if ss1 == ss2 and len(ss1) == 32:
            report["kem_self_test"] = True

        # Test ML-DSA-65
        sig = PQCDigitalSignature()
        vpk, ssk = sig.generate_keypair()
        test_msg = b"AegisTrace-PQC-Preflight-Verification-Message-2026"
        signature = sig.sign(ssk, test_msg)
        is_valid = sig.verify(vpk, test_msg, signature)
        is_invalid_rejected = not sig.verify(vpk, b"Tampered-Message", signature)

        if is_valid and is_invalid_rejected:
            report["sig_self_test"] = True

        if report["kem_self_test"] and report["sig_self_test"]:
            report["status"] = "HEALTHY_NATIVE_PQC"
    except Exception as e:
        report["error"] = str(e)
        report["status"] = "FAIL_CLOSED"

    return report

# Global singletons
kem_engine = PQCKeyEncapsulation()
sig_engine = PQCDigitalSignature()

def b64_encode(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8')

def b64_decode(data_str: str) -> bytes:
    return base64.b64decode(data_str.encode('utf-8'))
