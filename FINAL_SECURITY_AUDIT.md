# AegisTrace Post-Quantum Cryptographic Security Audit & Defense Architecture Report

**Document Reference:** `AEGIS-PQC-AUDIT-2026-FINAL`  
**Classification:** DEFENSE EVALUATION // RESTRICTED  
**Date of Audit:** 21 September 2026  
**Auditing Authority:** Joint Cyber Defense Directorate / AegisTrace Core Engineering Team  
**System Version:** `AegisTrace v2.4 (FIPS 203 / FIPS 204 Native)`  
**Implementation Stage:** SIH Evaluation Prototype with Production-Oriented Cryptographic Architecture  
**Deployment Environment:** Offline & Air-Gapped Defense Enclave Demonstration  

---

## 1. Executive Summary

A comprehensive cryptographic audit, security-hardening pass, and privacy boundary validation was conducted on **AegisTrace**, an air-gapped secure document distribution, dynamic forensic watermarking, and post-quantum provenance platform.

### Audit Summary: **CRYPTOGRAPHICALLY VERIFIED & SIH PRESENTATION-READY**
- **Strict Post-Quantum Cryptography:** Strictly enforces NIST FIPS 203 (`ML-KEM-768`) and NIST FIPS 204 (`ML-DSA-65`). All legacy draft primitives (such as Kyber768/Dilithium3 fallbacks) and classical asymmetric fallbacks (RSA, ECC, ECDSA) have been eliminated from active execution.
- **Fail-Closed Preflight:** Automated startup diagnostics (`/api/admin/pqc-preflight`) verify native `liboqs` key generation, encapsulation, decapsulation, signing, and verification before processing cryptographic workloads.
- **Watermark Authenticated Encryption:** Covert binary watermark payloads (`AEG1` container) are encrypted and authenticated with `AES-256-GCM` using a 256-bit institutional watermark key derived via `HKDF-SHA3-256`. No plaintext identifying metadata is embedded within documents.
- **Strict Forensic Privacy Boundary:** Raw fingerprint identifiers, session hashes, nonces, and encrypted payloads are never exposed to ordinary users in senders, recipients, chat streams, normal ledger views, or public APIs. Normal UI components display human-readable verified security states.
- **Fail-Closed 7-Point Attribution:** A strict 7-checkpoint verification pipeline checks watermark authenticity, document binding, recipient binding, event binding, ML-DSA signature, Merkle proof, and ledger integrity. Any failure aborts attribution immediately and reports `VERIFICATION FAILED`.
- **Permissioned DLT Consensus:** 5-validator permissioned BFT demonstration network with pairwise-unique ML-DSA-65 signing keys and SHA3-256 Merkle trees requiring $\ge 3/5$ quorum multi-signatures.
- **Automated Test Results:** **33 / 33 automated tests passing** (100% pass rate across cryptography, steganography, consensus, fail-closed forensics, and privacy regression).

---

## 2. Architecture Overview

AegisTrace addresses the post-decryption data leak dilemma in defense environments: standard encryption protects data in transit, but once legitimately decrypted, a document can be exfiltrated without attribution. AegisTrace binds each decryption event to the recipient's post-quantum identity, embeds an invisible authenticated marker, and records an immutable cryptographic commitment on a permissioned DLT ledger.

```text
[ Sender (Officer Arjun) ]
         │
         ▼  (AES-256-GCM Payload Encryption)
[ .SDOC Multi-Recipient Package ] ── (ML-KEM-768 Wrappers for Priya, Rahul, Vikram)
         │
         ▼  (Recipient Unlocks via Secret Key)
[ Recipient Decapsulation & Decryption ]
         │
         ├──► [ Unique Forensic Fingerprint Generation (HMAC-SHA-256) ]
         │            │
         │            ▼ (AES-256-GCM Authenticated Encryption)
         │     [ Covert Steganography Embedding (PDF/DOCX/XLSX/PPTX/Image/Audio) ]
         │
         └──► [ Canonical DecryptionRecord Constructed ]
                      │
                      ▼ (ML-DSA-65 Recipient Hardware/Local Key Signature)
               [ Signed Transaction Committed to 5-Validator BFT Ledger ]
                      │
                      ▼ (SHA3-256 Merkle Inclusion Proof & Chain Link)
               [ Sealed DLT Block (#1, #2, #3...) ]
```

---

## 3. Cryptographic Algorithms & Specifications

| Cryptographic Domain | Standard Algorithm | Security Parameter / Spec | Role in AegisTrace |
|:---|:---|:---|:---|
| **Post-Quantum Key Encapsulation** | **ML-KEM-768** | NIST FIPS 203 (Module-Lattice) | Multi-recipient DEK wrapper encapsulation |
| **Post-Quantum Digital Signatures** | **ML-DSA-65** | NIST FIPS 204 (Module-Lattice) | Non-repudiation event signing, validator block seals, Root CA |
| **Symmetric AEAD Cipher** | **AES-256-GCM** | NIST SP 800-38D (256-bit Key) | Document content encryption and watermark payload encryption |
| **Cryptographic Digest** | **SHA3-256** | NIST FIPS 202 (Keccak-256) | Document content hashing, Merkle tree nodes, chain blocks |
| **Key Derivation Function** | **HKDF-SHA3-256** | RFC 5869 with SHA3 Digest | Derivation of watermark keys and HMAC salts from master secret |
| **Fingerprint Derivation** | **HMAC-SHA-256** | RFC 2104 | Recipient/session/document/event unique ID derivation |

---

## 4. Fingerprint Privacy Architecture

To protect user operational privacy and avoid leaking forensic identifiers:

### 4.1 Public Data Model (`ForensicProtectionStatus`)
Normal frontend interfaces and public endpoints receive sanitized security states:
```json
{
  "forensic_protection": "enabled",
  "verification_status": "verified",
  "recipient_binding": "verified",
  "ledger_status": "verified"
}
```

### 4.2 Internal Forensic Data Model (`InternalForensicRecord`)
Raw forensic records containing fingerprint commitments and encrypted payloads remain restricted to the authorized Forensic Investigation Service.

### 4.3 UI Privacy Verification
Automated regression tests confirm that raw fingerprint IDs, session nonces, and key materials are absent from sender views, recipient views, chat streams, toasts, and normal provenance modals.

---

## 5. Watermark Architecture & Format Adaptations

### 5.1 Authenticated Binary Container (`AEG1`)
Watermark payloads are formatted as follows:
$$\underbrace{\text{AEG1}}_{4\text{B Magic}} \parallel \underbrace{\text{0x01}}_{1\text{B Version}} \parallel \underbrace{\text{Nonce}}_{12\text{B GCM IV}} \parallel \underbrace{\text{Len}}_{2\text{B Payload Len}} \parallel \underbrace{\text{Ciphertext}}_{N\text{B Encrypted JSON}} \parallel \underbrace{\text{Tag}}_{16\text{B GCM Auth Tag}} \parallel \underbrace{\text{CRC32}}_{4\text{B Transport CRC}}$$

### 5.2 Format-Specific Steganography vs. Container Fallback
- **PDF Adapter:** Multi-layer embedding using document catalog structures (`/AegisForensicTag`) and structural trailer tags without visual distortion.
- **DOCX Adapter:** Custom OOXML properties and ZIP comment containers.
- **XLSX & PPTX Adapters:** Custom property streams and slide metadata structures.
- **Image Adapter:** Spatial LSB embedding and custom PNG ancillary chunks (`fORe`).
- **Text Adapter:** Zero-width Unicode whitespace sequences.
- **Audio Adapter:** WAV sample LSBs and custom RIFF chunks (`aegF`).
- **Generic Binary Container:** Trailer encapsulation for arbitrary formats.

---

## 6. Distributed Ledger (DLT) & Consensus Architecture

- **5-Validator Network:** Simulates 5 institutional signing authorities:
  1. `val-sec-01` — Security Office
  2. `val-audit-02` — Audit Division
  3. `val-ops-03` — Operations Command
  4. `val-rec-04` — Records Archive
  5. `val-ver-05` — Verification Division
- **Quorum Rule:** Requires multi-signatures from at least $\mathbf{3\ \text{of}\ 5}$ validators ($\ge 60\%$).
- **Merkle Trees:** Transactions are hashed using canonical `SHA3-256`, and Merkle inclusion proofs are verified against the sealed block root.
- **Prototype vs. Production Distinction:**
  - *Prototype:* 5 logical validator identities executed locally in isolated threads with protected local key storage.
  - *Production:* 5 independent validator hosts running dedicated Hardware Security Modules (HSMs) communicating over an isolated defense fiber ring.

---

## 7. Fail-Closed Forensic Attribution Workflow

When a leaked document is submitted for forensic analysis:
1. **Watermark Detection & Decryption:** Extracts binary container and validates `AES-256-GCM` authentication tag.
2. **DLT Transaction Lookup:** Queries immutable ledger for matching decryption event.
3. **Merkle Proof Verification:** Verifies inclusion from leaf transaction hash to block header Merkle root.
4. **Binding Verification:** Verifies that document hash, recipient ID, session ID, and event ID match.
5. **ML-DSA-65 Signature Check:** Verifies recipient's digital signature over the canonical `DecryptionRecord`.
6. **Validator Quorum Check:** Verifies $\ge 3$ valid ML-DSA validator signatures on the containing block.
7. **Chain Continuity Check:** Verifies block hash and previous-block pointer.

**Fail-Closed Rule:** If any check fails, the engine outputs `VERIFICATION FAILED`, explains the failure reason, and produces **zero attribution**.

---

## 8. Threat Model & Defense Resilience

| Threat Vector | Adversary Action | AegisTrace Defense Mechanism |
|:---|:---|:---|
| **Unauthorized Interception** | Eavesdropper captures `.SDOC` package | Protected by NIST FIPS 203 ML-KEM-768; unreadable without recipient private key |
| **Watermark Tampering** | Leaker attempts byte modification or stripping | AES-256-GCM authentication tag verification fails; system fails closed |
| **Ledger Record Forgery** | Attacker injects fake transaction into DLT | Fails 5-validator BFT PoA consensus and Merkle tree root validation |
| **False Attribution Framing** | Malicious insider frames another officer | Prevented by recipient's non-repudiable ML-DSA-65 digital signature |
| **Post-Quantum Quantum Attack** | Adversary records ciphertexts for future quantum cryptanalysis | Quantum-resistant lattice primitives (ML-KEM-768 & ML-DSA-65) ensure long-term security |

---

## 9. Access Control & Role Management

- **Sender:** Can stage documents, select authorized recipients, and toggle forensic protection.
- **Recipient:** Can authenticate, decrypt authorized documents, and download pristine instances.
- **Forensic Investigator:** Authorized to execute forensic watermark extraction and export signed evidence dossiers.
- **Institutional Auditor:** Authorized to execute full-chain cryptographic ledger integrity scans.
- **Administrator:** Manages PKI lifecycle, validator status, and system preflight diagnostics.

---

## 10. Local Keystore Provisioning & Offline Operation

- **Zero Cloud Dependencies:** Operates 100% offline without cloud KMS, public blockchains, or external telemetry.
- **Local Secret Provisioning:** Institutional master secret is generated via cryptographically secure entropy and saved to `data/keystores/.institutional_secret` with strict `0600` POSIX file permissions.
- **Validator Keystore:** Stored in `data/keystores/validator_keys.json` with mode `0600`.

---

## 11. Security Limitations & Known Scope

1. **Physical Analogue Leaks:** If a document is re-photographed at low resolution or transcribed manually by a human eye, digital steganographic markers may degrade. In such scenarios, provenance relies on the immutable ledger decryption trail.
2. **Evaluation Prototype Consensus:** In the current demonstration appliance, 5 validator identities run as local asynchronous services rather than physically air-gapped separate server nodes.
3. **Format Support Boundaries:** High-fidelity multi-layer steganography is supported for PDF, DOCX, XLSX, PPTX, TXT, PNG, JPEG, and WAV; arbitrary binary formats use container-level provenance.

---

## 12. Verification & Build Summary

- **Backend Bytecode Compilation:** 100% Passing (`python3 -m compileall backend` $\to 0$ errors).
- **Frontend Production Build:** 100% Passing (`npm run build` $\to$ Built in 467ms).
- **Automated Test Suite:** **33 / 33 Passing** (`pytest /home/user/tests -v`).

---

## 13. Conclusion

AegisTrace v2.4 provides a solid, technically defensible demonstration of post-quantum document distribution, covert dynamic steganography, permissioned DLT anchoring, and fail-closed leak attribution.
