"""
Encrypted Local Keystore.
Securely stores post-quantum private keys on disk protected with PBKDF2-HMAC-SHA3-256 and AES-256-GCM.
Never stores private keys in plaintext.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

from app.config import KEYSTORE_DIR
from app.crypto.envelope import encrypt_payload_aes_gcm, decrypt_payload_aes_gcm
from app.crypto.kdf import get_secure_random_bytes
from app.crypto.pqc import b64_encode, b64_decode

ITERATIONS = 100_000

class KeystoreError(Exception):
    pass

def derive_keystore_encryption_key(passphrase: str, salt: bytes) -> bytes:
    """
    Derives 256-bit AES key from user passphrase using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=ITERATIONS,
    )
    return kdf.derive(passphrase.encode('utf-8'))

def save_encrypted_keystore(
    user_id: str,
    passphrase: str,
    kem_secret_key: bytes,
    dsa_secret_key: bytes,
    extra_metadata: Dict[str, Any] = None
) -> Path:
    """
    Encrypts user secret keys and saves to disk.
    """
    salt = get_secure_random_bytes(32)
    enc_key = derive_keystore_encryption_key(passphrase, salt)

    payload = {
        "user_id": user_id,
        "kem_secret_key": b64_encode(kem_secret_key),
        "dsa_secret_key": b64_encode(dsa_secret_key),
        "extra": extra_metadata or {}
    }
    payload_bytes = json.dumps(payload).encode('utf-8')

    ct, iv, tag = encrypt_payload_aes_gcm(payload_bytes, enc_key)

    keystore_data = {
        "format": "AegisKeystore-v1",
        "user_id": user_id,
        "salt": b64_encode(salt),
        "iterations": ITERATIONS,
        "kdf": "PBKDF2-HMAC-SHA256",
        "cipher": "AES-256-GCM",
        "iv": b64_encode(iv),
        "tag": b64_encode(tag),
        "encrypted_data": b64_encode(ct)
    }

    file_path = KEYSTORE_DIR / f"{user_id}.keystore"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(keystore_data, f, indent=2)

    return file_path

def load_and_decrypt_keystore(
    user_id: str,
    passphrase: str
) -> Tuple[bytes, bytes, Dict[str, Any]]:
    """
    Loads keystore from disk and decrypts secret keys.
    Returns (kem_secret_key_bytes, dsa_secret_key_bytes, extra_metadata).
    """
    file_path = KEYSTORE_DIR / f"{user_id}.keystore"
    if not file_path.exists():
        raise KeystoreError(f"Keystore file for user '{user_id}' does not exist.")

    with open(file_path, "r", encoding="utf-8") as f:
        keystore_data = json.load(f)

    salt = b64_decode(keystore_data["salt"])
    iv = b64_decode(keystore_data["iv"])
    tag = b64_decode(keystore_data["tag"])
    ct = b64_decode(keystore_data["encrypted_data"])

    enc_key = derive_keystore_encryption_key(passphrase, salt)

    try:
        decrypted_bytes = decrypt_payload_aes_gcm(ct, enc_key, iv, tag)
    except Exception as e:
        raise KeystoreError("Failed to decrypt keystore. Incorrect passphrase or corrupted keystore file.") from e

    payload = json.loads(decrypted_bytes.decode('utf-8'))
    kem_sk = b64_decode(payload["kem_secret_key"])
    dsa_sk = b64_decode(payload["dsa_secret_key"])
    extra = payload.get("extra", {})

    return kem_sk, dsa_sk, extra
