import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getPilotInfo, upsertPilotInfo } from "@/lib/db/pilot-info";

// GET /api/clients/pilot?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const info = await getPilotInfo(profileId);
  return NextResponse.json(info);
}

// PUT /api/clients/pilot
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, ...data } = body;
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const info = await upsertPilotInfo(profileId, data);
  return NextResponse.json(info);
}
