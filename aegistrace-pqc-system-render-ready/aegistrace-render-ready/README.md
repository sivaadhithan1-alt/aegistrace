# AegisTrace PQC — Air-Gapped Post-Quantum Document Distribution & Forensic Attribution

**AegisTrace** is an offline, air-gapped post-quantum secure document distribution, dynamic invisible forensic watermarking, and fail-closed cryptographic attribution system built for defense and intelligence enclaves.

---

## Key Capabilities

1. **Strict Post-Quantum Cryptography (NIST FIPS 203 & 204)**
   - **ML-KEM-768** (NIST FIPS 203) for post-quantum key encapsulation.
   - **ML-DSA-65** (NIST FIPS 204) for non-repudiable recipient decryption event signatures, validator block seals, and Root CA attestation.
   - **AES-256-GCM** for authenticated symmetric envelope encryption (`.SDOC`) and authenticated watermark container encryption.
   - **Zero Classical Fallback**: Strictly fails closed if quantum-resistant algorithms are unavailable.

2. **Covert Dynamic Steganography & Encrypted Watermarking**
   - Unique, session-bound, recipient-specific cryptographic fingerprints generated upon each authorized decryption.
   - **Authenticated Encryption (AES-256-GCM)**: All watermark payloads are authenticated with `AEG1` binary headers. Zero plaintext recipient or fingerprint metadata is stored in files.
   - Format adapters: PDF, DOCX, XLSX, PPTX, TXT, PNG/JPEG, WAV audio, and generic binary containers.
   - **100% Invisible**: Documents remain visually and structurally indistinguishable to human eyes.

3. **5-Validator Byzantine Fault Tolerant (BFT) DLT**
   - 5 independent institutional validator identities (Security Office, Audit Office, Operations Command, Records Archive, Verification Division) with pairwise-unique ML-DSA-65 keys.
   - BFT Proof-of-Authority multi-signature consensus ($\ge 3/5$ quorum) with SHA3-256 Merkle inclusion proofs.

4. **Fail-Closed 7-Point Forensic Attribution**
   - Automatically cross-references leaked documents against the immutable ledger.
   - Validates watermark authentication tag, Merkle proof, recipient ML-DSA signature, and ledger integrity.
   - If any checkpoint fails, reports `VERIFICATION FAILED` and produces **zero attribution**.

5. **Strict Fingerprint UI Privacy**
   - Enforces an absolute UI privacy rule: raw fingerprint IDs, session hashes, nonces, and encrypted payloads are never exposed to senders, recipients, chats, normal ledger views, or public APIs.

6. **12-Step SIH Judge Demo Walkthrough**
   - Interactive 12-page guided defense scenario with persistent bottom-right demo controller.
   - Step-by-step cryptographic walkthrough with "Why this matters" operational context and exportable signed legal dossiers.

---

## Directory Structure

```text
/home/user/
├── backend/
│   └── app/
│       ├── config.py                 # System configuration & 5-validator definitions
│       ├── main.py                   # FastAPI core application
│       ├── crypto/                   # Strict ML-KEM-768, ML-DSA-65, AES-256-GCM, local 0600 provisioning
│       ├── identity/                 # Air-gapped PKI, X.509-PQC credentials & keystore
│       ├── fingerprint/              # HMAC-SHA256 fingerprint derivation & AES-GCM payload generator
│       ├── watermark/                # Format-specific covert adapters (PDF, DOCX, XLSX, PPTX, TXT, PNG, WAV)
│       ├── ledger/                   # 5-node BFT PoA consensus, Merkle tree, chain verifier
│       ├── forensic/                 # Fail-closed analyzer & ML-DSA-signed evidence dossier generator
│       ├── messaging/                # Enclave chat bus & .SDOC multi-recipient orchestrator
│       ├── database/                 # SQLite audit database
│       └── api/                      # REST endpoints for messaging, forensics, ledger, admin, demo
├── frontend/                         # Vite + React + TypeScript + Tailwind CSS (Pure White Theme)
├── tests/                            # Comprehensive automated test suite (25 tests)
├── FINAL_SECURITY_AUDIT.md           # Comprehensive security audit & architecture report
└── aegistrace-pqc-system-final-sih.zip # Final deliverable package
```

---

## Defense Personas

| Persona ID | Display Name | Role / Unit | Clearance |
|:---|:---|:---|:---|
| `arjun` | Officer Arjun | Sender (Cyber Defense Directorate) | LEVEL 5 TOP SECRET |
| `priya` | Officer Priya | Operations Lead (Recipient A) | LEVEL 5 TOP SECRET |
| `rahul` | Officer Rahul | Field Operations (Recipient B) | LEVEL 5 TOP SECRET |
| `vikram` | Officer Vikram | Intelligence Analyst (Recipient C) | LEVEL 5 TOP SECRET |
| `meera` | Dr. Meera | Forensic Intelligence Examiner | LEVEL 5 TOP SECRET |
| `auditor` | Security Auditor | Institutional Compliance Division | AUDIT CLEARANCE |

---

## Running the Automated Test Suite

```bash
# Run all 25 automated tests
PYTHONPATH=/home/user/backend pytest /home/user/tests -v

# Run performance and latency benchmarks
PYTHONPATH=/home/user/backend python3 /home/user/tests/test_benchmark.py
```

---

## Production vs. Evaluation Architecture

In this air-gapped evaluation appliance, the 5 validator signing identities and PKI authority run as local isolated cryptographic engines. In multi-host defense production deployments, each validator node executes on a dedicated, physically isolated Hardware Security Module (HSM) across institutional command centers communicating over a dedicated air-gapped fiber ring.
