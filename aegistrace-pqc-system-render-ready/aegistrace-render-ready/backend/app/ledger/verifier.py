"""
Cryptographic Tamper-Evidence Verification & Chain Audit Scanner.
Verifies hash-chain continuity, Merkle proofs, and ML-DSA validator signatures.
"""

from typing import Dict, Any, List, Tuple
from app.ledger.chain import immutable_ledger
from app.ledger.block import Block, compute_block_hash
from app.ledger.merkle import MerkleTree, verify_merkle_proof
from app.ledger.consensus import consensus_engine
from app.crypto.pqc import sig_engine, b64_decode
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256
from app.identity.manager import identity_manager

class ChainVerifier:
    """
    Independent cryptographic auditor for the immutable permissioned ledger.
    """
    @staticmethod
    def verify_entire_chain() -> Dict[str, Any]:
        chain = immutable_ledger.chain
        report = {
            "total_blocks": len(chain),
            "is_valid": True,
            "tamper_detected": False,
            "errors": [],
            "block_audits": []
        }

        for i, block in enumerate(chain):
            block_audit = {
                "height": block.header.block_height,
                "block_hash": block.block_hash,
                "valid_hash": True,
                "valid_prev_hash": True,
                "valid_merkle_root": True,
                "valid_validator_signatures": True,
                "valid_transaction_signatures": True,
                "errors": []
            }

            # 1. Verify previous block hash link
            if i == 0:
                if block.header.previous_block_hash != "0" * 64:
                    block_audit["valid_prev_hash"] = False
                    block_audit["errors"].append("Genesis previous block hash mismatch.")
            else:
                prev_block = chain[i - 1]
                if block.header.previous_block_hash != prev_block.block_hash:
                    block_audit["valid_prev_hash"] = False
                    block_audit["errors"].append(
                        f"Hash-chain broken: Previous block hash '{block.header.previous_block_hash}' != actual prev hash '{prev_block.block_hash}'"
                    )

            # 2. Verify Block Hash computation
            expected_hash = compute_block_hash(block.header)
            if block.block_hash != expected_hash:
                block_audit["valid_hash"] = False
                block_audit["errors"].append(
                    f"Block hash altered: Header claims '{block.block_hash}' but calculated hash is '{expected_hash}'"
                )

            # 3. Verify Merkle Root calculation
            tx_hashes = [canonical_hash_sha3_256(tx) for tx in block.transactions]
            tree = MerkleTree(tx_hashes)
            if block.header.merkle_root != tree.root:
                block_audit["valid_merkle_root"] = False
                block_audit["errors"].append(
                    f"Merkle root mismatch: Claimed '{block.header.merkle_root}', calculated '{tree.root}'"
                )

            # 4. Verify Validator ML-DSA Signatures
            header_bytes = canonicalize(block.header.model_dump())
            val_sigs = block.validator_signatures
            valid_val_sigs = 0
            for vs in val_sigs:
                val_id = vs["validator_id"]
                val_node = consensus_engine.validators.get(val_id)
                pub_key = None
                if val_node:
                    pub_key = val_node.public_key
                elif "public_key" in vs:
                    pub_key = b64_decode(vs["public_key"])

                if pub_key:
                    sig_bytes = b64_decode(vs["signature"])
                    if sig_engine.verify(pub_key, header_bytes, sig_bytes):
                        valid_val_sigs += 1

            if valid_val_sigs < block.header.validator_threshold:
                block_audit["valid_validator_signatures"] = False
                block_audit["errors"].append(
                    f"Insufficient valid validator signatures ({valid_val_sigs}/{block.header.validator_threshold})"
                )

            # 5. Verify Transaction User Signatures
            for tx in block.transactions:
                payload = tx.get("payload", {})
                if "signature_info" in payload and "record" in payload:
                    signer_id = payload["signature_info"].get("signer_id")
                    user_info = identity_manager.get_public_user_info(signer_id)
                    if user_info:
                        dsa_pk_b64 = user_info["certificate"]["subject"]["public_keys"]["dsa_public_key"]
                        dsa_pk = b64_decode(dsa_pk_b64)
                        sig_bytes = b64_decode(payload["signature_info"]["signature"])
                        rec_bytes = canonicalize(payload["record"])
                        if not sig_engine.verify(dsa_pk, rec_bytes, sig_bytes):
                            block_audit["valid_transaction_signatures"] = False
                            block_audit["errors"].append(f"Invalid ML-DSA signature on transaction by user '{signer_id}'")

            if block_audit["errors"]:
                report["is_valid"] = False
                report["tamper_detected"] = True
                report["errors"].extend(block_audit["errors"])

            report["block_audits"].append(block_audit)

        return report

    @staticmethod
    def simulate_tamper_attack(block_height: int, target_field: str = "transactions") -> Dict[str, Any]:
        """
        Simulates an unauthorized database/ledger tamper attack on an old block
        to demonstrate instant cryptographic detection, then restores original state.
        """
        chain = immutable_ledger.chain
        if block_height < 0 or block_height >= len(chain):
            return {"success": False, "error": "Invalid block height"}

        target_block = chain[block_height]
        orig_hash = target_block.block_hash
        orig_prev = target_block.header.previous_block_hash
        orig_txs = [dict(t) for t in target_block.transactions] if target_block.transactions else []
        
        try:
            # Tamper transaction content
            if target_field == "transactions" and target_block.transactions:
                target_block.transactions[0]["payload"]["tampered"] = True
                if "record" in target_block.transactions[0]["payload"]:
                    target_block.transactions[0]["payload"]["record"]["recipient_id"] = "mallory_attacker"
            elif target_field == "block_hash":
                target_block.block_hash = "deadbeef" * 8
            elif target_field == "prev_hash":
                target_block.header.previous_block_hash = "badhash" * 8

            # Run verification under tampered conditions
            audit_result = ChainVerifier.verify_entire_chain()
            return {
                "simulation": "Tamper Injected into Block #" + str(block_height),
                "tamper_detected": audit_result["tamper_detected"],
                "verification_status": "FAILED" if audit_result["tamper_detected"] else "PASSED",
                "errors": audit_result["errors"]
            }
        finally:
            # Restore original block state
            target_block.block_hash = orig_hash
            target_block.header.previous_block_hash = orig_prev
            if orig_txs:
                target_block.transactions = orig_txs
