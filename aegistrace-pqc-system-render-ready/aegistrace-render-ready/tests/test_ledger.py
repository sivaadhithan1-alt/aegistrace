"""
Tests for Immutable Permissioned Ledger, Merkle Trees, and Tamper-Evidence.
"""

from app.ledger.chain import immutable_ledger
from app.ledger.merkle import MerkleTree, verify_merkle_proof
from app.ledger.verifier import ChainVerifier
from app.fingerprint.record import create_canonical_decryption_record, sign_decryption_record
from app.identity.manager import identity_manager

def test_merkle_tree_proof_generation_and_verification():
    leaves = [f"leaf_hash_{i}" for i in range(8)]
    tree = MerkleTree(leaves)
    root = tree.root
    assert len(root) == 64

    for idx in range(len(leaves)):
        proof = tree.get_proof(idx)
        valid = verify_merkle_proof(leaves[idx], proof, root)
        assert valid is True

    # Bad leaf verification must fail
    assert verify_merkle_proof("fake_leaf", tree.get_proof(0), root) is False

def test_ledger_add_transaction_and_chain_verification():
    _, bob_dsa_sk = identity_manager.get_user_keys_with_passphrase("bob", "bob123")
    
    rec = create_canonical_decryption_record(
        event_id="EVT-TEST-001",
        document_id="DOC-TEST",
        document_hash="doc_hash_123",
        recipient_id="bob",
        session_id="SESS-001",
        fingerprint_id="FP-TEST-999",
        timestamp="2026-09-21T12:00:00Z",
        forensic_copy_hash="forensic_hash_123"
    )
    signed_tx = sign_decryption_record(rec, bob_dsa_sk)

    block, tx_idx, tx_hash = immutable_ledger.add_transaction_and_mine_block(signed_tx)
    assert block.header.block_height >= 1
    assert len(block.validator_signatures) >= 3

    # Verify entire chain integrity
    audit = ChainVerifier.verify_entire_chain()
    assert audit["is_valid"] is True
    assert audit["tamper_detected"] is False

def test_ledger_tamper_detection():
    # Inject tamper simulation
    res = ChainVerifier.simulate_tamper_attack(block_height=0, target_field="block_hash")
    assert res["tamper_detected"] is True
    assert res["verification_status"] == "FAILED"
