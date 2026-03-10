import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getDocumentsByProfile,
  getDocumentsByAircraft,
  createDocument,
  deleteDocument,
} from "@/lib/db/documents";

// GET /api/documents?profileId=...  or  ?aircraftId=...
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId");
  const aircraftId = searchParams.get("aircraftId");

  if (profileId) {
    return NextResponse.json(await getDocumentsByProfile(profileId));
  }
  if (aircraftId) {
    return NextResponse.json(await getDocumentsByAircraft(aircraftId));
  }

  return NextResponse.json({ error: "profileId or aircraftId required" }, { status: 400 });
}

// POST /api/documents
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, aircraftId, type, fileUrl, expiresAt, extractedData } = body;

  if (!type || !fileUrl) {
    return NextResponse.json({ error: "type and fileUrl are required" }, { status: 400 });
  }

  const doc = await createDocument({
    profileId: profileId || null,
    aircraftId: aircraftId || null,
    type,
    fileUrl,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    extractedData: extractedData || null,
  });

  return NextResponse.json(doc, { status: 201 });
}

// DELETE /api/documents?id=...
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const doc = await deleteDocument(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
