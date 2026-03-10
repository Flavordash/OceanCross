import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getMechanics,
  getMechanicJobs,
  getMechanicActiveJobCount,
  createMechanic,
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

// POST /api/mechanics — create a new mechanic
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, email, phone } = body;

  if (!fullName || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const mechanic = await createMechanic({ fullName, email, phone });
  return NextResponse.json(mechanic, { status: 201 });
}
