"""Extract pilot credential data from PDF/image files."""

import re
from pathlib import Path
from typing import Dict, List, Optional, Union

from parsers import pdf_parser, ocr_parser
from parsers.regex_patterns import (
    MEDICAL_CLASS,
    CERTIFICATE_NUMBER,
    find_first,
    find_all_dates,
)
from schemas.credential import CredentialData


# Document type detection keywords
_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "medical_certificate": ["medical certificate", "medical class", "faa medical"],
    "renters_insurance": ["renter", "insurance", "policy", "coverage", "premium"],
    "pilot_certificate": ["pilot certificate", "airman certificate", "certificate number"],
}

# Name patterns
_NAME_PATTERN = re.compile(
    r"(?:Name|Holder|Applicant|Insured|Pilot)"
    r"[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
    re.IGNORECASE,
)

# Medical class normalization
_CLASS_MAP: Dict[str, str] = {
    "1st": "1st_class",
    "first": "1st_class",
    "first class": "1st_class",
    "2nd": "2nd_class",
    "second": "2nd_class",
    "second class": "2nd_class",
    "3rd": "3rd_class",
    "third": "3rd_class",
    "third class": "3rd_class",
    "basicmed": "basicmed",
    "basic med": "basicmed",
}


def _get_text(file_path: Path) -> str:
    """Get text from file, using PDF parser or OCR based on extension."""
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        text = pdf_parser.extract_text(file_path)
        if len(text.strip()) < 50:
            text = ocr_parser.extract_text_from_pdf_images(file_path)
        return text
    elif suffix in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        return ocr_parser.extract_text(file_path)
    else:
        raise ValueError("Unsupported file type: %s" % suffix)


def _detect_type(text: str) -> Optional[str]:
    """Detect document type from content keywords."""
    text_lower = text.lower()
    for doc_type, keywords in _TYPE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return doc_type
    return None


def _normalize_class(raw: str) -> Optional[str]:
    """Normalize medical class string to enum value."""
    cleaned = raw.lower().replace("class", "").strip()
    return _CLASS_MAP.get(cleaned) or _CLASS_MAP.get(raw.lower().strip())


def extract(file_path: Union[str, Path]) -> CredentialData:
    """Extract credential data from a PDF or image file."""
    path = Path(file_path)
    text = _get_text(path)

    doc_type = _detect_type(text)

    name_match = _NAME_PATTERN.search(text)
    holder_name = name_match.group(1).strip() if name_match else None

    dates = find_all_dates(text)
    expiry = dates[-1] if dates else None

    medical_raw = find_first(MEDICAL_CLASS, text)
    medical_class = _normalize_class(medical_raw) if medical_raw else None

    cert_number = find_first(CERTIFICATE_NUMBER, text)

    return CredentialData(
        document_type=doc_type,
        holder_name=holder_name,
        expiry_date=expiry,
        medical_class=medical_class,
        certificate_number=cert_number,
    )
