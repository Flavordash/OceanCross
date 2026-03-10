"""Regex patterns for aviation document field extraction."""

import re
from typing import List, Optional

# ── Weight ────────────────────────────────────────────

EMPTY_WEIGHT = re.compile(
    r"(?:Empty\s*Weight|Basic\s*Empty\s*Weight|BEW)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?",
    re.IGNORECASE,
)

GROSS_WEIGHT = re.compile(
    r"(?:Max(?:imum)?\s*(?:Takeoff|Gross|Ramp)\s*Weight|MTOW|MGW|Max\s*T/?O)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?",
    re.IGNORECASE,
)

USEFUL_LOAD = re.compile(
    r"(?:Useful\s*Load)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?",
    re.IGNORECASE,
)

LUGGAGE = re.compile(
    r"(?:Luggage|Baggage)\s*(?:Capacity|Area|Compartment|Max)?"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?",
    re.IGNORECASE,
)

# ── Fuel ──────────────────────────────────────────────

FUEL_TOTAL = re.compile(
    r"(?:Fuel\s*Capacity|Total\s*Fuel)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?",
    re.IGNORECASE,
)

FUEL_USABLE = re.compile(
    r"(?:Usable\s*Fuel|Fuel\s*Usable)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?",
    re.IGNORECASE,
)

FUEL_WEIGHT = re.compile(
    r"(?:Fuel\s*Weight|Weight\s*of\s*Fuel)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?",
    re.IGNORECASE,
)

FUEL_PER_WING = re.compile(
    r"(?:(?:Per|Each)\s*(?:Wing|Tank)\s*(?:Tank)?|Wing\s*Tank)"
    r"[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?",
    re.IGNORECASE,
)

# ── Oil & Endurance ───────────────────────────────────

OIL_CAPACITY = re.compile(
    r"(?:Oil\s*Capacity|Engine\s*Oil)"
    r"[:\s]*([\d.]+\s*(?:[-–to]+\s*[\d.]+)?\s*(?:qts?|quarts?))",
    re.IGNORECASE,
)

MAX_ENDURANCE = re.compile(
    r"(?:Max(?:imum)?\s*Endurance|Endurance)"
    r"[:\s]*(\d[\d]*\.?\d*)\s*(?:hrs?|hours?)?",
    re.IGNORECASE,
)

# ── V-Speeds ─────────────────────────────────────────

V_SPEED = re.compile(
    r"(V[a-z]{0,3}|Vs[o0]|Vn[eo]|Vf[e]|Best\s*Glide|Max\s*Crosswind|Climb)"
    r"[:\s=]+(\d{2,3})\s*(?:K[IT]?AS|kts?|knots?|mph)?",
    re.IGNORECASE,
)

# ── General ───────────────────────────────────────────

REGISTRATION = re.compile(
    r"\b(N\d{1,5}[A-Z]{0,2})\b",
)

MODEL = re.compile(
    r"(?:Model|Aircraft\s*Type|Type)"
    r"[:\s]+([A-Za-z0-9][\w\s\-/]{2,30})",
    re.IGNORECASE,
)

YEAR = re.compile(
    r"(?:Year|Manufactured|Mfg)"
    r"[:\s]+(\d{4})",
    re.IGNORECASE,
)

MAX_PASSENGERS = re.compile(
    r"(?:Max(?:imum)?\s*(?:Passengers|Seats|Occupants|Pax))"
    r"[:\s]*(\d{1,2})",
    re.IGNORECASE,
)

ARM = re.compile(
    r"(?:Arm|Moment\s*Arm|Station)"
    r"[:\s]*(\d{1,3}\.?\d*)\s*(?:in(?:ches)?)?",
    re.IGNORECASE,
)

# ── Dates ─────────────────────────────────────────────

DATE_PATTERNS = [
    re.compile(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})"),                     # MM/DD/YYYY
    re.compile(r"(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})"),                       # YYYY-MM-DD
    re.compile(r"([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})", re.IGNORECASE),   # Jan 15, 2025
    re.compile(r"(\d{1,2}\s+[A-Z][a-z]+\.?\s+\d{4})", re.IGNORECASE),     # 15 Jan 2025
]

# ── Medical / Certificate ────────────────────────────

MEDICAL_CLASS = re.compile(
    r"(?:Class|Medical\s*Class)"
    r"[:\s]*((?:1st|2nd|3rd|First|Second|Third|BasicMed|Basic\s*Med)(?:\s*Class)?)",
    re.IGNORECASE,
)

CERTIFICATE_NUMBER = re.compile(
    r"(?:Certificate\s*(?:Number|No\.?|#)|Cert\.?\s*(?:No\.?|#))"
    r"[:\s]*([A-Z0-9\-]+)",
    re.IGNORECASE,
)

# ── Cost / Invoice ───────────────────────────────────

DOLLAR_AMOUNT = re.compile(
    r"\$\s*(\d[\d,]*\.?\d{0,2})",
)

PART_NUMBER = re.compile(
    r"(?:Part\s*(?:Number|No\.?|#)|P/?N)"
    r"[:\s]*([A-Z0-9\-]+)",
    re.IGNORECASE,
)

SUPPLIER = re.compile(
    r"(?:Supplier|Vendor|Sold\s*By|From)"
    r"[:\s]+(.+?)(?:\n|$)",
    re.IGNORECASE,
)


# ── Helpers ───────────────────────────────────────────

def parse_float(value: str) -> Optional[float]:
    """Clean and parse a numeric string to float."""
    try:
        cleaned = value.replace(",", "").strip()
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def find_first(pattern: re.Pattern, text: str) -> Optional[str]:
    """Return the first capture group match or None."""
    m = pattern.search(text)
    return m.group(1).strip() if m else None


def find_first_float(pattern: re.Pattern, text: str) -> Optional[float]:
    """Return the first match parsed as float, or None."""
    raw = find_first(pattern, text)
    return parse_float(raw) if raw else None


def find_all_dates(text: str) -> List[str]:
    """Find all date-like strings in the text."""
    dates: List[str] = []
    for pat in DATE_PATTERNS:
        dates.extend(m.group(1) for m in pat.finditer(text))
    return dates
