"""
Tests for 5-Validator Byzantine Fault Tolerant Consensus & Distinct Identity Verification.
"""

from app.ledger.consensus import consensus_engine
from app.ledger.merkle import MerkleTree
from app.ledger.block import BlockHeader, compute_block_hash
from app.crypto.canonical import canonicalize, canonical_hash_sha3_256

def test_five_validators_distinct_keys():
    validators = consensus_engine.validators
    assert len(validators) == 5
    
    # Assert all public and secret keys are distinct
    public_keys = [v.public_key for v in validators.values()]
    secret_keys = [v._secret_key for v in validators.values()]
    
    assert len(set(public_keys)) == 5
    assert len(set(secret_keys)) == 5

def test_consensus_quorum_sealing():
    txs = [{"test_tx": "data_001"}, {"test_tx": "data_002"}]
    block = consensus_engine.reach_consensus_and_seal_block(
        block_height=99,
        previous_block_hash="a" * 64,
        transactions=txs
    )
    
    assert block.header.block_height == 99
    assert len(block.validator_signatures) >= 3
    assert len(block.transactions) == 2
