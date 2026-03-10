import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { maintenanceJobs, aircraft } from "@/db/schema";
import { eq, ne } from "drizzle-orm";

// GET /api/maintenance — open maintenance jobs (for Inventory dropdown)
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await db
    .select({
      id: maintenanceJobs.id,
      description: maintenanceJobs.description,
      status: maintenanceJobs.status,
      aircraftRegistration: aircraft.registration,
    })
    .from(maintenanceJobs)
    .leftJoin(aircraft, eq(maintenanceJobs.aircraftId, aircraft.id))
    .where(ne(maintenanceJobs.status, "completed"));

  return NextResponse.json(jobs);
}
