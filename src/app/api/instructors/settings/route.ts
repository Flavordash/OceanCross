import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getInstructorSettings, upsertInstructorSettings } from "@/lib/db/instructors";

// GET /api/instructors/settings?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const settings = await getInstructorSettings(profileId);
  return NextResponse.json(settings);
}

// PUT /api/instructors/settings
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, ...data } = body;
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const settings = await upsertInstructorSettings(profileId, data);
  return NextResponse.json(settings);
}
