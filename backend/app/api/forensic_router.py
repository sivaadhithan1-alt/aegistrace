"""
Forensic Investigation & Leaked Document Analysis API Router.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from pydantic import BaseModel

from app.forensic.analyzer import ForensicAnalyzer
from app.forensic.evidence import EvidenceDossierGenerator
from app.forensic.robustness import RobustnessTester
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/api/forensics", tags=["Forensics"])

class ExportEvidenceRequest(BaseModel):
    analysis_result: dict

@router.post("/analyze")
async def analyze_leaked_document(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header("investigator", alias="X-User-Id")
):
    try:
        content_bytes = await file.read()
        filename = file.filename or "unknown_suspect_document.bin"
        mime_type = file.content_type or "application/octet-stream"

        analysis = ForensicAnalyzer.analyze_document(
            file_bytes=content_bytes,
            filename=filename,
            mime_type=mime_type
        )

        log_audit_event(
            "FORENSIC_ANALYSIS_EXECUTED",
            x_user_id,
            details={
                "filename": filename,
                "status": analysis["forensic_status"],
                "confidence": analysis["confidence_level"]
            }
        )

        return {"status": "success", "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {e}")

@router.post("/export-evidence")
def export_evidence_dossier(
    req: ExportEvidenceRequest,
    x_user_id: Optional[str] = Header("investigator", alias="X-User-Id")
):
    try:
        signed_pkg = EvidenceDossierGenerator.generate_signed_evidence_package(
            analysis_result=req.analysis_result,
            investigator_id=x_user_id
        )
        log_audit_event("EVIDENCE_DOSSIER_EXPORTED", x_user_id, details={"evidence_id": signed_pkg["dossier"]["evidence_id"]})
        return {"status": "success", "evidence_package": signed_pkg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate evidence package: {e}")

@router.post("/test-robustness")
async def test_robustness(
    file: UploadFile = File(...)
):
    try:
        content_bytes = await file.read()
        filename = file.filename or "sample_document.bin"
        result = RobustnessTester.test_document_resilience(content_bytes, filename)
        return {"status": "success", "robustness_report": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Robustness test failed: {e}")
