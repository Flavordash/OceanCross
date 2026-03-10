"""Extract aircraft W&B data from PDF/image files."""

import re
from pathlib import Path
from typing import Dict, List, Optional, Union

from parsers import pdf_parser, ocr_parser
from parsers.regex_patterns import (
    EMPTY_WEIGHT,
    GROSS_WEIGHT,
    USEFUL_LOAD,
    LUGGAGE,
    FUEL_TOTAL,
    FUEL_USABLE,
    FUEL_WEIGHT,
    FUEL_PER_WING,
    OIL_CAPACITY,
    MAX_ENDURANCE,
    V_SPEED,
    REGISTRATION,
    MODEL,
    YEAR,
    MAX_PASSENGERS,
    find_first,
    find_first_float,
)
from schemas.aircraft import AircraftData, VSpeedData, WBStation


# V-speed key normalization
_VSPEED_MAP: Dict[str, str] = {
    "vr": "Vr",
    "vx": "Vx",
    "vy": "Vy",
    "va": "Va",
    "vs": "Vs",
    "vs0": "Vso",
    "vso": "Vso",
    "vfe": "Vfe",
    "vno": "Vno",
    "vne": "Vne",
    "best glide": "best_glide",
    "bestglide": "best_glide",
    "climb": "climb",
    "max crosswind": "max_crosswind",
    "maxcrosswind": "max_crosswind",
}

# W&B station table pattern: station_name | arm | max_weight
_STATION_ROW = re.compile(
    r"([\w\s/&]+?)\s+"
    r"(\d{1,3}\.?\d*)\s+"
    r"(\d{1,4}\.?\d*)",
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


def _extract_v_speeds(text: str) -> VSpeedData:
    """Extract V-speed values from text."""
    data: Dict[str, str] = {}
    for m in V_SPEED.finditer(text):
        key_raw = m.group(1).strip().lower().replace(" ", "")
        field = _VSPEED_MAP.get(key_raw)
        if field:
            data[field] = m.group(2).strip()
    return VSpeedData(**data)


def _extract_stations(text: str) -> List[WBStation]:
    """Extract W&B station rows from text."""
    stations: List[WBStation] = []
    for m in _STATION_ROW.finditer(text):
        name = m.group(1).strip()
        if name.lower() in ("item", "station", "description", "location"):
            continue
        try:
            arm = float(m.group(2))
            max_weight = float(m.group(3))
            stations.append(WBStation(name=name, arm=arm, max_weight=max_weight))
        except ValueError:
            continue
    return stations


def extract(file_path: Union[str, Path]) -> AircraftData:
    """Extract aircraft data from a PDF or image file."""
    path = Path(file_path)
    text = _get_text(path)

    empty_w = find_first_float(EMPTY_WEIGHT, text)
    gross_w = find_first_float(GROSS_WEIGHT, text)

    useful = find_first_float(USEFUL_LOAD, text)
    if useful is None and empty_w and gross_w:
        useful = gross_w - empty_w

    fuel_cap = find_first_float(FUEL_TOTAL, text)
    fuel_usable = find_first_float(FUEL_USABLE, text)
    fuel_weight = find_first_float(FUEL_WEIGHT, text)
    fuel_per_wing = find_first_float(FUEL_PER_WING, text)

    year_str = find_first(YEAR, text)
    year_val = int(year_str) if year_str and year_str.isdigit() else None

    max_pax_str = find_first(MAX_PASSENGERS, text)
    max_pax = int(max_pax_str) if max_pax_str and max_pax_str.isdigit() else None

    return AircraftData(
        registration=find_first(REGISTRATION, text),
        model=find_first(MODEL, text),
        year=year_val,
        empty_weight=empty_w,
        max_takeoff_weight=gross_w,
        useful_load=useful,
        max_passengers=max_pax,
        luggage_capacity_lbs=find_first_float(LUGGAGE, text),
        fuel_capacity_gallons=fuel_cap,
        fuel_usable_gallons=fuel_usable,
        fuel_weight_lbs=fuel_weight,
        fuel_per_wing_gallons=fuel_per_wing,
        oil_capacity_quarts=find_first(OIL_CAPACITY, text),
        max_endurance_hours=find_first_float(MAX_ENDURANCE, text),
        v_speeds=_extract_v_speeds(text),
        stations=_extract_stations(text),
    )
