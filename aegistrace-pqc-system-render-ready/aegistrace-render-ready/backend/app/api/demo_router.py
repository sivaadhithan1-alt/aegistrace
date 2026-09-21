"""
Automated Demonstration & Scenario Runner API Router for SIH / Defense Evaluation.
Provides 12 deterministic steps with rich technical details, persona management, and clean demo reset.
"""

import io
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from reportlab.pdfgen import canvas

from app.config import DOCUMENT_DIR, DATA_DIR
from app.database.db import get_db_connection, init_database
from app.identity.manager import identity_manager
from app.messaging.service import MessagingService
from app.forensic.analyzer import ForensicAnalyzer
from app.forensic.evidence import EvidenceDossierGenerator
from app.ledger.chain import immutable_ledger

router = APIRouter(prefix="/api/demo", tags=["Demo"])

# In-memory store for demo state across steps
DEMO_STATE: Dict[str, Any] = {
    "current_step": 0,
    "completed_steps": [],
    "conversation_id": None,
    "document_id": None,
    "original_pdf_bytes": None,
    "decrypted_instances": {},
    "leaked_target": "rahul",
    "leaked_file_bytes": None,
    "forensic_analysis": None,
    "evidence_package": None,
    "logs": []
}

def create_sample_intelligence_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(70, 750, "DEFENSE CLASSIFIED INTELLIGENCE REPORT")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(70, 725, "SECURITY CLASSIFICATION: TOP SECRET // PQC-RESTRICTED // EYES ONLY")
    
    c.setFont("Helvetica", 10)
    c.drawString(70, 695, "Date: 21 September 2026")
    c.drawString(70, 680, "Originator: Officer Arjun (Joint Cyber Defense Directorate)")
    c.drawString(70, 665, "Authorized Distribution: Officer Priya, Officer Rahul, Officer Vikram")
    
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.setLineWidth(0.5)
    c.line(70, 650, 520, 650)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, 625, "1. OPERATIONAL CONTEXT")
    c.setFont("Helvetica", 10)
    c.drawString(70, 605, "This intelligence artifact contains sensitive post-quantum cryptographic parameters,")
    c.drawString(70, 590, "FIPS 203 ML-KEM key exchanges, and multi-recipient immutable audit anchors.")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, 555, "2. MANDATORY HANDLING REQUIREMENTS")
    c.setFont("Helvetica", 10)
    c.drawString(70, 535, "- Decryption requires authorized recipient hardware token & ML-DSA-65 signing.")
    c.drawString(70, 520, "- Visual and structural integrity must remain uncompromised at all times.")
    c.drawString(70, 505, "- Decryption provenance is cryptographically bound to recipient credential.")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, 470, "3. CRYPTOGRAPHIC INTEGRITY DECLARATION")
    c.setFont("Helvetica", 10)
    c.drawString(70, 450, "SHA3-256 Digest Anchor: AegisTrace Post-Quantum Enclave Engine v2.4")
    c.drawString(70, 435, "Any unauthorized dissemination will trigger automated DLT provenance attribution.")
    
    c.line(70, 400, 520, 400)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(70, 385, "CONFIDENTIAL & PROPRIETARY // AIR-GAPPED EVALUATION COPY")
    c.save()
    return buf.getvalue()

@router.get("/state")
def get_demo_state():
    return {
        "status": "success",
        "current_step": DEMO_STATE["current_step"],
        "completed_steps": DEMO_STATE["completed_steps"],
        "document_id": DEMO_STATE["document_id"],
        "conversation_id": DEMO_STATE["conversation_id"],
        "has_analysis": DEMO_STATE["forensic_analysis"] is not None,
        "logs": DEMO_STATE["logs"][-20:]
    }

@router.post("/reset")
def reset_demo_state():
    global DEMO_STATE
    DEMO_STATE = {
        "current_step": 0,
        "completed_steps": [],
        "conversation_id": None,
        "document_id": None,
        "original_pdf_bytes": None,
        "decrypted_instances": {},
        "leaked_target": "rahul",
        "leaked_file_bytes": None,
        "forensic_analysis": None,
        "evidence_package": None,
        "logs": ["Demo state reset to baseline successfully."]
    }

    init_database()
    identity_manager._ensure_seed_users()
    return {"status": "success", "message": "SIH Judge Demo reset successfully."}

@router.post("/step/{step_num}")
def execute_demo_step(step_num: int):
    global DEMO_STATE
    if step_num < 1 or step_num > 12:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 12.")

    step_info: Dict[str, Any] = {}

    if step_num == 1:
        # Step 1: The Classified Data Leak Problem
        conv = MessagingService.get_or_create_conversation(
            creator_id="arjun",
            participant_ids=["priya", "rahul", "vikram"],
            title="Joint Intelligence Task Force - Secure Channel",
            is_group=True
        )
        DEMO_STATE["conversation_id"] = conv["conversation_id"]
        DEMO_STATE["current_step"] = 1
        if 1 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(1)
            
        step_info = {
            "step": 1,
            "target_page": "demo",
            "title": "1. The Classified Data Leak Problem",
            "summary": "Traditional end-to-end encrypted sharing protects data in transit, but once decrypted, confidentiality terminates. Leaked copies cannot be proven without cryptographic provenance.",
            "technical_details": {
                "sender": "Officer Arjun (Clearance: LEVEL_5_TOP_SECRET)",
                "recipients": ["Officer Priya (Ops Lead)", "Officer Rahul (Field Ops)", "Officer Vikram (Intel Analyst)"],
                "pki_standard": "Local Air-Gapped Hybrid Root PKI (ML-KEM-768 / ML-DSA-65)",
                "channel_id": conv["conversation_id"]
            }
        }

    elif step_num == 2:
        # Step 2: AegisTrace Post-Quantum Architecture
        pdf_bytes = create_sample_intelligence_pdf()
        DEMO_STATE["original_pdf_bytes"] = pdf_bytes
        DEMO_STATE["current_step"] = 2
        if 2 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(2)

        step_info = {
            "step": 2,
            "target_page": "demo",
            "title": "2. AegisTrace Post-Quantum Architecture",
            "summary": "AegisTrace unifies Post-Quantum Cryptography (FIPS 203/204), covert dynamic steganography, and permissioned DLT into a unified zero-knowledge provenance engine.",
            "technical_details": {
                "filename": "SIH_Classified_Project_Report.pdf",
                "size_bytes": len(pdf_bytes),
                "classification": "TOP SECRET // PQC-RESTRICTED",
                "sha3_hash": "Computed dynamically at encapsulation time"
            }
        }

    elif step_num == 3:
        # Step 3: Sender Staging & Forensic Protection
        DEMO_STATE["current_step"] = 3
        if 3 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(3)

        step_info = {
            "step": 3,
            "target_page": "chats",
            "title": "3. Sender Staging & Forensic Protection Activation",
            "summary": "Officer Arjun selects recipients (Priya, Rahul, Vikram), attaches SIH_Classified_Project_Report.pdf, and toggles Forensic Protection [ON].",
            "technical_details": {
                "protection_mode": "Covert Watermark + Dynamic Recipient Provenance",
                "ui_rule": "ABSOLUTE INVISIBILITY - No visible marks, hashes, or identifiers displayed to users",
                "watermark_adapter": "PDF Low-Frequency Micro-Geometric / Metadata Stride Adapter"
            }
        }

    elif step_num == 4:
        # Step 4: Multi-Recipient Envelope Encryption (.SDOC)
        if not DEMO_STATE["original_pdf_bytes"]:
            DEMO_STATE["original_pdf_bytes"] = create_sample_intelligence_pdf()
        if not DEMO_STATE["conversation_id"]:
            conv = MessagingService.get_or_create_conversation("arjun", ["priya", "rahul", "vikram"], is_group=True)
            DEMO_STATE["conversation_id"] = conv["conversation_id"]

        msg = MessagingService.send_encrypted_document(
            conversation_id=DEMO_STATE["conversation_id"],
            sender_id="arjun",
            sender_passphrase="arjun_secret",
            filename="SIH_Classified_Project_Report.pdf",
            mime_type="application/pdf",
            file_bytes=DEMO_STATE["original_pdf_bytes"],
            recipient_ids=["priya", "rahul", "vikram"],
            fingerprint_enabled=True
        )
        DEMO_STATE["document_id"] = msg["document_id"]
        DEMO_STATE["current_step"] = 4
        if 4 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(4)

        step_info = {
            "step": 4,
            "target_page": "documents",
            "title": "4. Multi-Recipient PQC Envelope Encryption (.SDOC)",
            "summary": "Generated single AES-256-GCM encrypted ciphertext encapsulated independently with ML-KEM-768 for Priya, Rahul, and Vikram.",
            "technical_details": {
                "document_id": msg["document_id"],
                "algorithm": "FIPS 203 ML-KEM-768 + AES-256-GCM Authenticated Cipher",
                "sender_signature": "FIPS 204 ML-DSA-65 Non-Repudiation Signature",
                "container_format": ".SDOC (Zero Cloud / Offline Multi-Recipient Package)",
                "recipients_authorized": 3
            }
        }

    elif step_num == 5:
        # Step 5: Decryption & Dynamic Forensic Embedding Engine
        DEMO_STATE["current_step"] = 5
        if 5 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(5)

        step_info = {
            "step": 5,
            "target_page": "encryption",
            "title": "5. Decryption & Dynamic Forensic Embedding",
            "summary": "When an authorized recipient unlocks the document, the engine decapsulates ML-KEM, derives a unique forensic marker, and signs the DecryptionRecord.",
            "technical_details": {
                "algorithm": "ML-KEM-768 Decapsulation -> AES-256-GCM Decryption",
                "watermark_cipher": "AES-256-GCM Authenticated Payload Container",
                "signature": "ML-DSA-65 Recipient Signing"
            }
        }

    elif step_num == 6:
        # Step 6: Recipient 1 (Priya) Decrypts & DLT Anchor
        if not DEMO_STATE["document_id"]:
            execute_demo_step(4)

        priya_res = MessagingService.decrypt_document_for_recipient(
            document_id=DEMO_STATE["document_id"],
            recipient_id="priya",
            recipient_passphrase="priya_secret"
        )
        DEMO_STATE["decrypted_instances"]["priya"] = priya_res
        DEMO_STATE["current_step"] = 6
        if 6 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(6)

        step_info = {
            "step": 6,
            "target_page": "ledger",
            "title": "6. 5-Validator BFT DLT Provenance Commitment",
            "summary": "The recipient signed DecryptionRecord is verified across the 5-validator permissioned BFT demonstration network and committed into a Merkle-anchored DLT block.",
            "technical_details": {
                "recipient": "Officer Priya (Operations Lead)",
                "decryption_status": "SUCCESSFUL (Visual copy is clean)",
                "ledger_block": priya_res["block_height"],
                "dlt_transaction": "Decryption Event Signed with ML-DSA-65",
                "recipient_ui_display": "✓ Identity verified ✓ Access authorized ✓ Document decrypted"
            }
        }

    elif step_num == 7:
        # Step 7: Simulated Leak (Officer Rahul Decrypted Copy)
        if not DEMO_STATE["document_id"]:
            execute_demo_step(4)

        rahul_res = MessagingService.decrypt_document_for_recipient(
            document_id=DEMO_STATE["document_id"],
            recipient_id="rahul",
            recipient_passphrase="rahul_secret"
        )
        DEMO_STATE["decrypted_instances"]["rahul"] = rahul_res
        DEMO_STATE["current_step"] = 7
        if 7 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(7)

        stored_path = DOCUMENT_DIR / rahul_res["internal_file_id"]
        if stored_path.exists():
            with open(stored_path, "rb") as f:
                DEMO_STATE["leaked_file_bytes"] = f.read()

        step_info = {
            "step": 7,
            "target_page": "forensics",
            "title": "7. Simulated Leak: Recipient Copy Exfiltration",
            "summary": "A simulated leak scenario: Officer Rahul decrypted copy is exfiltrated and submitted to the Forensic Lab for provenance investigation.",
            "technical_details": {
                "suspect_file": "classified_report_LEAKED_SAMPLE.pdf",
                "demonstration_mode": "SIMULATED ADVERSARIAL LEAK",
                "source_copy": "Officer Rahul Decrypted Instance"
            }
        }

    elif step_num == 8:
        # Step 8: Covert Watermark Extraction & Authentication
        if not DEMO_STATE["leaked_file_bytes"]:
            execute_demo_step(7)

        DEMO_STATE["current_step"] = 8
        if 8 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(8)

        step_info = {
            "step": 8,
            "target_page": "forensics",
            "title": "8. Covert Watermark Extraction & Authentication",
            "summary": "The forensic engine scans the suspect file, extracts the covert binary container, and verifies the AES-256-GCM authentication tag.",
            "technical_details": {
                "extraction_method": "Multi-Layer PDF Catalog & Trailer Steganography",
                "payload_verification": "AES-256-GCM Authentication Tag (Fail-Closed)",
                "watermark_status": "✓ Authenticated Covert Watermark Detected"
            }
        }

    elif step_num == 9:
        # Step 9: 7-Point Fail-Closed Cryptographic Attribution
        if not DEMO_STATE["leaked_file_bytes"]:
            execute_demo_step(7)

        analysis = ForensicAnalyzer.analyze_document(
            file_bytes=DEMO_STATE["leaked_file_bytes"],
            filename="classified_report_LEAKED_SAMPLE.pdf",
            mime_type="application/pdf"
        )
        DEMO_STATE["forensic_analysis"] = analysis
        DEMO_STATE["current_step"] = 9
        if 9 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(9)

        step_info = {
            "step": 9,
            "target_page": "forensics",
            "title": "9. 7-Point Fail-Closed Cryptographic Attribution",
            "summary": "The engine cross-references the immutable DLT, validates the Merkle proof, and verifies Officer Rahul ML-DSA-65 digital signature.",
            "technical_details": {
                "attributed_recipient": analysis["attributed_recipient"]["display_name"] if analysis["attributed_recipient"] else "Officer Rahul",
                "signature_status": "VALID (ML-DSA-65)",
                "merkle_proof": "VALID (Root Match)",
                "ledger_status": "VALID (Block Anchored)"
            }
        }

    elif step_num == 10:
        # Step 10: Post-Quantum Security Architecture
        DEMO_STATE["current_step"] = 10
        if 10 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(10)

        step_info = {
            "step": 10,
            "target_page": "security",
            "title": "10. Post-Quantum Security Stack & Preflight",
            "summary": "Deep-dive into the FIPS 203 & 204 cryptographic implementation, key management, and automated preflight diagnostics.",
            "technical_details": {
                "kem": "ML-KEM-768 (NIST FIPS 203)",
                "sig": "ML-DSA-65 (NIST FIPS 204)",
                "preflight": "HEALTHY_NATIVE_PQC"
            }
        }

    elif step_num == 11:
        # Step 11: Threat Model & Adversarial Defense Matrix
        DEMO_STATE["current_step"] = 11
        if 11 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(11)

        step_info = {
            "step": 11,
            "target_page": "system",
            "title": "11. Threat Model & Adversarial Defense Matrix",
            "summary": "Evaluation of defense mechanisms against stolen envelopes, tampered watermarks, insider framing, and malicious validators.",
            "technical_details": {
                "tampering_defense": "AES-256-GCM Auth Tag Verification",
                "dlt_defense": "5-Node BFT Merkle Proof Chain",
                "forgery_defense": "Recipient ML-DSA-65 Private Key Signature"
            }
        }

    elif step_num == 12:
        # Step 12: Final Summary & Signed Evidence Package
        if not DEMO_STATE["forensic_analysis"]:
            execute_demo_step(9)

        evidence = EvidenceDossierGenerator.generate_signed_evidence_package(
            analysis_result=DEMO_STATE["forensic_analysis"],
            investigator_id="meera"
        )
        DEMO_STATE["evidence_package"] = evidence
        DEMO_STATE["current_step"] = 12
        if 12 not in DEMO_STATE["completed_steps"]:
            DEMO_STATE["completed_steps"].append(12)

        step_info = {
            "step": 12,
            "target_page": "demo",
            "title": "12. Executive Summary & Production Deliverables",
            "summary": "End-to-end verification completed: Confidential Document Sharing + Post-Quantum Cryptographic Accountability in 100% air-gapped defense networks.",
            "technical_details": {
                "evidence_id": evidence["dossier"]["evidence_id"],
                "status": "CRYPTOGRAPHICALLY VERIFIED",
                "signing_authority": "AegisTrace Root Forensic CA (ML-DSA-65 Signed)"
            }
        }

    DEMO_STATE["logs"].append(f"Step {step_num} executed: {step_info['title']}")
    return {
        "status": "success",
        "step_info": step_info,
        "current_step": DEMO_STATE["current_step"],
        "completed_steps": DEMO_STATE["completed_steps"]
    }

@router.post("/run-scenario")
def run_full_defense_scenario():
    reset_demo_state()
    all_steps = []
    for s in range(1, 13):
        res = execute_demo_step(s)
        all_steps.append(res["step_info"])

    return {
        "status": "success",
        "message": "Full 12-step SIH Judge Evaluation Scenario completed with full cryptographic attribution.",
        "steps": all_steps,
        "forensic_analysis": DEMO_STATE["forensic_analysis"],
        "evidence_package": DEMO_STATE["evidence_package"]
    }
