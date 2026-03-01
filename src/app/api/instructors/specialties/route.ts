import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAllSpecialties, createSpecialty, deleteSpecialty } from "@/lib/db/instructors";

// GET /api/instructors/specialties
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const specialties = await getAllSpecialties();
  return NextResponse.json(specialties);
}

// POST /api/instructors/specialties
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const specialty = await createSpecialty(name.trim());
    return NextResponse.json(specialty, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Specialty already exists" }, { status: 409 });
  }
}

// DELETE /api/instructors/specialties?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await deleteSpecialty(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
