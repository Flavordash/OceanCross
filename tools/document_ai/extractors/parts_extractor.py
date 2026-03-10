"""Extract parts order data from PDF/image invoice files."""

import re
from pathlib import Path
from typing import List, Optional, Union

from parsers import pdf_parser, ocr_parser
from parsers.regex_patterns import (
    DOLLAR_AMOUNT,
    PART_NUMBER,
    SUPPLIER,
    find_first,
    find_all_dates,
)
from schemas.parts_order import PartsOrderData

# Part name pattern
_PART_NAME = re.compile(
    r"(?:Description|Item|Part\s*Name)"
    r"[:\s]+(.+?)(?:\n|$)",
    re.IGNORECASE,
)


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


def extract(file_path: Union[str, Path]) -> PartsOrderData:
    """Extract parts order data from a PDF or image file."""
    path = Path(file_path)
    text = _get_text(path)

    part_name = find_first(_PART_NAME, text)
    part_number = find_first(PART_NUMBER, text)
    supplier = find_first(SUPPLIER, text)

    dates = find_all_dates(text)
    order_date = dates[0] if len(dates) >= 1 else None
    estimated_arrival = dates[1] if len(dates) >= 2 else None

    amounts = DOLLAR_AMOUNT.findall(text)
    cost = None
    if amounts:
        parsed: List[float] = []
        for a in amounts:
            try:
                parsed.append(float(a.replace(",", "")))
            except ValueError:
                continue
        if parsed:
            cost = max(parsed)

    return PartsOrderData(
        part_name=part_name,
        part_number=part_number,
        supplier=supplier,
        order_date=order_date,
        estimated_arrival=estimated_arrival,
        cost=cost,
    )
