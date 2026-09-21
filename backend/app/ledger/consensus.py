"""
Permissioned Byzantine Fault Tolerant / Proof-of-Authority Multi-Validator Consensus Engine.
Simulates 5 independent institutional validator nodes using ML-DSA-65 multi-signatures.
Guarantees distinct cryptographic keypairs and local protected key storage (0600 permissions).
"""

import os
import stat
import json
import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

from app.config import DATA_DIR, KEYSTORE_DIR, DEFAULT_VALIDATOR_NODES, CONSENSUS_THRESHOLD_NUM, CRYPTO_CONFIG
from app.crypto.pqc import sig_engine, b64_encode, b64_decode
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256
from app.ledger.block import BlockHeader, Block, compute_block_hash
from app.ledger.merkle import MerkleTree

VALIDATORS_KEY_STORAGE = KEYSTORE_DIR / "validator_keys.json"

class ValidatorNode:
    def __init__(self, node_id: str, name: str, role: str, vk: bytes, sk: bytes, status: str = "ONLINE"):
        self.node_id = node_id
        self.name = name
        self.role = role
        self.public_key = vk
        self._secret_key = sk
        self.status = status

    def validate_and_sign_block(self, header: BlockHeader, transactions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Validates block candidate and produces ML-DSA-65 validator signature.
        """
        if self.status != "ONLINE":
            return None

        # 1. Verify Merkle root matches transactions
        tx_hashes = [canonical_hash_sha3_256(tx) for tx in transactions]
        tree = MerkleTree(tx_hashes)
        if tree.root != header.merkle_root:
            raise ValueError(f"Validator {self.node_id}: Merkle root mismatch!")

        # 2. Sign canonical header hash
        header_bytes = canonicalize(header.model_dump())
        signature = sig_engine.sign(self._secret_key, header_bytes)

        return {
            "validator_id": self.node_id,
            "validator_name": self.name,
            "algorithm": CRYPTO_CONFIG.signature_algorithm,
            "signature": b64_encode(signature),
            "public_key": b64_encode(self.public_key),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

class ConsensusEngine:
    def __init__(self):
        self.validators: Dict[str, ValidatorNode] = {}
        self._init_or_load_validators()

    def _init_or_load_validators(self):
        KEYSTORE_DIR.mkdir(parents=True, exist_ok=True)
        if VALIDATORS_KEY_STORAGE.exists():
            with open(VALIDATORS_KEY_STORAGE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    node = ValidatorNode(
                        node_id=item["node_id"],
                        name=item["name"],
                        role=item["role"],
                        vk=b64_decode(item["public_key"]),
                        sk=b64_decode(item["secret_key"]),
                        status=item.get("status", "ONLINE")
                    )
                    self.validators[node.node_id] = node
        else:
            saved_list = []
            seen_public_keys = set()
            for item in DEFAULT_VALIDATOR_NODES:
                vk, sk = sig_engine.generate_keypair()
                assert vk not in seen_public_keys, "Validator keypair collision detected!"
                seen_public_keys.add(vk)

                node = ValidatorNode(
                    node_id=item["node_id"],
                    name=item["name"],
                    role=item["role"],
                    vk=vk,
                    sk=sk,
                    status=item["status"]
                )
                self.validators[node.node_id] = node
                saved_list.append({
                    "node_id": node.node_id,
                    "name": node.name,
                    "role": node.role,
                    "public_key": b64_encode(node.public_key),
                    "secret_key": b64_encode(node._secret_key),
                    "status": node.status
                })

            flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
            mode = stat.S_IRUSR | stat.S_IWUSR  # 0600
            fd = os.open(str(VALIDATORS_KEY_STORAGE), flags, mode)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(saved_list, f, indent=2)

        # Validate that all 5 validator public keys and private keys are pairwise distinct
        pks = [v.public_key for v in self.validators.values()]
        sks = [v._secret_key for v in self.validators.values()]
        assert len(set(pks)) == len(self.validators), "Validator public keys must be distinct"
        assert len(set(sks)) == len(self.validators), "Validator private keys must be distinct"

    def get_validator_status_list(self) -> List[Dict[str, Any]]:
        return [
            {
                "node_id": v.node_id,
                "name": v.name,
                "role": v.role,
                "status": v.status,
                "public_key_b64": b64_encode(v.public_key)[:24] + "..."
            }
            for v in self.validators.values()
        ]

    def reach_consensus_and_seal_block(
        self,
        block_height: int,
        previous_block_hash: str,
        transactions: List[Dict[str, Any]]
    ) -> Block:
        """
        Proposes a new block, queries validator nodes for signatures, and ensures quorum threshold >= 3/5.
        """
        # 1. Compute Merkle root of transaction canonical hashes
        tx_hashes = [canonical_hash_sha3_256(tx) for tx in transactions]
        merkle_tree = MerkleTree(tx_hashes)
        merkle_root = merkle_tree.root

        header = BlockHeader(
            block_height=block_height,
            previous_block_hash=previous_block_hash,
            merkle_root=merkle_root,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            validator_threshold=CONSENSUS_THRESHOLD_NUM,
            total_validators=len(self.validators),
            consensus_algorithm="BFT-PoA-ML-DSA-65"
        )

        block_hash = compute_block_hash(header)

        # 2. Collect signatures from online validators
        signatures = []
        for val in self.validators.values():
            if val.status == "ONLINE":
                sig_record = val.validate_and_sign_block(header, transactions)
                if sig_record:
                    signatures.append(sig_record)

        if len(signatures) < CONSENSUS_THRESHOLD_NUM:
            raise RuntimeError(
                f"Consensus Quorum Failure: Only {len(signatures)}/{CONSENSUS_THRESHOLD_NUM} validator signatures collected."
            )

        return Block(
            header=header,
            block_hash=block_hash,
            transactions=transactions,
            validator_signatures=signatures
        )

# Global consensus engine
consensus_engine = ConsensusEngine()
