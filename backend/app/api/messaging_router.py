"""
Messaging API Router.
WhatsApp-style conversations, message exchange, and multi-recipient encrypted file attachments.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel

from app.messaging.service import MessagingService

router = APIRouter(prefix="/api/messaging", tags=["Messaging"])

class CreateConversationRequest(BaseModel):
    participant_ids: List[str]
    title: Optional[str] = None
    is_group: bool = False

class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str

@router.get("/conversations")
def get_conversations(x_user_id: Optional[str] = Header("alice", alias="X-User-Id")):
    return {"conversations": MessagingService.list_user_conversations(x_user_id)}

@router.post("/conversations")
def create_conversation(req: CreateConversationRequest, x_user_id: Optional[str] = Header("alice", alias="X-User-Id")):
    conv = MessagingService.get_or_create_conversation(
        creator_id=x_user_id,
        participant_ids=req.participant_ids,
        title=req.title,
        is_group=req.is_group
    )
    return {"status": "success", "conversation": conv}

@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str):
    conv = MessagingService.get_conversation_details(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": conv}

@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str):
    messages = MessagingService.get_conversation_messages(conversation_id)
    return {"messages": messages}

@router.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: str, req: SendMessageRequest, x_user_id: Optional[str] = Header("alice", alias="X-User-Id")):
    msg = MessagingService.send_text_message(conversation_id, x_user_id, req.content)
    return {"status": "success", "message": msg}

@router.post("/conversations/{conversation_id}/attachments")
async def send_attachment(
    conversation_id: str,
    file: UploadFile = File(...),
    recipient_ids: str = Form(...),  # comma-separated list
    fingerprint_enabled: bool = Form(True),
    passphrase: str = Form(...),
    x_user_id: Optional[str] = Header("alice", alias="X-User-Id")
):
    """
    Encrypts uploaded document with AES-256-GCM + ML-KEM-768 for selected recipients.
    """
    try:
        recips = [r.strip() for r in recipient_ids.split(",") if r.strip()]
        if not recips:
            raise HTTPException(status_code=400, detail="At least one recipient is required.")

        file_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"

        result = MessagingService.send_encrypted_document(
            conversation_id=conversation_id,
            sender_id=x_user_id,
            sender_passphrase=passphrase,
            filename=file.filename or "attachment.bin",
            mime_type=mime_type,
            file_bytes=file_bytes,
            recipient_ids=recips,
            fingerprint_enabled=fingerprint_enabled
        )

        return {"status": "success", "document": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attachment encryption failed: {e}")
