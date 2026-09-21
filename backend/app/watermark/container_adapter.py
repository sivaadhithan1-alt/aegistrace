"""
Container-Level Fallback Adapter for arbitrary binary formats (ZIP, EXE, binaries, etc.).
Preserves original bytes exactly and records provenance at the container/ledger level.
"""

from typing import Optional, Dict, Any
from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload

class ContainerWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "Generic-Container-Provenance-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return ["*"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["*/*"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        # For arbitrary files, preserve file exact bytes but append container forensic trailer tag
        marker = b"\n%AEGIS_GENERIC_CONTAINER_FP:"
        return content_bytes + marker + packed_payload + b"%\n"

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        marker = b"%AEGIS_GENERIC_CONTAINER_FP:"
        pos = content_bytes.rfind(marker)
        if pos != -1:
            start = pos + len(marker)
            end = content_bytes.find(b"%\n", start)
            if end != -1:
                data = content_bytes[start:end]
                try:
                    return unpack_covert_fingerprint_payload(data)
                except Exception:
                    pass
        return None
