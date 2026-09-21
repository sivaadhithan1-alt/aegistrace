"""
Base Watermarking / Steganography Adapter Interface.
Defines format-specific covert embedding and extraction contracts.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from app.fingerprint.generator import FingerprintRecord

class BaseWatermarkAdapter(ABC):
    """
    Abstract Base Class for format-specific covert forensic watermarking.
    """
    @property
    @abstractmethod
    def adapter_name(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_extensions(self) -> list[str]:
        pass

    @property
    @abstractmethod
    def supported_mimetypes(self) -> list[str]:
        pass

    @abstractmethod
    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        """
        Embeds the covert fingerprint into the media file without visible changes.
        Returns the modified forensic copy bytes.
        """
        pass

    @abstractmethod
    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        """
        Extracts and verifies the covert fingerprint payload from the forensic file.
        Returns the recovered dictionary or None if not found/corrupted.
        """
        pass
