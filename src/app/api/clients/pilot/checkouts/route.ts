import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getPilotCheckouts,
  createPilotCheckout,
  deletePilotCheckout,
} from "@/lib/db/pilot-info";

// GET /api/clients/pilot/checkouts?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const checkouts = await getPilotCheckouts(profileId);
  return NextResponse.json(checkouts);
}

// POST /api/clients/pilot/checkouts
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, aircraftId, checkedOutBy, checkoutDate } = body;
  if (!profileId || !aircraftId || !checkedOutBy) {
    return NextResponse.json({ error: "profileId, aircraftId, and checkedOutBy are required" }, { status: 400 });
  }

  const checkout = await createPilotCheckout({ profileId, aircraftId, checkedOutBy, checkoutDate });
  return NextResponse.json(checkout, { status: 201 });
}

// DELETE /api/clients/pilot/checkouts?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const checkout = await deletePilotCheckout(id);
  if (!checkout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
