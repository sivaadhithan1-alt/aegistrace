"""
Merkle Tree Implementation with Audit Proof Generation and Verification.
Uses SHA3-256 cryptographic hashing on canonical transaction leaves.
"""

import hashlib
from typing import List, Dict, Any, Optional, Tuple
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

def hash_pair(left: str, right: str) -> str:
    """Computes SHA3-256 of combined child hashes."""
    combined = (left + right).encode('utf-8')
    return hashlib.sha3_256(combined).hexdigest()

class MerkleTree:
    """
    Binary Merkle Tree for transaction immutability and inclusion proofs.
    """
    def __init__(self, leaves: List[str]):
        if not leaves:
            self.leaves = [hashlib.sha3_256(b"EMPTY_MERKLE_TREE").hexdigest()]
        else:
            self.leaves = list(leaves)
        self.levels: List[List[str]] = []
        self._build_tree()

    def _build_tree(self):
        current_level = list(self.leaves)
        self.levels.append(current_level)

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                if i + 1 < len(current_level):
                    right = current_level[i + 1]
                else:
                    right = left  # Duplicate odd leaf
                parent = hash_pair(left, right)
                next_level.append(parent)
            current_level = next_level
            self.levels.append(current_level)

    @property
    def root(self) -> str:
        return self.levels[-1][0]

    def get_proof(self, leaf_index: int) -> List[Dict[str, str]]:
        """
        Generates Merkle audit path for the leaf at leaf_index.
        Returns list of {'position': 'left'|'right', 'hash': str}.
        """
        if leaf_index < 0 or leaf_index >= len(self.leaves):
            raise IndexError("Leaf index out of bounds")

        proof = []
        idx = leaf_index
        for level in self.levels[:-1]:
            is_right_child = (idx % 2 == 1)
            sibling_idx = idx - 1 if is_right_child else idx + 1
            if sibling_idx >= len(level):
                sibling_idx = idx  # Duplicate odd leaf

            proof.append({
                "position": "left" if is_right_child else "right",
                "hash": level[sibling_idx]
            })
            idx = idx // 2
        return proof

def verify_merkle_proof(leaf_hash: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
    """
    Verifies that leaf_hash belongs to the Merkle tree with expected_root given the proof path.
    """
    current_hash = leaf_hash
    for step in proof:
        sibling = step["hash"]
        position = step["position"]
        if position == "left":
            current_hash = hash_pair(sibling, current_hash)
        else:
            current_hash = hash_pair(current_hash, sibling)
    return current_hash.lower() == expected_root.lower()
