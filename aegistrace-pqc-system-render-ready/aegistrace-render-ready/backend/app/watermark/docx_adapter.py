"""
DOCX Forensic Watermarking Adapter.
Embeds covert authenticated encrypted watermark payload into Word document structure:
1. OOXML custom property `AegisForensicTag` (contains AES-GCM encrypted payload).
2. ZIP comment covert forensic trailer.
Zero plaintext recipient or fingerprint ID leaks.
"""

import io
import zipfile
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any

from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload
from app.crypto.pqc import b64_encode, b64_decode

class DocxWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "Docx-OOXML-Covert-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".docx", ".docm"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-word.document.macroEnabled.12"
        ]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        b64_payload = b64_encode(packed_payload)
        out_buf = io.BytesIO()

        try:
            with zipfile.ZipFile(io.BytesIO(content_bytes), 'r') as in_zip:
                with zipfile.ZipFile(out_buf, 'w', compression=zipfile.ZIP_DEFLATED) as out_zip:
                    # Copy all existing files except custom.xml which we augment
                    custom_xml_content = None
                    for item in in_zip.infolist():
                        if item.filename == "docProps/custom.xml":
                            custom_xml_content = in_zip.read(item.filename)
                        else:
                            out_zip.writestr(item, in_zip.read(item.filename))

                    # Construct or update docProps/custom.xml
                    if custom_xml_content:
                        root = ET.fromstring(custom_xml_content)
                    else:
                        root = ET.Element(
                            "{http://schemas.openxmlformats.org/officeDocument/2006/custom-properties}Properties",
                            {
                                "xmlns:vt": "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"
                            }
                        )

                    # Add AegisForensicTag containing encrypted base64 payload
                    prop_el = ET.SubElement(root, "{http://schemas.openxmlformats.org/officeDocument/2006/custom-properties}property")
                    prop_el.set("fmtid", "{D5CDD505-2E9C-101B-9397-08002B2CF9AE}")
                    prop_el.set("pid", str(len(root) + 2))
                    prop_el.set("name", "AegisForensicTag")
                    val_el = ET.SubElement(prop_el, "{http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes}lpwstr")
                    val_el.text = b64_payload

                    custom_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
                    out_zip.writestr("docProps/custom.xml", custom_bytes)

                    # Also set ZIP comment as secondary covert redundancy
                    out_zip.comment = b"AEGIS_FP:" + b64_payload.encode('ascii')

            return out_buf.getvalue()
        except Exception:
            # Fallback
            return content_bytes

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        # Strategy 1: Check OOXML custom properties
        try:
            with zipfile.ZipFile(io.BytesIO(content_bytes), 'r') as zf:
                if "docProps/custom.xml" in zf.namelist():
                    custom_xml = zf.read("docProps/custom.xml")
                    root = ET.fromstring(custom_xml)
                    for prop in root:
                        name = prop.attrib.get("name")
                        if name == "AegisForensicTag":
                            for child in prop:
                                if child.text:
                                    payload_bytes = b64_decode(child.text.strip())
                                    return unpack_covert_fingerprint_payload(payload_bytes)
                # Strategy 2: Check ZIP comment
                if zf.comment and zf.comment.startswith(b"AEGIS_FP:"):
                    raw_b64 = zf.comment[len(b"AEGIS_FP:"):].decode('ascii', errors='ignore').strip()
                    payload_bytes = b64_decode(raw_b64)
                    return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            pass

        return None
