"""
Cryptographic Entropy and Key Derivation Function (KDF) Utilities.
Adheres to NIST SP 800-56C / RFC 5869 using SHA3-256.
"""

import os
import secrets
import hashlib
from typing import Optional
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

def get_secure_random_bytes(length: int = 32) -> bytes:
    """
    Returns cryptographically secure pseudorandom bytes from OS entropy source.
    Uses secrets.token_bytes (wrapping os.urandom).
    """
    if length <= 0:
        raise ValueError("Requested entropy length must be positive")
    return secrets.token_bytes(length)

def get_secure_nonce_hex(length: int = 32) -> str:
    """
    Returns a hex-encoded cryptographically secure random nonce.
    """
    return get_secure_random_bytes(length).hex()

def derive_key_hkdf_sha3_256(
    secret: bytes,
    length: int = 32,
    salt: Optional[bytes] = None,
    info: Optional[bytes] = None
) -> bytes:
    """
    Derives key material using HKDF with SHA3-256 hash primitive.
    """
    if salt is None:
        salt = b"\x00" * 32
    if info is None:
        info = b"aegis-trace-pqc-kdf-v1"

    hkdf = HKDF(
        algorithm=hashes.SHA3_256(),
        length=length,
        salt=salt,
        info=info
    )
    return hkdf.derive(secret)

def hash_sha3_256_bytes(data: bytes) -> str:
    """
    Computes SHA3-256 digest of raw bytes and returns hex string.
    """
    return hashlib.sha3_256(data).hexdigest()
