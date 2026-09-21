"""
Immutable Permissioned Ledger & Consensus Explorer API Router.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ledger.chain import immutable_ledger
from app.ledger.consensus import consensus_engine
from app.ledger.verifier import ChainVerifier
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/api/ledger", tags=["Ledger"])

class TamperSimulationRequest(BaseModel):
    block_height: int = 1
    target_field: str = "transactions"  # "transactions", "block_hash", "prev_hash"

@router.get("/blocks")
def get_blocks():
    return {
        "chain_length": len(immutable_ledger.chain),
        "latest_height": immutable_ledger.latest_block.header.block_height,
        "blocks": immutable_ledger.get_chain_blocks()
    }

@router.get("/validators")
def get_validators():
    return {
        "consensus_algorithm": "BFT-PoA-ML-DSA-65",
        "threshold": f"3/5 Quorum (60%)",
        "validators": consensus_engine.get_validator_status_list()
    }

@router.post("/verify-chain")
def verify_ledger_chain():
    audit_report = ChainVerifier.verify_entire_chain()
    log_audit_event("LEDGER_CHAIN_AUDIT_VERIFIED", "system", details={"is_valid": audit_report["is_valid"]})
    return {"status": "success", "audit": audit_report}

@router.post("/simulate-tamper")
def simulate_tamper(req: TamperSimulationRequest):
    result = ChainVerifier.simulate_tamper_attack(req.block_height, req.target_field)
    log_audit_event("TAMPER_SIMULATION_EXECUTED", "admin", details=result)
    return {"status": "success", "tamper_simulation": result}
