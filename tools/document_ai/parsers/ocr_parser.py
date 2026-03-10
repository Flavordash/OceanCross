"""Image OCR text extraction using Tesseract."""

from pathlib import Path
from typing import List, Union

import pytesseract
from PIL import Image


def extract_text(file_path: Union[str, Path]) -> str:
    """Extract text from an image file using Tesseract OCR."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError("Image not found: %s" % path)

    image = Image.open(path)
    text = pytesseract.image_to_string(image)
    return text.strip()


def extract_text_from_pdf_images(file_path: Union[str, Path]) -> str:
    """Convert PDF pages to images, then OCR each page.

    Useful for scanned PDFs where pdfplumber returns no text.
    Requires poppler (pdf2image dependency).
    """
    from pdf2image import convert_from_path

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError("PDF not found: %s" % path)

    images = convert_from_path(str(path), dpi=300)
    pages_text: List[str] = []
    for img in images:
        text = pytesseract.image_to_string(img)
        if text.strip():
            pages_text.append(text.strip())
    return "\n".join(pages_text)
