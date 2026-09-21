"""
Tests for Fail-Closed Forensic Analysis & Provenance Attribution.
Guarantees zero false attributions and absolute fail-closed response on corrupted/tampered inputs.
"""

import pytest
from app.database.db import init_database
from app.forensic.analyzer import ForensicAnalyzer
from app.messaging.service import MessagingService
from app.identity.manager import identity_manager
from app.ledger.chain import immutable_ledger

def test_forensic_analyzer_fail_closed_unwatermarked():
    random_doc = b"%PDF-1.4 Mock Random Unwatermarked PDF Content"
    analysis = ForensicAnalyzer.analyze_document(random_doc, "random_doc.pdf")
    
    assert analysis["verified"] is False
    assert analysis["forensic_status"] == "VERIFICATION_FAILED"
    assert analysis["attributed_recipient"] is None
    assert "VERIFICATION FAILED" in analysis["status_text"]

def test_forensic_analyzer_fail_closed_tampered_payload():
    # Construct an invalid Aegis payload
    fake_doc = b"%PDF-1.4 Data \n%AEGIS_FORENSIC_FP:QUVHMQEFAAAAAQ==%\n"
    analysis = ForensicAnalyzer.analyze_document(fake_doc, "tampered_doc.pdf")
    
    assert analysis["verified"] is False
    assert analysis["forensic_status"] == "VERIFICATION_FAILED"
    assert analysis["attributed_recipient"] is None

def test_full_pipeline_forensic_attribution_success():
    init_database()
    identity_manager._ensure_seed_users()

    # Setup conversation and send encrypted document
    conv = MessagingService.get_or_create_conversation("arjun", ["rahul"], is_group=False)
    raw_pdf = b"%PDF-1.4 \n1 0 obj\n<< /Title (Confidential Operational Report) >>\nendobj\ntrailer\n<< >>\n%%EOF"
    
    msg = MessagingService.send_encrypted_document(
        conversation_id=conv["conversation_id"],
        sender_id="arjun",
        sender_passphrase="arjun_secret",
        filename="operation_orders.pdf",
        mime_type="application/pdf",
        file_bytes=raw_pdf,
        recipient_ids=["rahul"],
        fingerprint_enabled=True
    )
    
    # Recipient Rahul decrypts
    dec_res = MessagingService.decrypt_document_for_recipient(
        document_id=msg["document_id"],
        recipient_id="rahul",
        recipient_passphrase="rahul_secret"
    )
    
    watermarked_bytes = MessagingService.get_decrypted_file_bytes(
        file_id=dec_res["internal_file_id"],
        user_id="rahul"
    )
    
    # Analyze the decrypted watermarked file
    analysis = ForensicAnalyzer.analyze_document(
        file_bytes=watermarked_bytes,
        filename="operation_orders_leaked.pdf",
        mime_type="application/pdf"
    )
    
    assert analysis["verified"] is True
    assert analysis["forensic_status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    assert analysis["attributed_recipient"]["user_id"] == "rahul"
    assert analysis["verification_checkpoints"]["watermark_authenticated"] is True
    assert analysis["verification_checkpoints"]["mldsa_signature_verified"] is True
    assert analysis["verification_checkpoints"]["merkle_inclusion_verified"] is True

def test_forensic_analyzer_fail_closed_tampered_ledger_record():
    init_database()
    identity_manager._ensure_seed_users()

    conv = MessagingService.get_or_create_conversation("arjun", ["priya"], is_group=False)
    raw_pdf = b"%PDF-1.4 \n1 0 obj\n<< /Title (Confidential Test) >>\nendobj\ntrailer\n<< >>\n%%EOF"
    
    msg = MessagingService.send_encrypted_document(
        conversation_id=conv["conversation_id"],
        sender_id="arjun",
        sender_passphrase="arjun_secret",
        filename="classified_test.pdf",
        mime_type="application/pdf",
        file_bytes=raw_pdf,
        recipient_ids=["priya"],
        fingerprint_enabled=True
    )
    
    dec_res = MessagingService.decrypt_document_for_recipient(
        document_id=msg["document_id"],
        recipient_id="priya",
        recipient_passphrase="priya_secret"
    )
    
    watermarked_bytes = MessagingService.get_decrypted_file_bytes(
        file_id=dec_res["internal_file_id"],
        user_id="priya"
    )
    
    # Tamper with the ledger block transaction recipient
    latest_block = immutable_ledger.latest_block
    orig_recip = latest_block.transactions[0]["payload"]["record"]["recipient_id"]
    try:
        latest_block.transactions[0]["payload"]["record"]["recipient_id"] = "mallory_forger"
        
        # Analyze the document - binding will fail and MUST NOT attribute
        analysis = ForensicAnalyzer.analyze_document(
            file_bytes=watermarked_bytes,
            filename="classified_test_leaked.pdf",
            mime_type="application/pdf"
        )
        
        assert analysis["verified"] is False
        assert analysis["forensic_status"] == "VERIFICATION_FAILED"
        assert analysis["attributed_recipient"] is None
        assert "VERIFICATION FAILED" in analysis["status_text"]
    finally:
        latest_block.transactions[0]["payload"]["record"]["recipient_id"] = orig_recip
