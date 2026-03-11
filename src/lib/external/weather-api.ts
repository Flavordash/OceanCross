const BASE_URL = "https://aviationweather.gov/api/data";

export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR" | "UNKNOWN";

export interface MetarData {
  icaoId: string;
  rawOb: string;
  fltCat: FlightCategory;
  temp: number | null;
  dewp: number | null;
  wdir: number | null;
  wspd: number | null;
  wgst: number | null;
  visib: number | null;
  altim: number | null;
  clouds: Array<{ cover: string; base: number }>;
  obsTime: string;
}

export interface TafForecast {
  timeFrom: string;
  timeTo: string;
  fltCat: FlightCategory;
  wdir: number | null;
  wspd: number | null;
  wgst: number | null;
  visib: number | null;
  clouds: Array<{ cover: string; base: number }>;
}

export interface TafData {
  icaoId: string;
  rawTAF: string;
  issueTime: string;
  validTimeFrom: string;
  validTimeTo: string;
  fcsts: TafForecast[];
}

export async function getMetar(icaoId: string): Promise<MetarData | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/metar?ids=${icaoId.toUpperCase()}&format=json&hoursBeforeNow=2`,
      { next: { revalidate: 300 } } // 5분 캐시
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] as MetarData;
  } catch {
    return null;
  }
}

export async function getTaf(icaoId: string): Promise<TafData | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/taf?ids=${icaoId.toUpperCase()}&format=json`,
      { next: { revalidate: 600 } } // 10분 캐시
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] as TafData;
  } catch {
    return null;
  }
}

export function flightCategoryBadgeClass(cat: FlightCategory): string {
  switch (cat) {
    case "VFR":  return "bg-green-100 text-green-700 border-green-200";
    case "MVFR": return "bg-blue-100 text-blue-700 border-blue-200";
    case "IFR":  return "bg-red-100 text-red-700 border-red-200";
    case "LIFR": return "bg-purple-100 text-purple-700 border-purple-200";
    default:     return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function flightCategoryLabel(cat: FlightCategory): string {
  switch (cat) {
    case "VFR":  return "VFR ✅";
    case "MVFR": return "MVFR ⚠️";
    case "IFR":  return "IFR ❌";
    case "LIFR": return "LIFR ❌";
    default:     return "UNKNOWN";
  }
}

/** TAF 예보 중 비행 시간과 겹치는 구간만 필터 */
export function getForecastsForWindow(
  fcsts: TafForecast[],
  windowStart: Date,
  windowEnd: Date
): TafForecast[] {
  return fcsts.filter((f) => {
    const from = new Date(f.timeFrom);
    const to = new Date(f.timeTo);
    return from < windowEnd && to > windowStart;
  });
}

/** 비행 시간대 예보 중 가장 나쁜 fltCat 반환 */
export function worstFlightCategory(cats: FlightCategory[]): FlightCategory {
  const order: FlightCategory[] = ["LIFR", "IFR", "MVFR", "VFR", "UNKNOWN"];
  for (const cat of order) {
    if (cats.includes(cat)) return cat;
  }
  return "UNKNOWN";
}
