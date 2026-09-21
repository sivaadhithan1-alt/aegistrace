# AegisTrace PQC — Comprehensive Cryptographic & Forensic Test Report

**Report Reference:** `AEGIS-TEST-REPORT-2026-FINAL`  
**Execution Timestamp:** 2026-09-21T16:17:00Z  
**Test Runner:** `pytest 9.0.3` (Python 3.13.14 on Linux x86_64)  
**Total Tests Executed:** 33  
**Passing:** 33  
**Failing:** 0  
**Not Executed:** 0  
**Pass Rate:** 100%  

---

## Environment & Dependency Matrix

| Component | Verified Specification | Status |
|:---|:---|:---|
| **Python Runtime** | Python 3.13.14 (`/usr/local/bin/python3.13`) | OPERATIONAL |
| **Node.js Runtime** | Node.js v20+ / npm v10+ | OPERATIONAL |
| **PQC Provider** | Open Quantum Safe `liboqs-python` (`liboqs 0.12.0`) | NATIVE OPERATIONAL |
| **KEM Algorithm** | `ML-KEM-768` (NIST FIPS 203) | VERIFIED |
| **Signature Algorithm** | `ML-DSA-65` (NIST FIPS 204) | VERIFIED |
| **Symmetric AEAD** | `AES-256-GCM` (Cryptography 43.0.0) | VERIFIED |
| **Digest Primitives** | `SHA3-256` (NIST FIPS 202) & `HKDF-SHA3-256` | VERIFIED |
| **Ledger Consensus** | 5-Validator Permissioned BFT PoA ($3/5$ Quorum) | VERIFIED |
| **Air-Gap Mode** | 100% Local / Zero Cloud KMS / Zero External SaaS | ENFORCED |

---

## Detailed Test Case Execution Matrix

### 1. Post-Quantum Cryptography & Preflight Diagnostics (`tests/test_crypto.py` & `tests/test_pqc_strictness.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_ml_kem_768_keygen_and_encapsulation` | **PASS** | ML-KEM-768 keypair generated, encapsulated 32B shared secret, decapsulated identically | Python 3.13.14 | `liboqs` (ML-KEM-768) |
| `test_ml_kem_decapsulation_wrong_ciphertext` | **PASS** | Corrupted ciphertext rejected via implicit rejection returning mismatched secret | Python 3.13.14 | `liboqs` (ML-KEM-768) |
| `test_ml_dsa_65_signing_and_verification` | **PASS** | ML-DSA-65 signed canonical payload; public key verified signature successfully | Python 3.13.14 | `liboqs` (ML-DSA-65) |
| `test_aes_256_gcm_authenticated_encryption` | **PASS** | 256-bit AES-GCM encrypted payload, decrypted cleanly, tampered ciphertext raised error | Python 3.13.14 | `cryptography` (AESGCM) |
| `test_multi_recipient_sdoc_package` | **PASS** | Single AES-256-GCM payload encrypted with 3 independent ML-KEM recipient wrappers | Python 3.13.14 | `liboqs`, `cryptography` |
| `test_pqc_preflight_diagnostics` | **PASS** | Preflight executed native KEM and DSA self-tests, returning `HEALTHY_NATIVE_PQC` | Python 3.13.14 | `liboqs` |
| `test_ml_kem_768_fail_closed_tamper` | **PASS** | Altered ciphertext produced pseudo-random secret that failed downstream decryption | Python 3.13.14 | `liboqs` (ML-KEM-768) |
| `test_ml_dsa_65_signature_verification_and_tamper_rejection` | **PASS** | Altered message and bit-flipped signature correctly rejected by verifier | Python 3.13.14 | `liboqs` (ML-DSA-65) |

---

### 2. Forensic Watermark Authenticated Encryption (`tests/test_watermark_encryption.py` & `tests/test_watermarks.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_watermark_payload_authenticated_encryption` | **PASS** | Verified `AEG1` container format; confirmed zero plaintext metadata strings in binary | Python 3.13.14 | `cryptography` (AESGCM) |
| `test_watermark_payload_tampered_ciphertext_fails` | **PASS** | Bit-flipped ciphertext triggered `ValueError` (AES-GCM tag verification failure) | Python 3.13.14 | `cryptography` |
| `test_watermark_payload_tampered_tag_fails` | **PASS** | Corrupted 16-byte authentication tag triggered fail-closed exception | Python 3.13.14 | `cryptography` |
| `test_watermark_payload_tampered_nonce_fails` | **PASS** | Altered IV nonce caused immediate decryption authentication abort | Python 3.13.14 | `cryptography` |
| `test_watermark_payload_tampered_version_fails` | **PASS** | Unsupported version byte rejected during container unpack | Python 3.13.14 | `app.fingerprint` |
| `test_pdf_watermark_adapter` | **PASS** | Multi-layer PDF steganography embedded & extracted authenticated container cleanly | Python 3.13.14 | `pypdf` |
| `test_docx_watermark_adapter` | **PASS** | OOXML custom property & ZIP comment embedded & extracted authenticated payload | Python 3.13.14 | `python-docx` |
| `test_txt_watermark_adapter` | **PASS** | Zero-width Unicode characters embedded & extracted authenticated payload | Python 3.13.14 | `app.watermark` |
| `test_image_png_watermark_adapter` | **PASS** | Spatial LSB & custom PNG ancillary chunk embedded & recovered payload | Python 3.13.14 | `Pillow` |

---

### 3. Fingerprint Generation & Signed Decryption Records (`tests/test_fingerprints.py` & `tests/test_signed_decryption_record.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_fingerprint_generation_uniqueness_recipients` | **PASS** | Different recipients generate cryptographically distinct fingerprints | Python 3.13.14 | `app.fingerprint` |
| `test_fingerprint_generation_uniqueness_sessions` | **PASS** | Same recipient across different sessions generates distinct unique fingerprints | Python 3.13.14 | `app.fingerprint` |
| `test_fingerprint_payload_packing_and_crc_verification` | **PASS** | Container framing and CRC32 transport integrity verified | Python 3.13.14 | `zlib`, `cryptography` |
| `test_signed_decryption_record_valid_verification` | **PASS** | ML-DSA-65 signed canonical JSON DecryptionRecord verified with recipient public key | Python 3.13.14 | `liboqs` (ML-DSA-65) |
| `test_signed_decryption_record_tampered_fields_fail` | **PASS** | Tampered document hash, recipient, event ID, timestamp, and commitment failed verification | Python 3.13.14 | `liboqs` (ML-DSA-65) |

---

### 4. 5-Validator BFT Consensus & Ledger Tamper-Evidence (`tests/test_ledger.py` & `tests/test_validator_consensus.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_five_validators_distinct_keys` | **PASS** | Asserted 5 validator public keys and 5 private keys are pairwise distinct | Python 3.13.14 | `app.ledger` |
| `test_consensus_quorum_sealing` | **PASS** | Block proposed and sealed with quorum threshold ($\ge 3/5$ ML-DSA signatures) | Python 3.13.14 | `app.ledger` |
| `test_merkle_tree_proof_generation_and_verification` | **PASS** | Generated 8-leaf Merkle tree, verified leaf proofs, rejected invalid leaves | Python 3.13.14 | `app.ledger.merkle` |
| `test_ledger_add_transaction_and_chain_verification` | **PASS** | Transaction committed, block mined, entire SHA3-256 chain audit passed | Python 3.13.14 | `app.ledger.chain` |
| `test_ledger_tamper_detection` | **PASS** | Simulated block hash tamper attack detected immediately by chain verifier | Python 3.13.14 | `app.ledger.verifier` |

---

### 5. Fail-Closed Forensic Attribution Pipeline (`tests/test_fail_closed_forensics.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_forensic_analyzer_fail_closed_unwatermarked` | **PASS** | Unwatermarked document returned `VERIFICATION_FAILED` with zero attribution | Python 3.13.14 | `app.forensic` |
| `test_forensic_analyzer_fail_closed_tampered_payload` | **PASS** | Forged watermark returned `VERIFICATION_FAILED` and `attributed_recipient: None` | Python 3.13.14 | `app.forensic` |
| `test_full_pipeline_forensic_attribution_success` | **PASS** | End-to-end send $\to$ decrypt $\to$ leak $\to$ analyze pipeline verified Officer Rahul | Python 3.13.14 | Full Stack |
| `test_forensic_analyzer_fail_closed_tampered_ledger_record` | **PASS** | Recipient binding mismatch on altered block aborted attribution immediately | Python 3.13.14 | `app.forensic`, `app.ledger` |

---

### 6. Strict Privacy Boundary Enforcement (`tests/test_privacy_regression.py`)

| Test Name | Status | Actual Result | Environment | Dependency |
|:---|:---:|:---|:---|:---|
| `test_api_privacy_document_provenance` | **PASS** | Confirmed `GET /api/documents/{id}/provenance` never returns raw fingerprint IDs | Python 3.13.14 | `fastapi.testclient` |
| `test_api_privacy_document_info` | **PASS** | Confirmed `GET /api/documents/{id}` never returns raw fingerprint IDs or session secrets | Python 3.13.14 | `fastapi.testclient` |

---

## Build Verification Summary

- **Backend Bytecode Compilation (`python3 -m compileall backend`):** `SUCCESS` (0 compilation errors).
- **Frontend Production Build (`npm run build`):** `SUCCESS` (Built in 467ms, 0 TypeScript/Vite errors).
- **Automated Test Suite (`pytest /home/user/tests -v`):** `33 PASSED, 0 FAILED`.
