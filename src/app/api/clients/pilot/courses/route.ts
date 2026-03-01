import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getPilotCourses,
  createPilotCourse,
  updatePilotCourse,
  deletePilotCourse,
} from "@/lib/db/pilot-info";

// GET /api/clients/pilot/courses?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const courses = await getPilotCourses(profileId);
  return NextResponse.json(courses);
}

// POST /api/clients/pilot/courses
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, courseName, status, enrolledDate } = body;
  if (!profileId || !courseName) {
    return NextResponse.json({ error: "profileId and courseName are required" }, { status: 400 });
  }

  const course = await createPilotCourse({ profileId, courseName, status, enrolledDate });
  return NextResponse.json(course, { status: 201 });
}

// PUT /api/clients/pilot/courses
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, status, completedDate } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const course = await updatePilotCourse(id, { status, completedDate });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

// DELETE /api/clients/pilot/courses?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const course = await deletePilotCourse(id);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
