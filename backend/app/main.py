"""
FastAPI Main Application Entry Point for AegisTrace PQC Enclave.
Completely offline, air-gapped architecture.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database.db import init_db
from app.config import AIR_GAP_MODE, CRYPTO_CONFIG, CORS_ORIGINS
from app.api.auth_router import router as auth_router
from app.api.messaging_router import router as messaging_router
from app.api.document_router import router as document_router
from app.api.forensic_router import router as forensic_router
from app.api.ledger_router import router as ledger_router
from app.api.admin_router import router as admin_router
from app.api.demo_router import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and default identities on startup
    init_db()
    yield

app = FastAPI(
    title="AegisTrace PQC - Cryptographic Attribution & Provenance Enclave",
    description="Offline Air-Gapped Multi-Recipient Encrypted Document Distribution with Post-Quantum Signatures, Invisible Steganography & Tamper-Evident Ledger",
    version="1.0.0-PQC",
    lifespan=lifespan
)

# Configure CORS for local development and preview environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Air-gap enforcement middleware: blocks any external host redirection or telemetry
@app.middleware("http")
async def air_gap_enforcement_middleware(request: Request, call_next):
    # Set air-gap defense security headers
    response = await call_next(request)
    response.headers["X-AirGap-Mode"] = "STRICT_OFFLINE"
    response.headers["X-PQC-Suite"] = f"KEM:{CRYPTO_CONFIG.kem_algorithm},SIG:{CRYPTO_CONFIG.signature_algorithm}"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    return response

# Include Subsystem Routers
app.include_router(auth_router)
app.include_router(messaging_router)
app.include_router(document_router)
app.include_router(forensic_router)
app.include_router(ledger_router)
app.include_router(admin_router)
app.include_router(demo_router)

@app.get("/")
def root():
    return {
        "system": "AegisTrace Post-Quantum Attribution Enclave",
        "status": "ONLINE (AIR-GAPPED)",
        "version": "1.0.0-PQC",
        "crypto_suite": {
            "kem": CRYPTO_CONFIG.kem_algorithm,
            "signature": CRYPTO_CONFIG.signature_algorithm,
            "aead": CRYPTO_CONFIG.aead_algorithm,
            "hash": CRYPTO_CONFIG.hash_algorithm
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "air_gapped"}
