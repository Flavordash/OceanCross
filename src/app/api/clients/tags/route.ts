import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getAllClientTags,
  createClientTag,
  deleteClientTag,
} from "@/lib/db/profiles";

// GET /api/clients/tags
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getAllClientTags());
}

// POST /api/clients/tags
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await request.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const tag = await createClientTag(name, color ?? "#6B7280");
    return NextResponse.json(tag, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE /api/clients/tags?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const tag = await deleteClientTag(id);
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
