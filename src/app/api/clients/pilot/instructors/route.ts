import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getPilotPreferredInstructors,
  addPilotPreferredInstructor,
  removePilotPreferredInstructor,
} from "@/lib/db/pilot-info";

// GET /api/clients/pilot/instructors?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const instructors = await getPilotPreferredInstructors(profileId);
  return NextResponse.json(instructors);
}

// POST /api/clients/pilot/instructors
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, instructorId, addedBy } = body;
  if (!profileId || !instructorId) {
    return NextResponse.json({ error: "profileId and instructorId are required" }, { status: 400 });
  }

  const result = await addPilotPreferredInstructor({
    profileId,
    instructorId,
    addedBy: addedBy ?? "Admin",
  });
  return NextResponse.json(result, { status: 201 });
}

// DELETE /api/clients/pilot/instructors?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await removePilotPreferredInstructor(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
