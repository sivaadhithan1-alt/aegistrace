"""
Watermark Adapter Registry and Format Detection Factory.
Dispatches media to appropriate format-specific covert steganography adapter.
"""

from pathlib import Path
from typing import Optional, Dict, Any, List

from app.watermark.base import BaseWatermarkAdapter
from app.watermark.pdf_adapter import PDFWatermarkAdapter
from app.watermark.docx_adapter import DocxWatermarkAdapter
from app.watermark.xlsx_adapter import XlsxWatermarkAdapter
from app.watermark.pptx_adapter import PptxWatermarkAdapter
from app.watermark.txt_adapter import TextWatermarkAdapter
from app.watermark.image_adapter import ImageWatermarkAdapter
from app.watermark.audio_adapter import AudioWatermarkAdapter
from app.watermark.container_adapter import ContainerWatermarkAdapter

class WatermarkAdapterRegistry:
    def __init__(self):
        self.adapters: List[BaseWatermarkAdapter] = [
            PDFWatermarkAdapter(),
            DocxWatermarkAdapter(),
            XlsxWatermarkAdapter(),
            PptxWatermarkAdapter(),
            ImageWatermarkAdapter(),
            AudioWatermarkAdapter(),
            TextWatermarkAdapter(),
            ContainerWatermarkAdapter()  # Catch-all fallback
        ]

    def get_adapter_for_file(self, filename: str, mime_type: str = "") -> BaseWatermarkAdapter:
        """
        Selects the most suitable watermark adapter based on extension and mime_type.
        """
        ext = Path(filename).suffix.lower()
        mime = mime_type.lower()

        for adapter in self.adapters:
            if ext in adapter.supported_extensions or mime in adapter.supported_mimetypes:
                return adapter

        return self.adapters[-1]  # Return Container fallback

    def extract_from_any(self, content_bytes: bytes, filename: str = "") -> Optional[Dict[str, Any]]:
        """
        Attempts extraction using the primary detected adapter, and falls back to trying all adapters if needed.
        """
        primary = self.get_adapter_for_file(filename)
        result = primary.extract_fingerprint(content_bytes)
        if result:
            return result

        # Fallback: scan all adapters
        for adapter in self.adapters:
            if adapter == primary:
                continue
            try:
                res = adapter.extract_fingerprint(content_bytes)
                if res:
                    return res
            except Exception:
                continue

        return None

# Global adapter registry
watermark_registry = WatermarkAdapterRegistry()
