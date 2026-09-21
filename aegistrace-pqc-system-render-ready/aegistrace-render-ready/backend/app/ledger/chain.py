"""
Immutable Permissioned Ledger Chain Manager & State Machine.
Maintains hash-linked blocks, transaction index, and Merkle proofs.
"""

import os
import json
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from app.config import LEDGER_STORAGE_PATH, CRYPTO_CONFIG
from app.ledger.block import Block, BlockHeader, compute_block_hash
from app.ledger.consensus import consensus_engine
from app.ledger.merkle import MerkleTree, verify_merkle_proof
from app.crypto.canonical import canonical_hash_sha3_256

class ImmutableLedger:
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict[str, Any]] = []
        self._init_or_load_chain()

    def _init_or_load_chain(self):
        if LEDGER_STORAGE_PATH.exists():
            with open(LEDGER_STORAGE_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                self.chain = [Block(**item) for item in raw_data]
        else:
            self._create_genesis_block()

    def _create_genesis_block(self):
        genesis_tx = [{
            "type": "GENESIS_INITIALIZATION",
            "message": "Institutional Air-Gapped Tamper-Evident Ledger Initialized",
            "crypto_suite": {
                "kem": CRYPTO_CONFIG.kem_algorithm,
                "sig": CRYPTO_CONFIG.signature_algorithm,
                "aead": CRYPTO_CONFIG.aead_algorithm,
                "hash": CRYPTO_CONFIG.hash_algorithm
            },
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }]

        genesis_block = consensus_engine.reach_consensus_and_seal_block(
            block_height=0,
            previous_block_hash="0" * 64,
            transactions=genesis_tx
        )
        self.chain.append(genesis_block)
        self._save_chain()

    def _save_chain(self):
        with open(LEDGER_STORAGE_PATH, "w", encoding="utf-8") as f:
            data = [b.model_dump() for b in self.chain]
            json.dump(data, f, indent=2)

    @property
    def latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction_and_mine_block(self, transaction: Dict[str, Any]) -> Tuple[Block, int, str]:
        """
        Commits a new signed provenance transaction immediately into a new ledger block.
        Returns (committed_block, tx_index, tx_hash).
        """
        tx_hash = canonical_hash_sha3_256(transaction)
        tx_wrapper = {
            "tx_id": f"TX-{tx_hash[:16].upper()}",
            "tx_hash": tx_hash,
            "recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "payload": transaction
        }

        new_height = len(self.chain)
        prev_hash = self.latest_block.block_hash

        new_block = consensus_engine.reach_consensus_and_seal_block(
            block_height=new_height,
            previous_block_hash=prev_hash,
            transactions=[tx_wrapper]
        )

        self.chain.append(new_block)
        self._save_chain()

        return new_block, 0, tx_hash

    def find_decryption_event_by_fingerprint_id(self, fingerprint_id: str) -> Optional[Dict[str, Any]]:
        """
        Searches all blocks on the chain to find the decryption transaction matching fingerprint_id.
        Returns matching record with block metadata and Merkle proof.
        """
        for block in reversed(self.chain):
            tx_hashes = [canonical_hash_sha3_256(tx) for tx in block.transactions]
            tree = MerkleTree(tx_hashes)

            for idx, tx in enumerate(block.transactions):
                payload = tx.get("payload", {})
                rec = payload.get("record", {})
                if rec.get("fingerprint_id") == fingerprint_id:
                    proof = tree.get_proof(idx)
                    leaf_hash = tx_hashes[idx]
                    return {
                        "block_height": block.header.block_height,
                        "block_hash": block.block_hash,
                        "previous_block_hash": block.header.previous_block_hash,
                        "merkle_root": block.header.merkle_root,
                        "block_timestamp": block.header.timestamp,
                        "validator_signatures": block.validator_signatures,
                        "tx_id": tx.get("tx_id"),
                        "tx_hash": tx.get("tx_hash"),
                        "leaf_hash": leaf_hash,
                        "tx_index": idx,
                        "merkle_proof": proof,
                        "transaction": payload
                    }
        return None

    def get_chain_blocks(self) -> List[Dict[str, Any]]:
        return [b.model_dump() for b in self.chain]

# Global ledger instance
immutable_ledger = ImmutableLedger()
