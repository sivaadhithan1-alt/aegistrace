"""
Performance and Latency Benchmarks for AegisTrace PQC Architecture.
Measures cryptographic operations, envelope encryption, watermarking, and ledger consensus.
"""

import time
import os
import io
from app.crypto.pqc import kem_engine, sig_engine
from app.crypto.envelope import encrypt_payload_aes_gcm, decrypt_payload_aes_gcm
from app.fingerprint.generator import generate_covert_fingerprint
from app.watermark.factory import watermark_registry
from app.ledger.chain import immutable_ledger
from app.identity.manager import identity_manager

def run_performance_benchmarks():
    print("\n=======================================================")
    print("  AEGISTRACE PQC SYSTEM PERFORMANCE BENCHMARK SUITE    ")
    print("=======================================================")

    # 1. PQC ML-KEM-768 Benchmark
    t0 = time.perf_counter()
    pk, sk = kem_engine.generate_keypair()
    t_kem_gen = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    ct, ss1 = kem_engine.encapsulate(pk)
    t_kem_enc = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    ss2 = kem_engine.decapsulate(sk, ct)
    t_kem_dec = (time.perf_counter() - t0) * 1000

    print(f"[*] ML-KEM-768 KeyGen:        {t_kem_gen:6.2f} ms")
    print(f"[*] ML-KEM-768 Encapsulate:   {t_kem_enc:6.2f} ms")
    print(f"[*] ML-KEM-768 Decapsulate:   {t_kem_dec:6.2f} ms")

    # 2. PQC ML-DSA-65 Benchmark
    t0 = time.perf_counter()
    vk, s_sk = sig_engine.generate_keypair()
    t_dsa_gen = (time.perf_counter() - t0) * 1000

    msg = b"Canonical Decryption Record Payload Hash"
    t0 = time.perf_counter()
    sig = sig_engine.sign(s_sk, msg)
    t_dsa_sign = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    val = sig_engine.verify(vk, msg, sig)
    t_dsa_ver = (time.perf_counter() - t0) * 1000

    print(f"[*] ML-DSA-65 KeyGen:         {t_dsa_gen:6.2f} ms")
    print(f"[*] ML-DSA-65 Sign:           {t_dsa_sign:6.2f} ms")
    print(f"[*] ML-DSA-65 Verify:         {t_dsa_ver:6.2f} ms")

    # 3. AES-256-GCM AEAD Throughput (10 MB payload)
    data_10mb = os.urandom(10 * 1024 * 1024)
    key_32 = os.urandom(32)

    t0 = time.perf_counter()
    ct_gcm, iv, tag = encrypt_payload_aes_gcm(data_10mb, key_32)
    t_gcm_enc = time.perf_counter() - t0

    t0 = time.perf_counter()
    dec_gcm = decrypt_payload_aes_gcm(ct_gcm, key_32, iv, tag)
    t_gcm_dec = time.perf_counter() - t0

    throughput_enc = (10 / t_gcm_enc)
    throughput_dec = (10 / t_gcm_dec)
    print(f"[*] AES-256-GCM Encrypt (10MB): {t_gcm_enc*1000:6.2f} ms ({throughput_enc:.1f} MB/s)")
    print(f"[*] AES-256-GCM Decrypt (10MB): {t_gcm_dec*1000:6.2f} ms ({throughput_dec:.1f} MB/s)")

    # 4. Fingerprint Embedding & Extraction
    fp_rec, packed = generate_covert_fingerprint("DOC-BENCH", "alice", "bob", "hash", "txt")
    txt_content = b"Defense operation plan text.\n" * 1000
    adapter = watermark_registry.get_adapter_for_file("bench.txt")

    t0 = time.perf_counter()
    marked_txt = adapter.embed_fingerprint(txt_content, fp_rec, packed)
    t_embed = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    extracted = adapter.extract_fingerprint(marked_txt)
    t_extract = (time.perf_counter() - t0) * 1000

    print(f"[*] Watermark Embedding (TXT):{t_embed:6.2f} ms")
    print(f"[*] Watermark Extraction (TXT):{t_extract:6.2f} ms")

    # 5. Ledger BFT Consensus & Commit Time
    tx_dummy = {"type": "BENCHMARK_PROVENANCE", "data": "test"}
    t0 = time.perf_counter()
    block, _, _ = immutable_ledger.add_transaction_and_mine_block(tx_dummy)
    t_ledger = (time.perf_counter() - t0) * 1000

    print(f"[*] 5-Node BFT Consensus + Commit:{t_ledger:6.2f} ms (Height: #{block.header.block_height})")
    print("=======================================================\n")

if __name__ == "__main__":
    run_performance_benchmarks()
