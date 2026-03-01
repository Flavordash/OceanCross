import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getClientDetails, upsertClientDetails } from "@/lib/db/client-details";

// GET /api/clients/details?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const details = await getClientDetails(profileId);
  return NextResponse.json(details);
}

// PUT /api/clients/details
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, ...data } = body;
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const details = await upsertClientDetails(profileId, data);
  return NextResponse.json(details);
}
