import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getMechanics,
  getMechanicJobs,
  getMechanicActiveJobCount,
} from "@/lib/db/profiles";

// GET /api/mechanics?id=...&detail=jobs
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (id) {
    if (searchParams.get("detail") === "jobs") {
      return NextResponse.json(await getMechanicJobs(id));
    }
    const count = await getMechanicActiveJobCount(id);
    return NextResponse.json({ activeJobs: count });
  }

  const mechanics = await getMechanics();

  const enriched = await Promise.all(
    mechanics.map(async (m) => {
      const activeJobs = await getMechanicActiveJobCount(m.id);
      return { ...m, activeJobs };
    })
  );

  return NextResponse.json(enriched);
}
