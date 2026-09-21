"""
Secure Document Container (.SDOC) & Multi-Recipient Post-Quantum Envelope Encryption.
Uses AES-256-GCM authenticated symmetric encryption and ML-KEM-768 key encapsulation.
"""

import os
import json
import base64
from typing import Dict, List, Any, Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import CRYPTO_CONFIG
from app.crypto.pqc import kem_engine, sig_engine, b64_encode, b64_decode, PQCError
from app.crypto.kdf import get_secure_random_bytes, derive_key_hkdf_sha3_256, hash_sha3_256_bytes
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

class EnvelopeEncryptionError(Exception):
    """Exception raised for envelope encryption or decryption failures."""
    pass

def encrypt_payload_aes_gcm(plaintext: bytes, key: bytes, aad: Optional[bytes] = None) -> Tuple[bytes, bytes, bytes]:
    """
    Encrypts plaintext with AES-256-GCM.
    Returns (ciphertext, iv, tag).
    Note: cryptography AESGCM appends the 16-byte tag to the ciphertext. We separate them cleanly.
    """
    if len(key) != 32:
        raise ValueError("AES-256 key must be 32 bytes")
    
    iv = get_secure_random_bytes(12)  # 96-bit standard IV for GCM
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(iv, plaintext, aad)
    ciphertext = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]
    return ciphertext, iv, tag

def decrypt_payload_aes_gcm(ciphertext: bytes, key: bytes, iv: bytes, tag: bytes, aad: Optional[bytes] = None) -> bytes:
    """
    Decrypts ciphertext with AES-256-GCM and verifies authentication tag.
    Fails closed on tamper/corruption.
    """
    if len(key) != 32:
        raise ValueError("AES-256 key must be 32 bytes")
    if len(iv) != 12:
        raise ValueError("GCM IV must be 12 bytes")
    if len(tag) != 16:
        raise ValueError("GCM tag must be 16 bytes")

    aesgcm = AESGCM(key)
    ct_with_tag = ciphertext + tag
    try:
        return aesgcm.decrypt(iv, ct_with_tag, aad)
    except Exception as e:
        raise EnvelopeEncryptionError(f"AEAD authentication tag verification failed (tampering detected): {e}") from e

def create_secure_document_package(
    document_bytes: bytes,
    document_id: str,
    filename: str,
    mime_type: str,
    sender_id: str,
    sender_signing_secret_key: bytes,
    recipient_public_keys: Dict[str, bytes],  # recipient_id -> ML-KEM public key bytes
    fingerprint_enabled: bool = True,
    metadata_extra: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Constructs an immutable multi-recipient .SDOC container.
    """
    # 1. Calculate original content SHA3-256 digest
    content_hash = hash_sha3_256_bytes(document_bytes)
    file_size = len(document_bytes)

    # 2. Generate random 256-bit symmetric Document Encryption Key (DEK)
    dek = get_secure_random_bytes(32)

    # 3. Create Manifest
    import datetime
    manifest = {
        "document_id": document_id,
        "filename": filename,
        "mime_type": mime_type,
        "file_size": file_size,
        "content_hash_sha3": content_hash,
        "sender_id": sender_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fingerprint_enabled": fingerprint_enabled,
        "recipient_count": len(recipient_public_keys),
        "extra": metadata_extra or {}
    }
    manifest_bytes = canonicalize(manifest)

    # 4. Encrypt document payload with AES-256-GCM using DEK, binding manifest as AAD
    ct, iv, tag = encrypt_payload_aes_gcm(document_bytes, dek, aad=manifest_bytes)
    ciphertext_hash = hash_sha3_256_bytes(ct)

    # 5. For each recipient, encapsulate DEK using ML-KEM-768
    recipient_wrappers: Dict[str, Dict[str, str]] = {}
    for recip_id, recip_kem_pk in recipient_public_keys.items():
        # ML-KEM encapsulation
        kem_ct, shared_secret = kem_engine.encapsulate(recip_kem_pk)
        
        # Derive recipient wrapping key using HKDF-SHA3-256
        wrap_key = derive_key_hkdf_sha3_256(
            secret=shared_secret,
            length=32,
            salt=document_id.encode('utf-8'),
            info=recip_id.encode('utf-8')
        )

        # Encrypt DEK with AES-256-GCM under wrap_key
        wrapped_dek_ct, dek_iv, dek_tag = encrypt_payload_aes_gcm(
            dek,
            wrap_key,
            aad=canonicalize({"doc": document_id, "recip": recip_id})
        )

        recipient_wrappers[recip_id] = {
            "kem_ciphertext": b64_encode(kem_ct),
            "wrapped_dek": b64_encode(wrapped_dek_ct),
            "iv": b64_encode(dek_iv),
            "tag": b64_encode(dek_tag),
            "kem_alg": CRYPTO_CONFIG.kem_algorithm
        }

    # 6. Sign container (Manifest + Recipient Wrappers Hash + Ciphertext Hash) with sender's ML-DSA-65 key
    signature_target = {
        "manifest": manifest,
        "ciphertext_hash": ciphertext_hash,
        "wrappers_root": canonical_hash_sha3_256(recipient_wrappers),
        "crypto_suite": {
            "kem": CRYPTO_CONFIG.kem_algorithm,
            "sig": CRYPTO_CONFIG.signature_algorithm,
            "aead": CRYPTO_CONFIG.aead_algorithm,
            "hash": CRYPTO_CONFIG.hash_algorithm
        }
    }
    sender_sig = sig_engine.sign(sender_signing_secret_key, canonicalize(signature_target))

    # 7. Assemble final SDOC container
    sdoc_container = {
        "magic": "SDOC-PQC-01",
        "version": CRYPTO_CONFIG.version,
        "crypto_suite": {
            "kem": CRYPTO_CONFIG.kem_algorithm,
            "sig": CRYPTO_CONFIG.signature_algorithm,
            "aead": CRYPTO_CONFIG.aead_algorithm,
            "hash": CRYPTO_CONFIG.hash_algorithm,
            "kdf": CRYPTO_CONFIG.kdf_algorithm
        },
        "manifest": manifest,
        "recipient_wrappers": recipient_wrappers,
        "payload": {
            "ciphertext": b64_encode(ct),
            "iv": b64_encode(iv),
            "tag": b64_encode(tag),
            "ciphertext_hash": ciphertext_hash
        },
        "sender_signature": {
            "sender_id": sender_id,
            "signature_alg": CRYPTO_CONFIG.signature_algorithm,
            "signature": b64_encode(sender_sig)
        }
    }

    return sdoc_container

def decrypt_secure_document_package(
    sdoc_container: Dict[str, Any],
    recipient_id: str,
    recipient_kem_secret_key: bytes,
    sender_verification_key: Optional[bytes] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Decapsulates DEK and decrypts document payload for the specified recipient.
    Validates sender signature and ciphertext integrity.
    """
    manifest = sdoc_container.get("manifest", {})
    document_id = manifest.get("document_id")
    recipient_wrappers = sdoc_container.get("recipient_wrappers", {})

    if recipient_id not in recipient_wrappers:
        raise EnvelopeEncryptionError(f"Recipient '{recipient_id}' is not authorized to decrypt this document.")

    # 1. Optionally verify sender signature
    if sender_verification_key:
        sender_sig_info = sdoc_container.get("sender_signature", {})
        sig_bytes = b64_decode(sender_sig_info.get("signature", ""))
        payload_info = sdoc_container.get("payload", {})
        
        sig_target = {
            "manifest": manifest,
            "ciphertext_hash": payload_info.get("ciphertext_hash"),
            "wrappers_root": canonical_hash_sha3_256(recipient_wrappers),
            "crypto_suite": {
                "kem": CRYPTO_CONFIG.kem_algorithm,
                "sig": CRYPTO_CONFIG.signature_algorithm,
                "aead": CRYPTO_CONFIG.aead_algorithm,
                "hash": CRYPTO_CONFIG.hash_algorithm
            }
        }
        valid_sender = sig_engine.verify(sender_verification_key, canonicalize(sig_target), sig_bytes)
        if not valid_sender:
            raise EnvelopeEncryptionError("Sender signature on SDOC package is INVALID (Tampering or impersonation detected)")

    # 2. Recover DEK via ML-KEM decapsulation
    wrapper = recipient_wrappers[recipient_id]
    kem_ct = b64_decode(wrapper["kem_ciphertext"])
    wrapped_dek = b64_decode(wrapper["wrapped_dek"])
    dek_iv = b64_decode(wrapper["iv"])
    dek_tag = b64_decode(wrapper["tag"])

    shared_secret = kem_engine.decapsulate(recipient_kem_secret_key, kem_ct)
    wrap_key = derive_key_hkdf_sha3_256(
        secret=shared_secret,
        length=32,
        salt=document_id.encode('utf-8'),
        info=recipient_id.encode('utf-8')
    )

    # Unwrap DEK
    dek = decrypt_payload_aes_gcm(
        wrapped_dek,
        wrap_key,
        dek_iv,
        dek_tag,
        aad=canonicalize({"doc": document_id, "recip": recipient_id})
    )

    # 3. Decrypt document payload
    payload = sdoc_container["payload"]
    ct = b64_decode(payload["ciphertext"])
    iv = b64_decode(payload["iv"])
    tag = b64_decode(payload["tag"])
    manifest_bytes = canonicalize(manifest)

    plaintext = decrypt_payload_aes_gcm(ct, dek, iv, tag, aad=manifest_bytes)

    # 4. Verify plaintext content hash
    computed_content_hash = hash_sha3_256_bytes(plaintext)
    if computed_content_hash != manifest["content_hash_sha3"]:
        raise EnvelopeEncryptionError("Decrypted document content hash does not match original manifest hash!")

    return plaintext, manifest
