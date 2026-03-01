import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getClients,
  getClientWithStats,
  getClientHistory,
  getProfilesWithTags,
  createClient,
  setProfileTags,
} from "@/lib/db/profiles";

// GET /api/clients?id=...&detail=history
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (id) {
    if (searchParams.get("detail") === "history") {
      return NextResponse.json(await getClientHistory(id));
    }
    const stats = await getClientWithStats(id);
    return NextResponse.json(stats);
  }

  const clients = await getClients();

  // Enrich each client with stats + tags
  const ids = clients.map((c) => c.id);
  const [statsArr, tagsMap] = await Promise.all([
    Promise.all(clients.map((c) => getClientWithStats(c.id))),
    getProfilesWithTags(ids),
  ]);

  const enriched = clients.map((c, i) => ({
    ...c,
    ...statsArr[i],
    tags: tagsMap[c.id] ?? [],
  }));

  return NextResponse.json(enriched);
}

// POST /api/clients — create a new client
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, email, phone, tagIds } = body;

  if (!fullName || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  try {
    const client = await createClient({ fullName, email, phone });

    if (tagIds && tagIds.length > 0) {
      await setProfileTags(client.id, tagIds);
    }

    return NextResponse.json(client, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    throw e;
  }
}

// PUT /api/clients — update client tags
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, tagIds } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!Array.isArray(tagIds)) return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 });

  await setProfileTags(id, tagIds);
  return NextResponse.json({ success: true });
}
