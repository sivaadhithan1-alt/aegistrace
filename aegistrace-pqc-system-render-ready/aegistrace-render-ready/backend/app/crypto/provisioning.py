"""
Local Protected Keystore & Institutional Secret Provisioning Engine.
Ensures zero hardcoded secrets in source code, with automated secure local provisioning (0600 permissions).
"""

import os
import stat
import secrets
from pathlib import Path
from typing import Tuple

from app.config import KEYSTORE_DIR
from app.crypto.kdf import derive_key_hkdf_sha3_256

INSTITUTIONAL_SECRET_FILE = KEYSTORE_DIR / ".institutional_secret"

def get_or_provision_institutional_secret() -> bytes:
    """
    Retrieves or provisions the institutional master secret.
    Priority:
    1. Environment variable: AEGISTRACE_INSTITUTIONAL_SECRET
    2. Local protected keystore file: data/keystores/.institutional_secret (mode 0600)
    3. Auto-provision fresh 256-bit cryptographically secure entropy on first run.
    """
    env_secret = os.environ.get("AEGISTRACE_INSTITUTIONAL_SECRET")
    if env_secret:
        return env_secret.encode('utf-8')

    if INSTITUTIONAL_SECRET_FILE.exists():
        try:
            with open(INSTITUTIONAL_SECRET_FILE, "rb") as f:
                secret = f.read().strip()
                if len(secret) >= 32:
                    return secret
        except Exception:
            pass

    # Provision new 256-bit institutional secret
    new_secret = secrets.token_bytes(32)
    KEYSTORE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Write with restricted file permissions (owner read/write only: 0600)
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
    mode = stat.S_IRUSR | stat.S_IWUSR  # 0600
    fd = os.open(str(INSTITUTIONAL_SECRET_FILE), flags, mode)
    with os.fdopen(fd, "wb") as f:
        f.write(new_secret)

    try:
        os.chmod(INSTITUTIONAL_SECRET_FILE, 0o600)
    except Exception:
        pass

    return new_secret

def get_watermark_protection_key() -> bytes:
    """
    Derives the 256-bit AES-GCM key used for authenticating and encrypting forensic watermark payloads.
    """
    master_secret = get_or_provision_institutional_secret()
    return derive_key_hkdf_sha3_256(
        secret=master_secret,
        length=32,
        salt=b"aegis-watermark-protection-salt-v2",
        info=b"aegis-watermark-authenticated-encryption-key"
    )

def get_fingerprint_derivation_salt() -> bytes:
    """
    Derives the salt used in HMAC/KDF generation of unique forensic fingerprint IDs.
    """
    master_secret = get_or_provision_institutional_secret()
    return derive_key_hkdf_sha3_256(
        secret=master_secret,
        length=32,
        salt=b"aegis-fingerprint-derivation-salt-v2",
        info=b"aegis-fingerprint-unique-id-salt"
    )
