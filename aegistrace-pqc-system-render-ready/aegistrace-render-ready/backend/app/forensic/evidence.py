"""
Forensic Evidence Dossier Generation & System ML-DSA Digital Attestation.
Exports verifiable forensic bundles with Merkle proofs and digital signatures.
"""

import json
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any

from app.config import FORENSIC_DIR, CRYPTO_CONFIG
from app.crypto.pqc import sig_engine, b64_encode
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256
from app.identity.pki import offline_pki

class EvidenceDossierGenerator:
    @staticmethod
    def generate_signed_evidence_package(
        analysis_result: Dict[str, Any],
        investigator_id: str = "investigator"
    ) -> Dict[str, Any]:
        evidence_id = f"EVD-{uuid.uuid4().hex[:12].upper()}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        dossier_body = {
            "evidence_id": evidence_id,
            "generated_at": now,
            "investigator_id": investigator_id,
            "system_version": CRYPTO_CONFIG.version,
            "crypto_suite": {
                "kem": CRYPTO_CONFIG.kem_algorithm,
                "sig": CRYPTO_CONFIG.signature_algorithm,
                "aead": CRYPTO_CONFIG.aead_algorithm,
                "hash": CRYPTO_CONFIG.hash_algorithm
            },
            "analysis_result": analysis_result
        }

        # System digitally signs the entire evidence dossier with Root Authority ML-DSA key
        signature = sig_engine.sign(offline_pki._secret_key, canonicalize(dossier_body))
        dossier_hash = canonical_hash_sha3_256(dossier_body)

        signed_package = {
            "dossier": dossier_body,
            "dossier_hash_sha3": dossier_hash,
            "system_attestation_signature": {
                "algorithm": CRYPTO_CONFIG.signature_algorithm,
                "signing_authority": offline_pki.ca_name,
                "authority_ca_id": offline_pki.ca_id,
                "signature": b64_encode(signature)
            }
        }

        # Save to export directory
        export_file = FORENSIC_DIR / f"{evidence_id}.json"
        with open(export_file, "w", encoding="utf-8") as f:
            json.dump(signed_package, f, indent=2)

        signed_package["export_file_path"] = str(export_file)
        return signed_package
