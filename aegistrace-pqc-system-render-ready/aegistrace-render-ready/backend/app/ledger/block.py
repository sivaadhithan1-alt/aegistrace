"""
Immutable Ledger Block Data Structures and Canonical Header Hashing.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

class BlockHeader(BaseModel):
    block_height: int
    previous_block_hash: str
    merkle_root: str
    timestamp: str
    validator_threshold: int
    total_validators: int
    consensus_algorithm: str = "BFT-PoA-ML-DSA"

class Block(BaseModel):
    header: BlockHeader
    block_hash: str
    transactions: List[Dict[str, Any]]
    validator_signatures: List[Dict[str, Any]]

def compute_block_hash(header: BlockHeader) -> str:
    """
    Computes deterministic SHA3-256 hash of the canonicalized BlockHeader.
    """
    return canonical_hash_sha3_256(header.model_dump())
