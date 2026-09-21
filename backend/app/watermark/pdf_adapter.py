"""
PDF Forensic Watermarking Adapter.
Implements multi-layer invisible watermark embedding:
1. Covert XMP & Document Catalog metadata structure (/AegisForensicTag) storing encrypted payload.
2. Covert structural object trailer tag.
3. Completely invisible under normal rendering.
"""

import io
import re
import base64
from typing import Optional, Dict, Any
from pypdf import PdfReader, PdfWriter

from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload
from app.crypto.pqc import b64_encode, b64_decode

TRAILER_TAG_MARKER = b"%AEGIS_FORENSIC_FP:"

class PDFWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "PDF-MultiLayer-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".pdf"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["application/pdf"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        b64_payload = b64_encode(packed_payload)

        # 1. Structural / Metadata layer using PyPDF
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
            writer = PdfWriter()
            for page in reader.pages:
                writer.add_page(page)

            # Copy existing metadata and embed authenticated encrypted payload only
            existing_meta = reader.metadata or {}
            custom_meta = {k: v for k, v in existing_meta.items()}
            custom_meta["/AegisForensicTag"] = b64_payload
            # Note: No plaintext fingerprint ID or recipient ID is stored!
            writer.add_metadata(custom_meta)

            out_buf = io.BytesIO()
            writer.write(out_buf)
            base_pdf = out_buf.getvalue()
        except Exception:
            # Fallback if corrupt PDF: append covert trailer tag
            base_pdf = content_bytes

        # 2. Add covert structural trailer tag for resilience against naive object re-compression
        covert_trailer = b"\n" + TRAILER_TAG_MARKER + b64_payload.encode('ascii') + b"%\n"
        final_pdf = base_pdf + covert_trailer

        return final_pdf

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        # Strategy 1: Search Document Catalog Metadata
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
            meta = reader.metadata
            if meta:
                tag = meta.get("/AegisForensicTag")
                if tag:
                    payload_bytes = b64_decode(tag)
                    return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            pass

        # Strategy 2: Search Covert Structural Trailer Tag
        try:
            idx = content_bytes.rfind(TRAILER_TAG_MARKER)
            if idx != -1:
                start = idx + len(TRAILER_TAG_MARKER)
                end = content_bytes.find(b"%", start)
                if end != -1:
                    raw_b64 = content_bytes[start:end].decode('ascii', errors='ignore').strip()
                    payload_bytes = b64_decode(raw_b64)
                    return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            pass

        # Strategy 3: Regex search across raw bytes for embedded Aegis tag
        try:
            match = re.search(rb'/AegisForensicTag\s*\(([^)]+)\)', content_bytes)
            if match:
                raw_b64 = match.group(1).decode('ascii', errors='ignore')
                payload_bytes = b64_decode(raw_b64)
                return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            pass

        return None
