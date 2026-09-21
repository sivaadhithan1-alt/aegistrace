"""
Tests for Format-Specific Covert Forensic Watermark Adapters.
Tests PDF, DOCX, XLSX, PPTX, TXT, PNG, and WAV adapters.
"""

import io
from app.watermark.factory import watermark_registry
from app.fingerprint.generator import generate_covert_fingerprint

def test_txt_watermark_adapter():
    fp, packed = generate_covert_fingerprint("DOC-TXT", "alice", "bob", "hash1", "txt")
    txt_orig = b"Confidential defense brief.\nParagraph 2 with tactical data."
    adapter = watermark_registry.get_adapter_for_file("brief.txt")
    
    marked = adapter.embed_fingerprint(txt_orig, fp, packed)
    extracted = adapter.extract_fingerprint(marked)
    
    assert extracted is not None
    assert extracted["f"] == fp.fingerprint_id
    assert extracted["r"] == "bob"

def test_pdf_watermark_adapter():
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 700, "Secret Operation PDF")
    c.save()
    pdf_orig = buf.getvalue()

    fp, packed = generate_covert_fingerprint("DOC-PDF", "alice", "charlie", "hash2", "pdf")
    adapter = watermark_registry.get_adapter_for_file("op.pdf")
    
    marked = adapter.embed_fingerprint(pdf_orig, fp, packed)
    extracted = adapter.extract_fingerprint(marked)
    
    assert extracted is not None
    assert extracted["f"] == fp.fingerprint_id
    assert extracted["r"] == "charlie"

def test_docx_watermark_adapter():
    from docx import Document
    doc = Document()
    doc.add_heading("Tactical Directives", 0)
    doc.add_paragraph("Target coordinates and rendezvous point.")
    buf = io.BytesIO()
    doc.save(buf)
    docx_orig = buf.getvalue()

    fp, packed = generate_covert_fingerprint("DOC-DOCX", "alice", "david", "hash3", "docx")
    adapter = watermark_registry.get_adapter_for_file("orders.docx")
    
    marked = adapter.embed_fingerprint(docx_orig, fp, packed)
    extracted = adapter.extract_fingerprint(marked)
    
    assert extracted is not None
    assert extracted["f"] == fp.fingerprint_id
    assert extracted["r"] == "david"

def test_image_png_watermark_adapter():
    from PIL import Image
    img = Image.new("RGB", (200, 200), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_orig = buf.getvalue()

    fp, packed = generate_covert_fingerprint("DOC-PNG", "alice", "bob", "hash4", "png")
    adapter = watermark_registry.get_adapter_for_file("satellite.png")
    
    marked = adapter.embed_fingerprint(png_orig, fp, packed)
    extracted = adapter.extract_fingerprint(marked)
    
    assert extracted is not None
    assert extracted["f"] == fp.fingerprint_id
