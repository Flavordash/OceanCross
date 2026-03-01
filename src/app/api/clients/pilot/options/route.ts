import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getInstructorList, getAircraftList } from "@/lib/db/pilot-info";

// GET /api/clients/pilot/options
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [instructors, aircraftItems] = await Promise.all([
    getInstructorList(),
    getAircraftList(),
  ]);

  return NextResponse.json({ instructors, aircraft: aircraftItems });
}
