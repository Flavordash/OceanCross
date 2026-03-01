import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getInstructorAssignments,
  assignSpecialty,
  updateAssignmentRate,
  removeAssignment,
} from "@/lib/db/instructors";

// GET /api/instructors/assignments?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const assignments = await getInstructorAssignments(profileId);
  return NextResponse.json(assignments);
}

// POST /api/instructors/assignments
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { instructorId, specialtyId, hourlyRate } = body;
  if (!instructorId || !specialtyId) {
    return NextResponse.json({ error: "instructorId and specialtyId are required" }, { status: 400 });
  }

  const assignment = await assignSpecialty({
    instructorId,
    specialtyId,
    hourlyRate: parseFloat(hourlyRate) || 0,
  });
  return NextResponse.json(assignment, { status: 201 });
}

// PUT /api/instructors/assignments
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, hourlyRate } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await updateAssignmentRate(id, parseFloat(hourlyRate) || 0);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/instructors/assignments?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await removeAssignment(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
