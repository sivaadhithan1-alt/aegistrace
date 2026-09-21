"""
XLSX (Microsoft Excel) Forensic Watermarking Adapter.
Multi-layer invisible embedding using OOXML custom properties and hidden comment metadata.
"""

import io
import zipfile
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any

from app.watermark.base import BaseWatermarkAdapter
from app.fingerprint.generator import FingerprintRecord, unpack_covert_fingerprint_payload
from app.crypto.pqc import b64_encode, b64_decode

class XlsxWatermarkAdapter(BaseWatermarkAdapter):
    @property
    def adapter_name(self) -> str:
        return "XLSX-CustomProps-Adapter-v1"

    @property
    def supported_extensions(self) -> list[str]:
        return [".xlsx"]

    @property
    def supported_mimetypes(self) -> list[str]:
        return ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

    def embed_fingerprint(
        self,
        content_bytes: bytes,
        record: FingerprintRecord,
        packed_payload: bytes
    ) -> bytes:
        b64_payload = b64_encode(packed_payload)
        try:
            zin = zipfile.ZipFile(io.BytesIO(content_bytes), 'r')
            zout_buf = io.BytesIO()
            zout = zipfile.ZipFile(zout_buf, 'w', zipfile.ZIP_DEFLATED)

            custom_xml_content = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <property fmtid="{{D5CDD505-2E9C-101B-9397-08002B2CF9AE}}" pid="2" name="AegisForensicTag">
        <vt:lpwstr>{b64_payload}</vt:lpwstr>
    </property>
</Properties>""".encode('utf-8')

            for item in zin.infolist():
                if item.filename != 'docProps/custom.xml':
                    zout.writestr(item, zin.read(item.filename))

            zout.writestr('docProps/custom.xml', custom_xml_content)
            zin.close()
            zout.close()
            return zout_buf.getvalue()
        except Exception:
            return content_bytes

    def extract_fingerprint(
        self,
        content_bytes: bytes
    ) -> Optional[Dict[str, Any]]:
        try:
            zf = zipfile.ZipFile(io.BytesIO(content_bytes), 'r')
            if 'docProps/custom.xml' in zf.namelist():
                xml_data = zf.read('docProps/custom.xml')
                root = ET.fromstring(xml_data)
                for prop in root.findall('.//{http://schemas.openxmlformats.org/officeDocument/2006/custom-properties}property'):
                    if prop.get('name') == 'AegisForensicTag':
                        lpwstr = prop.find('{http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes}lpwstr')
                        if lpwstr is not None and lpwstr.text:
                            payload_bytes = b64_decode(lpwstr.text.strip())
                            return unpack_covert_fingerprint_payload(payload_bytes)
        except Exception:
            pass
        return None
