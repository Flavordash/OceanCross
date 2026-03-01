import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getInstructors,
  getInstructorWithStats,
  createInstructor,
  getInstructorHistory,
} from "@/lib/db/instructors";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  const detail = request.nextUrl.searchParams.get("detail");

  // Single instructor history
  if (id && detail === "history") {
    const history = await getInstructorHistory(id);
    return NextResponse.json(history);
  }

  // Single instructor stats
  if (id) {
    const stats = await getInstructorWithStats(id);
    return NextResponse.json(stats);
  }

  // All instructors with enrichment
  const instructors = await getInstructors();

  const enriched = await Promise.all(
    instructors.map(async (inst) => {
      const stats = await getInstructorWithStats(inst.id);
      return { ...inst, ...stats };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, email, phone } = body;

  if (!fullName || !email) {
    return NextResponse.json({ error: "fullName and email are required" }, { status: 400 });
  }

  try {
    const instructor = await createInstructor({ fullName, email, phone });
    return NextResponse.json(instructor, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
