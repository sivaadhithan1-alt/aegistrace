"""
Audio Forensic Watermarking Adapter (WAV / Audio).
Embeds covert fingerprint into WAV sample LSBs and custom RIFF chunks.
"""

import io
import struct
import wave
from typing import Optional, Dict, Any

from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload

class AudioWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "Audio-WAV-LSB-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".wav", ".wave", ".aiff"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["audio/wav", "audio/x-wav", "audio/wave"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        try:
            r = wave.open(io.BytesIO(content_bytes), 'rb')
            params = r.getparams()
            frames = bytearray(r.readframes(r.getnframes()))
            r.close()

            full_embed_bytes = len(packed_payload).to_bytes(4, 'big') + packed_payload
            bits_to_embed = "".join(f"{b:08b}" for b in full_embed_bytes)

            if len(bits_to_embed) <= len(frames):
                for i, bit in enumerate(bits_to_embed):
                    if bit == '1':
                        frames[i] |= 1
                    else:
                        frames[i] &= ~1

                out_buf = io.BytesIO()
                w = wave.open(out_buf, 'wb')
                w.setparams(params)
                w.writeframes(bytes(frames))
                w.close()
                base_wav = out_buf.getvalue()
            else:
                base_wav = content_bytes
        except Exception:
            base_wav = content_bytes

        # Also append custom RIFF chunk 'aegF'
        try:
            if base_wav.startswith(b"RIFF") and b"WAVE" in base_wav[:12]:
                chunk_id = b"aegF"
                chunk_data = packed_payload
                chunk_size = len(chunk_data).to_bytes(4, 'little')
                # Append to end of RIFF container
                return base_wav + chunk_id + chunk_size + chunk_data
        except Exception:
            pass

        return base_wav

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        # Strategy 1: Check RIFF chunk 'aegF'
        try:
            pos = content_bytes.find(b"aegF")
            if pos != -1:
                size = int.from_bytes(content_bytes[pos+4:pos+8], 'little')
                if 0 < size < 10_000:
                    data = content_bytes[pos+8:pos+8+size]
                    return unpack_covert_fingerprint_payload(data)
        except Exception:
            pass

        # Strategy 2: LSB audio frames extraction
        try:
            r = wave.open(io.BytesIO(content_bytes), 'rb')
            frames = bytearray(r.readframes(r.getnframes()))
            r.close()

            if len(frames) >= 32:
                len_bits = "".join(str(frames[i] & 1) for i in range(32))
                payload_len = int(len_bits, 2)
                total_bits = (4 + payload_len) * 8
                if 0 < payload_len < 10_000 and total_bits <= len(frames):
                    all_bits = "".join(str(frames[i] & 1) for i in range(total_bits))
                    byte_list = []
                    for i in range(32, total_bits, 8):
                        byte_list.append(int(all_bits[i:i+8], 2))
                    return unpack_covert_fingerprint_payload(bytes(byte_list))
        except Exception:
            pass

        return None
