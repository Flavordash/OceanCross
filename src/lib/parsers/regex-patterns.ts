// ── Aviation document regex patterns (TypeScript mirror of Python) ──

// Weight
export const EMPTY_WEIGHT =
  /(?:Empty\s*Weight|Basic\s*Empty\s*Weight|BEW)[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?/i;

export const GROSS_WEIGHT =
  /(?:Max(?:imum)?\s*(?:Takeoff|Gross|Ramp)\s*Weight|MTOW|MGW|Max\s*T\/?O)[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?/i;

export const USEFUL_LOAD =
  /(?:Useful\s*Load)[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?/i;

export const LUGGAGE =
  /(?:Luggage|Baggage)\s*(?:Capacity|Area|Compartment|Max)?[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?/i;

// Fuel
export const FUEL_TOTAL =
  /(?:Fuel\s*Capacity|Total\s*Fuel)[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?/i;

export const FUEL_USABLE =
  /(?:Usable\s*Fuel|Fuel\s*Usable)[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?/i;

export const FUEL_WEIGHT =
  /(?:Fuel\s*Weight|Weight\s*of\s*Fuel)[:\s]*(\d[\d,]*\.?\d*)\s*(?:lbs?|pounds?)?/i;

export const FUEL_PER_WING =
  /(?:(?:Per|Each)\s*(?:Wing|Tank)\s*(?:Tank)?|Wing\s*Tank)[:\s]*(\d[\d,]*\.?\d*)\s*(?:gal(?:lons?)?|USG)?/i;

// Oil & Endurance
export const OIL_CAPACITY =
  /(?:Oil\s*Capacity|Engine\s*Oil)[:\s]*([\d.]+\s*(?:[-–to]+\s*[\d.]+)?\s*(?:qts?|quarts?))/i;

export const MAX_ENDURANCE =
  /(?:Max(?:imum)?\s*Endurance|Endurance)[:\s]*(\d[\d]*\.?\d*)\s*(?:hrs?|hours?)?/i;

// V-Speeds
export const V_SPEED =
  /(V[a-z]{0,3}|Vs[o0]|Vn[eo]|Vf[e]|Best\s*Glide|Max\s*Crosswind|Climb)[:\s=]+(\d{2,3})\s*(?:K[IT]?AS|kts?|knots?|mph)?/gi;

// General
export const REGISTRATION = /\b(N\d{1,5}[A-Z]{0,2})\b/;

export const MODEL =
  /(?:Model|Aircraft\s*Type|Type)[:\s]+([A-Za-z0-9][\w\s\-/]{2,30})/i;

export const YEAR = /(?:Year|Manufactured|Mfg)[:\s]+(\d{4})/i;

export const MAX_PASSENGERS =
  /(?:Max(?:imum)?\s*(?:Passengers|Seats|Occupants|Pax))[:\s]*(\d{1,2})/i;

// Dates
export const DATE_PATTERNS = [
  /(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/g,
  /(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})/g,
  /([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/gi,
  /(\d{1,2}\s+[A-Z][a-z]+\.?\s+\d{4})/gi,
];

// Medical / Certificate
export const MEDICAL_CLASS =
  /(?:Class|Medical\s*Class)[:\s]*((?:1st|2nd|3rd|First|Second|Third|BasicMed|Basic\s*Med)(?:\s*Class)?)/i;

export const CERTIFICATE_NUMBER =
  /(?:Certificate\s*(?:Number|No\.?|#)|Cert\.?\s*(?:No\.?|#))[:\s]*([A-Z0-9\-]+)/i;

// Cost / Invoice
export const DOLLAR_AMOUNT = /\$\s*(\d[\d,]*\.?\d{0,2})/g;

export const PART_NUMBER =
  /(?:Part\s*(?:Number|No\.?|#)|P\/?N)[:\s]*([A-Z0-9\-]+)/i;

export const SUPPLIER =
  /(?:Supplier|Vendor|Sold\s*By|From)[:\s]+(.+?)(?:\n|$)/i;

// ── Helpers ──

export function parseFloat_(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function findFirst(
  pattern: RegExp,
  text: string
): string | null {
  const m = pattern.exec(text);
  return m ? m[1].trim() : null;
}

export function findFirstFloat(
  pattern: RegExp,
  text: string
): number | null {
  const raw = findFirst(pattern, text);
  return raw ? parseFloat_(raw) : null;
}

export function findAllDates(text: string): string[] {
  const dates: string[] = [];
  for (const pat of DATE_PATTERNS) {
    const re = new RegExp(pat.source, pat.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      dates.push(m[1]);
    }
  }
  return dates;
}

// V-speed normalization map
const VSPEED_MAP: Record<string, string> = {
  vr: "Vr",
  vx: "Vx",
  vy: "Vy",
  va: "Va",
  vs: "Vs",
  vs0: "Vso",
  vso: "Vso",
  vfe: "Vfe",
  vno: "Vno",
  vne: "Vne",
  "best glide": "best_glide",
  bestglide: "best_glide",
  climb: "climb",
  "max crosswind": "max_crosswind",
  maxcrosswind: "max_crosswind",
};

export function extractVSpeeds(
  text: string
): Record<string, string> {
  const speeds: Record<string, string> = {};
  const re = new RegExp(V_SPEED.source, V_SPEED.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1].trim().toLowerCase().replace(/\s+/g, "");
    const field = VSPEED_MAP[key];
    if (field) speeds[field] = m[2].trim();
  }
  return speeds;
}

// Station row extraction
const STATION_ROW =
  /([\w\s/&]+?)\s+(\d{1,3}\.?\d*)\s+(\d{1,4}\.?\d*)/g;

export interface WBStation {
  name: string;
  arm: number;
  max_weight: number;
}

export function extractStations(text: string): WBStation[] {
  const stations: WBStation[] = [];
  const re = new RegExp(STATION_ROW.source, STATION_ROW.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (["item", "station", "description", "location"].includes(name.toLowerCase()))
      continue;
    const arm = parseFloat(m[2]);
    const maxW = parseFloat(m[3]);
    if (!isNaN(arm) && !isNaN(maxW)) {
      stations.push({ name, arm, max_weight: maxW });
    }
  }
  return stations;
}

// ── Extraction functions ──

export interface AircraftExtracted {
  registration: string | null;
  model: string | null;
  year: number | null;
  empty_weight: number | null;
  max_takeoff_weight: number | null;
  useful_load: number | null;
  max_passengers: number | null;
  luggage_capacity_lbs: number | null;
  fuel_capacity_gallons: number | null;
  fuel_usable_gallons: number | null;
  fuel_weight_lbs: number | null;
  fuel_per_wing_gallons: number | null;
  oil_capacity_quarts: string | null;
  max_endurance_hours: number | null;
  v_speeds: Record<string, string>;
  stations: WBStation[];
}

export function extractAircraft(text: string): AircraftExtracted {
  const emptyW = findFirstFloat(EMPTY_WEIGHT, text);
  const grossW = findFirstFloat(GROSS_WEIGHT, text);
  let useful = findFirstFloat(USEFUL_LOAD, text);
  if (useful === null && emptyW !== null && grossW !== null) {
    useful = grossW - emptyW;
  }

  const yearStr = findFirst(YEAR, text);
  const yearVal = yearStr && /^\d{4}$/.test(yearStr) ? parseInt(yearStr) : null;

  const maxPaxStr = findFirst(MAX_PASSENGERS, text);
  const maxPax = maxPaxStr && /^\d+$/.test(maxPaxStr) ? parseInt(maxPaxStr) : null;

  return {
    registration: findFirst(REGISTRATION, text),
    model: findFirst(MODEL, text),
    year: yearVal,
    empty_weight: emptyW,
    max_takeoff_weight: grossW,
    useful_load: useful,
    max_passengers: maxPax,
    luggage_capacity_lbs: findFirstFloat(LUGGAGE, text),
    fuel_capacity_gallons: findFirstFloat(FUEL_TOTAL, text),
    fuel_usable_gallons: findFirstFloat(FUEL_USABLE, text),
    fuel_weight_lbs: findFirstFloat(FUEL_WEIGHT, text),
    fuel_per_wing_gallons: findFirstFloat(FUEL_PER_WING, text),
    oil_capacity_quarts: findFirst(OIL_CAPACITY, text),
    max_endurance_hours: findFirstFloat(MAX_ENDURANCE, text),
    v_speeds: extractVSpeeds(text),
    stations: extractStations(text),
  };
}

export interface CredentialExtracted {
  document_type: string | null;
  holder_name: string | null;
  expiry_date: string | null;
  medical_class: string | null;
  certificate_number: string | null;
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  medical_certificate: ["medical certificate", "medical class", "faa medical"],
  renters_insurance: ["renter", "insurance", "policy", "coverage", "premium"],
  pilot_certificate: ["pilot certificate", "airman certificate", "certificate number"],
};

const CLASS_MAP: Record<string, string> = {
  "1st": "1st_class",
  first: "1st_class",
  "first class": "1st_class",
  "2nd": "2nd_class",
  second: "2nd_class",
  "second class": "2nd_class",
  "3rd": "3rd_class",
  third: "3rd_class",
  "third class": "3rd_class",
  basicmed: "basicmed",
  "basic med": "basicmed",
};

const NAME_PATTERN =
  /(?:Name|Holder|Applicant|Insured|Pilot)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i;

export function extractCredential(text: string): CredentialExtracted {
  const lower = text.toLowerCase();
  let docType: string | null = null;
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      docType = type;
      break;
    }
  }

  const nameMatch = NAME_PATTERN.exec(text);
  const holderName = nameMatch ? nameMatch[1].trim() : null;

  const dates = findAllDates(text);
  const expiry = dates.length > 0 ? dates[dates.length - 1] : null;

  const medRaw = findFirst(MEDICAL_CLASS, text);
  let medClass: string | null = null;
  if (medRaw) {
    const cleaned = medRaw.toLowerCase().replace("class", "").trim();
    medClass = CLASS_MAP[cleaned] ?? CLASS_MAP[medRaw.toLowerCase().trim()] ?? null;
  }

  return {
    document_type: docType,
    holder_name: holderName,
    expiry_date: expiry,
    medical_class: medClass,
    certificate_number: findFirst(CERTIFICATE_NUMBER, text),
  };
}

export interface PartsExtracted {
  part_name: string | null;
  part_number: string | null;
  supplier: string | null;
  order_date: string | null;
  estimated_arrival: string | null;
  cost: number | null;
}

const PART_NAME_RE =
  /(?:Description|Item|Part\s*Name)[:\s]+(.+?)(?:\n|$)/i;

export function extractParts(text: string): PartsExtracted {
  const dates = findAllDates(text);

  const amountRe = new RegExp(DOLLAR_AMOUNT.source, DOLLAR_AMOUNT.flags);
  const amounts: number[] = [];
  let am: RegExpExecArray | null;
  while ((am = amountRe.exec(text)) !== null) {
    const v = parseFloat(am[1].replace(/,/g, ""));
    if (!isNaN(v)) amounts.push(v);
  }

  return {
    part_name: findFirst(PART_NAME_RE, text),
    part_number: findFirst(PART_NUMBER, text),
    supplier: findFirst(SUPPLIER, text),
    order_date: dates.length >= 1 ? dates[0] : null,
    estimated_arrival: dates.length >= 2 ? dates[1] : null,
    cost: amounts.length > 0 ? Math.max(...amounts) : null,
  };
}
