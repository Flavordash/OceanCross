"""PDF text and table extraction using pdfplumber."""

from pathlib import Path
from typing import List, Optional, Union

import pdfplumber


def extract_text(file_path: Union[str, Path]) -> str:
    """Extract all text from a PDF file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError("PDF not found: %s" % path)

    pages_text: List[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
    return "\n".join(pages_text)


def extract_tables(file_path: Union[str, Path]) -> List[List[List[Optional[str]]]]:
    """Extract all tables from a PDF file.

    Returns a list of tables, where each table is a list of rows,
    and each row is a list of cell values.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError("PDF not found: %s" % path)

    all_tables: List[List[List[Optional[str]]]] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                all_tables.extend(tables)
    return all_tables


def extract_all(file_path: Union[str, Path]) -> dict:
    """Extract both text and tables from a PDF."""
    return {
        "text": extract_text(file_path),
        "tables": extract_tables(file_path),
    }
