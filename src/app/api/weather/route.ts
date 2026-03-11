import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getMetar, getTaf } from "@/lib/external/weather-api";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const icao = request.nextUrl.searchParams.get("icao");
  if (!icao || !/^[A-Za-z]{4}$/.test(icao)) {
    return NextResponse.json({ error: "Valid 4-letter ICAO identifier required" }, { status: 400 });
  }

  const [metar, taf] = await Promise.all([
    getMetar(icao),
    getTaf(icao),
  ]);

  return NextResponse.json({ metar, taf });
}
