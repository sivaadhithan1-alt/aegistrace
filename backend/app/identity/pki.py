"""
Offline Institutional Public Key Infrastructure (PKI) & Trust Authority.
Signs user identity certificates with Root ML-DSA-65 Authority key and enforces revocation.
"""

import json
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

from app.config import DATA_DIR, CRYPTO_CONFIG
from app.crypto.pqc import sig_engine, b64_encode, b64_decode
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

CA_STORAGE_PATH = DATA_DIR / "offline_root_ca.json"
CRL_STORAGE_PATH = DATA_DIR / "revocation_list.json"

class OfflinePKI:
    """
    Offline Certificate Authority for Institutional Air-Gapped Trust Anchor.
    """
    def __init__(self):
        self._init_or_load_ca()
        self._init_or_load_crl()

    def _init_or_load_ca(self):
        if CA_STORAGE_PATH.exists():
            with open(CA_STORAGE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.ca_id = data["ca_id"]
                self.ca_name = data["ca_name"]
                self.public_key = b64_decode(data["public_key"])
                self._secret_key = b64_decode(data["secret_key"])
                self.created_at = data["created_at"]
        else:
            vk, sk = sig_engine.generate_keypair()
            self.ca_id = "AEGIS-ROOT-CA-01"
            self.ca_name = "Defense Enclave Institutional Root Trust Authority"
            self.public_key = vk
            self._secret_key = sk
            self.created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

            ca_data = {
                "ca_id": self.ca_id,
                "ca_name": self.ca_name,
                "public_key": b64_encode(self.public_key),
                "secret_key": b64_encode(self._secret_key),
                "created_at": self.created_at,
                "algorithm": CRYPTO_CONFIG.signature_algorithm
            }
            with open(CA_STORAGE_PATH, "w", encoding="utf-8") as f:
                json.dump(ca_data, f, indent=2)

    def _init_or_load_crl(self):
        if CRL_STORAGE_PATH.exists():
            with open(CRL_STORAGE_PATH, "r", encoding="utf-8") as f:
                self.revocations: List[Dict[str, Any]] = json.load(f)
        else:
            self.revocations = []
            self._save_crl()

    def _save_crl(self):
        with open(CRL_STORAGE_PATH, "w", encoding="utf-8") as f:
            json.dump(self.revocations, f, indent=2)

    def issue_identity_certificate(
        self,
        user_id: str,
        display_name: str,
        role: str,
        kem_public_key: bytes,
        dsa_public_key: bytes,
        validity_days: int = 365
    ) -> Dict[str, Any]:
        """
        Issues an institutional post-quantum identity certificate signed by Root CA.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = now + datetime.timedelta(days=validity_days)

        cert_subject = {
            "certificate_id": f"CERT-{user_id.upper()}-{now.strftime('%Y%m%d%H%M%S')}",
            "issuer_ca_id": self.ca_id,
            "issuer_name": self.ca_name,
            "user_id": user_id,
            "display_name": display_name,
            "role": role,
            "issued_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "public_keys": {
                "kem_algorithm": CRYPTO_CONFIG.kem_algorithm,
                "kem_public_key": b64_encode(kem_public_key),
                "signature_algorithm": CRYPTO_CONFIG.signature_algorithm,
                "dsa_public_key": b64_encode(dsa_public_key)
            }
        }

        # Sign certificate subject with Root CA ML-DSA-65 secret key
        cert_hash = canonical_hash_sha3_256(cert_subject)
        signature = sig_engine.sign(self._secret_key, canonicalize(cert_subject))

        certificate = {
            "version": "1.0-PQC",
            "subject": cert_subject,
            "thumbprint_sha3": cert_hash,
            "ca_signature": {
                "algorithm": CRYPTO_CONFIG.signature_algorithm,
                "signature": b64_encode(signature)
            }
        }
        return certificate

    def verify_certificate(self, certificate: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates certificate signature, expiration, and checks against CRL.
        """
        subject = certificate.get("subject", {})
        user_id = subject.get("user_id")

        # 1. Check CRL
        for item in self.revocations:
            if item["user_id"] == user_id or item.get("certificate_id") == subject.get("certificate_id"):
                return False, f"Certificate is REVOKED: {item.get('reason', 'Security revocation')}"

        # 2. Check expiration
        expires_at_str = subject.get("expires_at")
        if expires_at_str:
            expires_at = datetime.datetime.fromisoformat(expires_at_str)
            if datetime.datetime.now(datetime.timezone.utc) > expires_at:
                return False, "Certificate has EXPIRED"

        # 3. Verify Root CA ML-DSA signature
        ca_sig_info = certificate.get("ca_signature", {})
        sig_bytes = b64_decode(ca_sig_info.get("signature", ""))
        valid = sig_engine.verify(self.public_key, canonicalize(subject), sig_bytes)
        if not valid:
            return False, "Certificate signature is INVALID (untrusted CA or forged)"

        return True, "Certificate is VALID and trusted by Offline Root CA"

    def revoke_identity(self, user_id: str, reason: str, revoked_by: str):
        """
        Adds identity to revocation list.
        """
        revocation_entry = {
            "user_id": user_id,
            "revocation_id": f"REV-{user_id}-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "reason": reason,
            "revoked_by": revoked_by,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        self.revocations.append(revocation_entry)
        self._save_crl()

    def get_crl(self) -> List[Dict[str, Any]]:
        return list(self.revocations)

# Global offline PKI instance
offline_pki = OfflinePKI()
