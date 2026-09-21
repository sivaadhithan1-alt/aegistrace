"""
Messaging Service and Secure Document Distribution Orchestrator.
Coordinates chat conversations, PQC envelope encryption, dynamic fingerprinting, and ledger commits.
Strictly adheres to Fingerprint Invisibility: Never leaks raw fingerprints in user-facing messaging payloads.
"""

import os
import json
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.config import DOCUMENT_DIR, CRYPTO_CONFIG
from app.database.db import get_db_connection
from app.identity.manager import identity_manager
from app.crypto.envelope import create_secure_document_package, decrypt_secure_document_package
from app.crypto.pqc import sig_engine, b64_decode, b64_encode
from app.crypto.kdf import hash_sha3_256_bytes
from app.fingerprint.generator import generate_covert_fingerprint
from app.fingerprint.record import create_canonical_decryption_record, sign_decryption_record
from app.watermark.factory import watermark_registry
from app.ledger.chain import immutable_ledger
from app.audit.logger import log_audit_event

class MessagingService:
    @staticmethod
    def get_or_create_conversation(creator_id: str, participant_ids: List[str], title: Optional[str] = None, is_group: bool = False) -> Dict[str, Any]:
        all_members = sorted(list(set([creator_id] + participant_ids)))
        conn = get_db_connection()
        try:
            # If 1-to-1 conversation, check if already exists
            if not is_group and len(all_members) == 2:
                rows = conn.execute(
                    """
                    SELECT c.conversation_id, c.title, c.is_group, c.created_at
                    FROM conversations c
                    JOIN conversation_members m1 ON c.conversation_id = m1.conversation_id AND m1.user_id = ?
                    JOIN conversation_members m2 ON c.conversation_id = m2.conversation_id AND m2.user_id = ?
                    WHERE c.is_group = 0
                    """,
                    (all_members[0], all_members[1])
                ).fetchall()
                if rows:
                    conv_id = rows[0]["conversation_id"]
                    return MessagingService.get_conversation_details(conv_id)

            # Otherwise create new conversation
            conv_id = f"CONV-{uuid.uuid4().hex[:12].upper()}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            if not title:
                if is_group:
                    title = f"Secure Group ({len(all_members)} members)"
                else:
                    other_id = [u for u in all_members if u != creator_id][0]
                    other_user = identity_manager.get_public_user_info(other_id)
                    title = other_user["display_name"] if other_user else other_id

            conn.execute(
                """
                INSERT INTO conversations (conversation_id, title, is_group, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (conv_id, title, 1 if is_group else 0, creator_id, now, now)
            )

            for uid in all_members:
                conn.execute(
                    """
                    INSERT INTO conversation_members (conversation_id, user_id, joined_at)
                    VALUES (?, ?, ?)
                    """,
                    (conv_id, uid, now)
                )

            conn.commit()
            log_audit_event("CONVERSATION_CREATED", creator_id, conv_id, {"title": title, "members": all_members})
            return MessagingService.get_conversation_details(conv_id)
        finally:
            conn.close()

    @staticmethod
    def list_user_conversations(user_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            rows = conn.execute(
                """
                SELECT c.conversation_id, c.title, c.is_group, c.created_by, c.created_at, c.updated_at
                FROM conversations c
                JOIN conversation_members m ON c.conversation_id = m.conversation_id
                WHERE m.user_id = ?
                ORDER BY c.updated_at DESC
                """,
                (user_id,)
            ).fetchall()

            convs = []
            for r in rows:
                c_id = r["conversation_id"]
                members = conn.execute(
                    "SELECT user_id FROM conversation_members WHERE conversation_id = ?",
                    (c_id,)
                ).fetchall()
                
                last_msg = conn.execute(
                    """
                    SELECT message_id, sender_id, content, message_type, document_id, created_at
                    FROM messages
                    WHERE conversation_id = ?
                    ORDER BY created_at DESC LIMIT 1
                    """,
                    (c_id,)
                ).fetchone()

                convs.append({
                    "conversation_id": c_id,
                    "title": r["title"],
                    "is_group": bool(r["is_group"]),
                    "created_by": r["created_by"],
                    "created_at": r["created_at"],
                    "updated_at": r["updated_at"],
                    "members": [m["user_id"] for m in members],
                    "last_message": dict(last_msg) if last_msg else None
                })
            return convs
        finally:
            conn.close()

    @staticmethod
    def get_conversation_details(conversation_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            row = conn.execute(
                "SELECT conversation_id, title, is_group, created_by, created_at, updated_at FROM conversations WHERE conversation_id = ?",
                (conversation_id,)
            ).fetchone()
            if not row:
                return None

            members = conn.execute(
                "SELECT user_id, joined_at FROM conversation_members WHERE conversation_id = ?",
                (conversation_id,)
            ).fetchall()

            member_details = []
            for m in members:
                u_info = identity_manager.get_public_user_info(m["user_id"])
                if u_info:
                    member_details.append(u_info)

            return {
                "conversation_id": row["conversation_id"],
                "title": row["title"],
                "is_group": bool(row["is_group"]),
                "created_by": row["created_by"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "members": member_details
            }
        finally:
            conn.close()

    @staticmethod
    def send_text_message(conversation_id: str, sender_id: str, content: str) -> Dict[str, Any]:
        msg_id = f"MSG-{uuid.uuid4().hex[:12].upper()}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        conn = get_db_connection()
        try:
            conn.execute(
                """
                INSERT INTO messages (message_id, conversation_id, sender_id, content, message_type, status, created_at)
                VALUES (?, ?, ?, ?, 'TEXT', 'DELIVERED', ?)
                """,
                (msg_id, conversation_id, sender_id, content, now)
            )
            conn.execute(
                "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
                (now, conversation_id)
            )
            conn.commit()

            return {
                "message_id": msg_id,
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "content": content,
                "message_type": "TEXT",
                "status": "DELIVERED",
                "created_at": now
            }
        finally:
            conn.close()

    @staticmethod
    def send_encrypted_document(
        conversation_id: str,
        sender_id: str,
        sender_passphrase: str,
        filename: str,
        mime_type: str,
        file_bytes: bytes,
        recipient_ids: List[str],
        fingerprint_enabled: bool = True
    ) -> Dict[str, Any]:
        """
        Multi-recipient PQC envelope encryption workflow:
        1. Validates sender and extracts sender ML-DSA signing key.
        2. Retrieves recipient ML-KEM public keys.
        3. Generates .SDOC container.
        4. Saves .SDOC file.
        5. Inserts document record and sends message.
        """
        # Unlock sender keys
        _, sender_dsa_sk = identity_manager.get_user_keys_with_passphrase(sender_id, sender_passphrase)

        # Collect recipient KEM public keys
        recip_pk_map: Dict[str, bytes] = {}
        for r_id in recipient_ids:
            u_info = identity_manager.get_public_user_info(r_id)
            if not u_info:
                raise ValueError(f"Recipient user '{r_id}' not found.")
            kem_pk_b64 = u_info["certificate"]["subject"]["public_keys"]["kem_public_key"]
            recip_pk_map[r_id] = b64_decode(kem_pk_b64)

        doc_id = f"DOC-{uuid.uuid4().hex[:12].upper()}"
        sdoc_filename = f"{doc_id}.sdoc"

        # Create multi-recipient SDOC package
        sdoc_package = create_secure_document_package(
            document_bytes=file_bytes,
            document_id=doc_id,
            filename=filename,
            mime_type=mime_type,
            sender_id=sender_id,
            sender_signing_secret_key=sender_dsa_sk,
            recipient_public_keys=recip_pk_map,
            fingerprint_enabled=fingerprint_enabled
        )

        # Save SDOC file to disk
        sdoc_path = DOCUMENT_DIR / sdoc_filename
        with open(sdoc_path, "w", encoding="utf-8") as f:
            json.dump(sdoc_package, f, indent=2)

        content_hash = sdoc_package["manifest"]["content_hash_sha3"]
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        msg_id = f"MSG-{uuid.uuid4().hex[:12].upper()}"

        conn = get_db_connection()
        try:
            conn.execute(
                """
                INSERT INTO documents (
                    document_id, original_filename, mime_type, file_size, content_hash_sha3,
                    sender_id, fingerprint_enabled, sdoc_filename, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (doc_id, filename, mime_type, len(file_bytes), content_hash, sender_id, 1 if fingerprint_enabled else 0, sdoc_filename, now)
            )

            for r_id in recipient_ids:
                conn.execute(
                    """
                    INSERT INTO document_recipients (document_id, recipient_id, decryption_count)
                    VALUES (?, ?, 0)
                    """,
                    (doc_id, r_id)
                )

            # Insert message (user-friendly, clean notice)
            conn.execute(
                """
                INSERT INTO messages (
                    message_id, conversation_id, sender_id, content, message_type, document_id, status, created_at
                )
                VALUES (?, ?, ?, ?, 'DOCUMENT', ?, 'DELIVERED', ?)
                """,
                (msg_id, conversation_id, sender_id, f"Sent encrypted document: {filename}", doc_id, now)
            )
            conn.execute("UPDATE conversations SET updated_at = ? WHERE conversation_id = ?", (now, conversation_id))
            conn.commit()

            log_audit_event(
                "DOCUMENT_ENCRYPTED_AND_SENT",
                sender_id,
                doc_id,
                {"filename": filename, "recipients": recipient_ids, "fingerprint_enabled": fingerprint_enabled}
            )

            return {
                "message_id": msg_id,
                "document_id": doc_id,
                "filename": filename,
                "mime_type": mime_type,
                "file_size": len(file_bytes),
                "fingerprint_enabled": fingerprint_enabled,
                "recipients": recipient_ids,
                "created_at": now
            }
        finally:
            conn.close()

    @staticmethod
    def decrypt_document_for_recipient(
        document_id: str,
        recipient_id: str,
        recipient_passphrase: str
    ) -> Dict[str, Any]:
        """
        Recipient Decryption Workflow:
        1. Authenticate recipient & unlock KEM/DSA secret keys.
        2. Load SDOC container.
        3. Perform ML-KEM decapsulation and AES-256-GCM decryption.
        4. Generate dynamic recipient-specific fingerprint (if enabled).
        5. Embed covert watermark using appropriate adapter (NEVER visible to recipient).
        6. Recipient signs canonical DecryptionRecord with ML-DSA-65.
        7. Commit signed record to Immutable Ledger.
        8. Return clean user-facing response WITHOUT exposing raw fingerprint value.
        """
        # Unlock recipient secret keys
        recip_kem_sk, recip_dsa_sk = identity_manager.get_user_keys_with_passphrase(recipient_id, recipient_passphrase)

        conn = get_db_connection()
        try:
            doc_row = conn.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,)).fetchone()
            if not doc_row:
                raise ValueError("Document not found.")

            sdoc_path = DOCUMENT_DIR / doc_row["sdoc_filename"]
            if not sdoc_path.exists():
                raise FileNotFoundError("Encrypted SDOC container file missing on storage.")

            with open(sdoc_path, "r", encoding="utf-8") as f:
                sdoc_package = json.load(f)

            # Retrieve sender verification key
            sender_id = doc_row["sender_id"]
            sender_info = identity_manager.get_public_user_info(sender_id)
            sender_vk = None
            if sender_info:
                sender_vk_b64 = sender_info["certificate"]["subject"]["public_keys"]["dsa_public_key"]
                sender_vk = b64_decode(sender_vk_b64)

            # Decrypt payload
            plain_bytes, manifest = decrypt_secure_document_package(
                sdoc_container=sdoc_package,
                recipient_id=recipient_id,
                recipient_kem_secret_key=recip_kem_sk,
                sender_verification_key=sender_vk
            )

            fingerprint_enabled = bool(doc_row["fingerprint_enabled"])
            session_id = f"SESS-{uuid.uuid4().hex[:12].upper()}"
            event_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()

            if fingerprint_enabled:
                # Select adapter and embed covert forensic watermark
                adapter = watermark_registry.get_adapter_for_file(doc_row["original_filename"], doc_row["mime_type"])
                fp_record, packed_payload = generate_covert_fingerprint(
                    document_id=document_id,
                    sender_id=sender_id,
                    recipient_id=recipient_id,
                    content_hash=doc_row["content_hash_sha3"],
                    watermark_adapter=adapter.adapter_name,
                    session_id=session_id,
                    decryption_event_id=event_id
                )

                watermarked_copy_bytes = adapter.embed_fingerprint(plain_bytes, fp_record, packed_payload)
                forensic_copy_hash = hash_sha3_256_bytes(watermarked_copy_bytes)
                
                # Internal storage of recipient's forensic copy
                internal_storage_filename = f"{document_id}_{recipient_id}_{session_id}_{doc_row['original_filename']}"
                forensic_path = DOCUMENT_DIR / internal_storage_filename
                with open(forensic_path, "wb") as f:
                    f.write(watermarked_copy_bytes)

                # Construct and sign canonical Decryption Record with recipient's ML-DSA-65 key
                dec_record = create_canonical_decryption_record(
                    event_id=event_id,
                    document_id=document_id,
                    document_hash=doc_row["content_hash_sha3"],
                    recipient_id=recipient_id,
                    session_id=session_id,
                    fingerprint_id=fp_record.fingerprint_id,
                    timestamp=now,
                    forensic_copy_hash=forensic_copy_hash
                )

                signed_tx_payload = sign_decryption_record(dec_record, recip_dsa_sk)

                # Commit to local immutable permissioned ledger
                committed_block, tx_idx, tx_hash = immutable_ledger.add_transaction_and_mine_block(signed_tx_payload)
                block_height = committed_block.header.block_height
                tx_id = committed_block.transactions[tx_idx]["tx_id"]

                # Record in SQLite
                conn.execute(
                    """
                    INSERT INTO decryption_events (
                        event_id, document_id, recipient_id, session_id, fingerprint_id,
                        block_height, tx_id, tx_hash, forensic_copy_filename, forensic_copy_hash, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (event_id, document_id, recipient_id, session_id, fp_record.fingerprint_id,
                     block_height, tx_id, tx_hash, internal_storage_filename, forensic_copy_hash, now)
                )

                conn.execute(
                    """
                    UPDATE document_recipients
                    SET decryption_count = decryption_count + 1,
                        last_decrypted_at = ?,
                        first_decrypted_at = COALESCE(first_decrypted_at, ?)
                    WHERE document_id = ? AND recipient_id = ?
                    """,
                    (now, now, document_id, recipient_id)
                )
                conn.commit()

                log_audit_event(
                    "DOCUMENT_DECRYPTED",
                    recipient_id,
                    document_id,
                    {
                        "status": "SUCCESS",
                        "block_height": block_height,
                        "tx_id": tx_id
                    }
                )

                # NORMAL RECIPIENT VIEW: NEVER return raw fingerprint value!
                return {
                    "document_id": document_id,
                    "filename": doc_row["original_filename"],
                    "mime_type": doc_row["mime_type"],
                    "fingerprint_enabled": True,
                    "status": "DECRYPTED",
                    "status_message": "✓ Document decrypted securely using post-quantum credentials.",
                    "block_height": block_height,
                    "download_filename": doc_row["original_filename"],
                    "internal_file_id": internal_storage_filename,
                    "decrypted_bytes_len": len(watermarked_copy_bytes),
                    "raw_decrypted_bytes": b64_encode(watermarked_copy_bytes)
                }

            else:
                # Clean decryption without watermark
                clean_filename = f"{document_id}_{recipient_id}_clean_{doc_row['original_filename']}"
                clean_path = DOCUMENT_DIR / clean_filename
                with open(clean_path, "wb") as f:
                    f.write(plain_bytes)

                conn.execute(
                    """
                    UPDATE document_recipients
                    SET decryption_count = decryption_count + 1,
                        last_decrypted_at = ?,
                        first_decrypted_at = COALESCE(first_decrypted_at, ?)
                    WHERE document_id = ? AND recipient_id = ?
                    """,
                    (now, now, document_id, recipient_id)
                )
                conn.commit()

                log_audit_event("DOCUMENT_DECRYPTED_CLEAN", recipient_id, document_id)

                return {
                    "document_id": document_id,
                    "filename": doc_row["original_filename"],
                    "mime_type": doc_row["mime_type"],
                    "fingerprint_enabled": False,
                    "status": "DECRYPTED",
                    "status_message": "✓ Document decrypted securely.",
                    "download_filename": doc_row["original_filename"],
                    "internal_file_id": clean_filename,
                    "decrypted_bytes_len": len(plain_bytes),
                    "raw_decrypted_bytes": b64_encode(plain_bytes)
                }
        finally:
            conn.close()

    @staticmethod
    def get_decrypted_file_bytes(file_id: str, user_id: str = "") -> bytes:
        file_path = DOCUMENT_DIR / file_id
        if not file_path.exists():
            raise FileNotFoundError(f"Decrypted file '{file_id}' not found.")
        with open(file_path, "rb") as f:
            return f.read()

    @staticmethod
    def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            rows = conn.execute(
                """
                SELECT m.message_id, m.conversation_id, m.sender_id, m.content, m.message_type,
                       m.document_id, m.status, m.created_at,
                       d.original_filename, d.mime_type, d.file_size, d.fingerprint_enabled
                FROM messages m
                LEFT JOIN documents d ON m.document_id = d.document_id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
                """,
                (conversation_id,)
            ).fetchall()

            messages = []
            for r in rows:
                msg = {
                    "message_id": r["message_id"],
                    "conversation_id": r["conversation_id"],
                    "sender_id": r["sender_id"],
                    "content": r["content"],
                    "message_type": r["message_type"],
                    "document_id": r["document_id"],
                    "status": r["status"],
                    "created_at": r["created_at"]
                }
                if r["document_id"]:
                    recips = conn.execute(
                        "SELECT recipient_id, decryption_count, last_decrypted_at FROM document_recipients WHERE document_id = ?",
                        (r["document_id"],)
                    ).fetchall()
                    msg["document_info"] = {
                        "document_id": r["document_id"],
                        "filename": r["original_filename"],
                        "mime_type": r["mime_type"],
                        "file_size": r["file_size"],
                        "fingerprint_enabled": bool(r["fingerprint_enabled"]),
                        "recipients": [dict(rec) for rec in recips]
                    }
                messages.append(msg)
            return messages
        finally:
            conn.close()
