"""
Authentication and Identity API Router.
Local offline session management and PKI identity enrollment.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel

from app.identity.manager import identity_manager
from app.identity.pki import offline_pki
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    user_id: str
    password: str

class RegisterRequest(BaseModel):
    user_id: str
    display_name: str
    role: str = "recipient"
    password: str

class RevokeRequest(BaseModel):
    target_user_id: str
    reason: str
    admin_password: str

@router.post("/login")
def login(req: LoginRequest):
    user_id = req.user_id.lower().strip()
    if not identity_manager.verify_password(user_id, req.password):
        log_audit_event("LOGIN_FAILED", user_id, details={"reason": "Invalid credentials"})
        raise HTTPException(status_code=401, detail="Invalid User ID or Password")

    user_info = identity_manager.get_public_user_info(user_id)
    log_audit_event("LOGIN_SUCCESS", user_id, details={"role": user_info["role"]})
    return {
        "status": "success",
        "user": user_info,
        "session_token": f"aegis-token-{user_id}-{req.password[:4]}"
    }

@router.post("/register")
def register(req: RegisterRequest):
    try:
        user_info = identity_manager.enroll_user(
            user_id=req.user_id,
            display_name=req.display_name,
            role=req.role,
            password=req.password
        )
        log_audit_event("USER_ENROLLED", req.user_id, details={"display_name": req.display_name, "role": req.role})
        return {"status": "success", "user": user_info}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users")
def list_users():
    return {"users": identity_manager.list_all_users()}

@router.get("/me")
def get_current_user(x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    user = identity_manager.get_public_user_info(x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}

@router.post("/revoke")
def revoke_user_identity(req: RevokeRequest, x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    if not x_user_id or x_user_id != "admin":
        raise HTTPException(status_code=403, detail="Only Security Administrator can revoke identities.")
    if not identity_manager.verify_password("admin", req.admin_password):
        raise HTTPException(status_code=401, detail="Invalid admin password.")

    offline_pki.revoke_identity(req.target_user_id, req.reason, revoked_by=x_user_id)
    if req.target_user_id in identity_manager.users:
        identity_manager.users[req.target_user_id]["status"] = "REVOKED"
        identity_manager._save_users()

    log_audit_event("IDENTITY_REVOKED", x_user_id, req.target_user_id, {"reason": req.reason})
    return {"status": "success", "message": f"User {req.target_user_id} revoked."}

@router.get("/crl")
def get_crl():
    return {"revocations": offline_pki.get_crl()}
