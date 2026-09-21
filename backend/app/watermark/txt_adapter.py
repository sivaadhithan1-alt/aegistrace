"""
Text Watermark Adapter.
Embeds covert forensic payloads into plain text using zero-width Unicode steganography.
Completely invisible under standard text viewing and editing.
"""

from typing import Optional, Dict, Any
from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload

# Zero-width Unicode constants
MARKER_START = "\uFEFF\u200D\u200D"
BIT_0 = "\u200B"
BIT_1 = "\u200C"
MARKER_END = "\u200D\u200D\uFEFF"

def bytes_to_zero_width(payload: bytes) -> str:
    bits = "".join(f"{byte:08b}" for byte in payload)
    zw_chars = []
    for b in bits:
        if b == '0':
            zw_chars.append(BIT_0)
        else:
            zw_chars.append(BIT_1)
    return MARKER_START + "".join(zw_chars) + MARKER_END

def zero_width_to_bytes(text: str) -> Optional[bytes]:
    start_idx = text.find(MARKER_START)
    if start_idx == -1:
        return None
    end_idx = text.find(MARKER_END, start_idx + len(MARKER_START))
    if end_idx == -1:
        return None

    raw_bits = text[start_idx + len(MARKER_START):end_idx]
    bit_str = []
    for char in raw_bits:
        if char == BIT_0:
            bit_str.append('0')
        elif char == BIT_1:
            bit_str.append('1')

    if len(bit_str) % 8 != 0 or len(bit_str) == 0:
        return None

    byte_list = []
    for i in range(0, len(bit_str), 8):
        byte_list.append(int("".join(bit_str[i:i+8]), 2))

    return bytes(byte_list)

class TextWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "TXT-ZeroWidth-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".txt", ".md", ".json", ".csv", ".log", ".yaml", ".yml", ".py", ".c", ".cpp"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["text/plain", "text/markdown", "application/json", "text/csv"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        try:
            text = content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            text = content_bytes.decode('latin-1')

        zw_payload = bytes_to_zero_width(packed_payload)
        
        # Inject invisibly at the end of the first paragraph/line or document end
        if "\n" in text:
            parts = text.split("\n", 1)
            watermarked_text = parts[0] + zw_payload + "\n" + parts[1]
        else:
            watermarked_text = text + zw_payload

        return watermarked_text.encode('utf-8')

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        try:
            text = content_bytes.decode('utf-8', errors='ignore')
        except Exception:
            return None

        payload_bytes = zero_width_to_bytes(text)
        if not payload_bytes:
            return None

        try:
            return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            return None
