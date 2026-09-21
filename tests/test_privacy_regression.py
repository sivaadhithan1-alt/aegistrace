"""
Privacy Boundary Regression Tests.
Ensures raw fingerprint IDs, session secrets, nonces, and private keys are never exposed in normal user APIs or models.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.database.db import init_database
from app.identity.manager import identity_manager
from app.messaging.service import MessagingService

client = TestClient(app)

def test_api_privacy_document_provenance():
    init_database()
    identity_manager._ensure_seed_users()

    conv = MessagingService.get_or_create_conversation("arjun", ["rahul"], is_group=False)
    doc_res = MessagingService.send_encrypted_document(
        conversation_id=conv["conversation_id"],
        sender_id="arjun",
        sender_passphrase="arjun_secret",
        filename="classified_test_privacy.pdf",
        mime_type="application/pdf",
        file_bytes=b"%PDF-1.4 Mock PDF Content",
        recipient_ids=["rahul"],
        fingerprint_enabled=True
    )

    # Rahul decrypts
    MessagingService.decrypt_document_for_recipient(
        document_id=doc_res["document_id"],
        recipient_id="rahul",
        recipient_passphrase="rahul_secret"
    )

    # Call provenance API
    resp = client.get(f"/api/documents/{doc_res['document_id']}/provenance")
    assert resp.status_code == 200
    data = resp.json()

    # Verify absence of raw fingerprint_id and session secrets in public provenance response
    for evt in data.get("events_provenance", []):
        db_evt = evt.get("event_db", {})
        assert "fingerprint_id" not in db_evt, "Raw fingerprint_id leaked in public provenance API!"
        assert "session_id" not in db_evt, "Raw session_id leaked in public provenance API!"
        assert "forensic_copy_filename" not in db_evt
        assert db_evt.get("forensic_protection") == "enabled"
        assert db_evt.get("verification_status") == "verified"

def test_api_privacy_document_info():
    init_database()
    conv = MessagingService.get_or_create_conversation("arjun", ["rahul"], is_group=False)
    doc_res = MessagingService.send_encrypted_document(
        conversation_id=conv["conversation_id"],
        sender_id="arjun",
        sender_passphrase="arjun_secret",
        filename="privacy_info_test.pdf",
        mime_type="application/pdf",
        file_bytes=b"%PDF-1.4 Mock PDF Content",
        recipient_ids=["rahul"],
        fingerprint_enabled=True
    )

    resp = client.get(f"/api/documents/{doc_res['document_id']}")
    assert resp.status_code == 200
    data = resp.json()

    for evt in data.get("decryption_events", []):
        assert "fingerprint_id" not in evt
        assert "session_id" not in evt
        assert evt.get("forensic_protection") == "enabled"
