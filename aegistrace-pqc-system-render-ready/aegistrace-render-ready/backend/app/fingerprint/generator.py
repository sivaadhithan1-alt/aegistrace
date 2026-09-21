"""
Cryptographic Forensic Fingerprint Engine.
Generates unique, covert, session-bound, recipient-specific cryptographic fingerprints.
Enforces Authenticated Encryption (AES-256-GCM) on all watermark payloads.
Zero plaintext identifying metadata leaks inside watermarked documents.
"""

import os
import zlib
import json
import uuid
import datetime
import hmac
import hashlib
from typing import Dict, Any, Tuple
from pydantic import BaseModel
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import CRYPTO_CONFIG
from app.crypto.kdf import get_secure_nonce_hex, get_secure_random_bytes, hash_sha3_256_bytes
from app.crypto.provisioning import get_watermark_protection_key, get_fingerprint_derivation_salt

WATERMARK_MAGIC = b"AEG1"
WATERMARK_VERSION_BYTE = b"\x01"

class FingerprintRecord(BaseModel):
    fingerprint_id: str
    document_id: str
    sender_id: str
    recipient_id: str
    session_id: str
    decryption_event_id: str
    timestamp: str
    random_nonce: str
    algorithm_version: str
    watermark_adapter: str
    content_hash: str
    watermark_hash: str

def generate_covert_fingerprint(
    document_id: str,
    sender_id: str,
    recipient_id: str,
    content_hash: str,
    watermark_adapter: str,
    session_id: str = None,
    decryption_event_id: str = None
) -> Tuple[FingerprintRecord, bytes]:
    """
    Generates a unique cryptographic fingerprint for a specific decryption event.
    
    1. Cryptographically derives fingerprint_id via HMAC-SHA-256 keyed with provisioned institutional salt.
    2. Packages metadata into canonical JSON.
    3. Encrypts payload with AES-256-GCM using derived watermark key (authenticated encryption).
    4. Formats binary container: MAGIC(4B) + VER(1B) + NONCE(12B) + LEN(2B) + CIPHERTEXT + TAG(16B) + CRC(4B).
    
    Returns:
    - FingerprintRecord structured metadata
    - Authenticated encrypted binary payload ready for steganographic embedding
    """
    if not session_id:
        session_id = f"SESS-{uuid.uuid4().hex[:12].upper()}"
    if not decryption_event_id:
        decryption_event_id = f"EVT-DEC-{uuid.uuid4().hex[:16].upper()}"

    random_nonce = get_secure_nonce_hex(16)
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. Cryptographically derive fingerprint_id using HMAC-SHA-256
    salt = get_fingerprint_derivation_salt()
    binding_payload = f"{document_id}|{recipient_id}|{session_id}|{decryption_event_id}|{random_nonce}".encode('utf-8')
    hmac_digest = hmac.new(salt, binding_payload, hashlib.sha256).hexdigest()
    fingerprint_id = f"FP-{hmac_digest[:32].upper()}"

    watermark_hash = hash_sha3_256_bytes(fingerprint_id.encode('utf-8'))

    fp_record = FingerprintRecord(
        fingerprint_id=fingerprint_id,
        document_id=document_id,
        sender_id=sender_id,
        recipient_id=recipient_id,
        session_id=session_id,
        decryption_event_id=decryption_event_id,
        timestamp=timestamp,
        random_nonce=random_nonce,
        algorithm_version=CRYPTO_CONFIG.version,
        watermark_adapter=watermark_adapter,
        content_hash=content_hash,
        watermark_hash=watermark_hash
    )

    # 2. Construct inner payload (contains all required forensic correlation fields)
    inner_payload_dict = {
        "f": fingerprint_id,
        "d": document_id,
        "r": recipient_id,
        "s": session_id,
        "e": decryption_event_id,
        "t": timestamp,
        "n": random_nonce[:8],
        "h": watermark_hash[:16],
        "v": "1.0-enc"
    }
    plaintext_bytes = json.dumps(inner_payload_dict, separators=(',', ':'), sort_keys=True).encode('utf-8')

    # 3. Authenticated encryption (AES-256-GCM)
    wm_key = get_watermark_protection_key()
    aesgcm = AESGCM(wm_key)
    nonce = os.urandom(12)  # 96-bit standard GCM nonce
    
    # Associated Data binds container header
    aad = WATERMARK_MAGIC + WATERMARK_VERSION_BYTE
    ciphertext_and_tag = aesgcm.encrypt(nonce, plaintext_bytes, aad)
    
    ciphertext = ciphertext_and_tag[:-16]
    auth_tag = ciphertext_and_tag[-16:]
    ct_len = len(ciphertext)

    # 4. Binary container structure:
    # MAGIC (4B) + VER (1B) + NONCE (12B) + LEN (2B) + CIPHERTEXT (NB) + TAG (16B)
    container_core = WATERMARK_MAGIC + WATERMARK_VERSION_BYTE + nonce + ct_len.to_bytes(2, byteorder='big') + ciphertext + auth_tag
    crc = zlib.crc32(container_core) & 0xFFFFFFFF
    packed_payload = container_core + crc.to_bytes(4, byteorder='big')

    return fp_record, packed_payload

def unpack_covert_fingerprint_payload(payload_bytes: bytes) -> Dict[str, Any]:
    """
    Unpacks and cryptographically verifies the authenticated encrypted binary watermark payload.
    Fails closed if the magic, container format, or AES-GCM authentication tag is invalid.
    """
    if len(payload_bytes) < 39: # 4 (magic) + 1 (ver) + 12 (nonce) + 2 (len) + 0 (ct) + 16 (tag) + 4 (crc)
        raise ValueError("Fingerprint payload too short")
    
    magic = payload_bytes[:4]
    if magic != WATERMARK_MAGIC:
        raise ValueError(f"Invalid fingerprint magic bytes: {magic}")

    ver = payload_bytes[4:5]
    if ver != WATERMARK_VERSION_BYTE:
        raise ValueError(f"Unsupported watermark container version: {ver.hex()}")

    nonce = payload_bytes[5:17]
    ct_len = int.from_bytes(payload_bytes[17:19], byteorder='big')
    
    expected_total_min = 19 + ct_len + 16
    if len(payload_bytes) < expected_total_min:
        raise ValueError("Incomplete watermark payload buffer")

    ciphertext = payload_bytes[19:19+ct_len]
    auth_tag = payload_bytes[19+ct_len:19+ct_len+16]

    # Authenticated decryption with AES-256-GCM
    wm_key = get_watermark_protection_key()
    aesgcm = AESGCM(wm_key)
    aad = WATERMARK_MAGIC + WATERMARK_VERSION_BYTE
    
    try:
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext + auth_tag, aad)
    except Exception as e:
        raise ValueError("Watermark authentication tag verification failed: payload tampered or unauthorized key.") from e

    return json.loads(decrypted_bytes.decode('utf-8'))
