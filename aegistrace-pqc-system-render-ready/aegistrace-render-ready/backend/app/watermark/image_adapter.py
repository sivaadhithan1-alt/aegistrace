"""
Image Forensic Watermarking Adapter (PNG & JPEG).
Implements spatial LSB steganography and custom ancillary chunk embedding.
Visually indistinguishable from the original image.
"""

import io
import zlib
import struct
from typing import Optional, Dict, Any
from PIL import Image

from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload
from app.crypto.pqc import b64_encode, b64_decode

class ImageWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "Image-LSB-Chunk-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".png", ".jpg", ".jpeg", ".webp", ".bmp"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["image/png", "image/jpeg", "image/webp", "image/bmp"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        img_buf = io.BytesIO(content_bytes)
        try:
            img = Image.open(img_buf)
            img_format = (img.format or "PNG").upper()
        except Exception:
            img_format = "PNG"

        # 1. Spatial LSB Embedding on image pixels
        try:
            img = Image.open(io.BytesIO(content_bytes))
            mode = img.mode
            if mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "transparency" in img.info else "RGB")
            
            pixels = bytearray(img.tobytes())
            
            # Bits to embed: 32-bit length + packed_payload
            full_embed_bytes = len(packed_payload).to_bytes(4, 'big') + packed_payload
            bits_to_embed = "".join(f"{b:08b}" for b in full_embed_bytes)

            if len(bits_to_embed) <= len(pixels):
                for i, bit in enumerate(bits_to_embed):
                    if bit == '1':
                        pixels[i] |= 1
                    else:
                        pixels[i] &= ~1
                
                watermarked_img = Image.frombytes(img.mode, img.size, bytes(pixels))
                out_buf = io.BytesIO()
                
                # Save preserving format if PNG or BMP
                save_fmt = "PNG" if img_format in ("PNG", "WEBP") else img_format
                if save_fmt == "JPEG":
                    watermarked_img = watermarked_img.convert("RGB")
                    watermarked_img.save(out_buf, format="JPEG", quality=95)
                else:
                    watermarked_img.save(out_buf, format="PNG")
                
                base_bytes = out_buf.getvalue()
            else:
                base_bytes = content_bytes
        except Exception:
            base_bytes = content_bytes

        # 2. Add PNG custom chunk if PNG or fallback marker
        if base_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            # Insert custom ancillary PNG chunk 'fORe' (forensic record)
            chunk_type = b"fORe"
            chunk_data = packed_payload
            chunk_crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
            png_chunk = len(chunk_data).to_bytes(4, 'big') + chunk_type + chunk_data + chunk_crc.to_bytes(4, 'big')

            # Insert before IEND chunk
            iend_idx = base_bytes.rfind(b"IEND")
            if iend_idx != -1:
                insert_pos = iend_idx - 4
                final_bytes = base_bytes[:insert_pos] + png_chunk + base_bytes[insert_pos:]
                return final_bytes

        # For JPEG: append covert APP15 marker
        if base_bytes.startswith(b"\xff\xd8"):
            app15_marker = b"\xff\xef"
            b64_str = b64_encode(packed_payload).encode('ascii')
            app15_len = (len(b64_str) + 2).to_bytes(2, 'big')
            final_bytes = base_bytes[:2] + app15_marker + app15_len + b64_str + base_bytes[2:]
            return final_bytes

        return base_bytes

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        # Strategy 1: Check PNG custom 'fORe' chunk
        if content_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            pos = 8
            while pos < len(content_bytes) - 8:
                length = int.from_bytes(content_bytes[pos:pos+4], 'big')
                chunk_type = content_bytes[pos+4:pos+8]
                if chunk_type == b"fORe":
                    chunk_data = content_bytes[pos+8:pos+8+length]
                    try:
                        return unpack_covert_fingerprint_payload(chunk_data)
                    except Exception:
                        pass
                pos += 12 + length

        # Strategy 2: Check JPEG APP15 marker
        if content_bytes.startswith(b"\xff\xd8"):
            pos = 2
            while pos < len(content_bytes) - 4:
                if content_bytes[pos:pos+2] == b"\xff\xef":
                    length = int.from_bytes(content_bytes[pos+2:pos+4], 'big')
                    data = content_bytes[pos+4:pos+2+length]
                    try:
                        payload_bytes = b64_decode(data.decode('ascii'))
                        return unpack_covert_fingerprint_payload(payload_bytes)
                    except Exception:
                        pass
                pos += 1

        # Strategy 3: Spatial LSB extraction
        try:
            img = Image.open(io.BytesIO(content_bytes))
            pixels = bytearray(img.tobytes())
            
            # Read 32-bit length first (32 pixels)
            if len(pixels) >= 32:
                len_bits = "".join(str(pixels[i] & 1) for i in range(32))
                payload_len = int(len_bits, 2)
                
                total_bits = (4 + payload_len) * 8
                if 0 < payload_len < 10_000 and total_bits <= len(pixels):
                    all_bits = "".join(str(pixels[i] & 1) for i in range(total_bits))
                    byte_list = []
                    for i in range(32, total_bits, 8):
                        byte_list.append(int(all_bits[i:i+8], 2))
                    
                    recovered_bytes = bytes(byte_list)
                    return unpack_covert_fingerprint_payload(recovered_bytes)
        except Exception:
            pass

        return None
