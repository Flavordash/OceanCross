import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getAircraftReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
} from "@/lib/db/reminders";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aircraftId = request.nextUrl.searchParams.get("aircraftId");
  if (!aircraftId) {
    return NextResponse.json({ error: "aircraftId is required" }, { status: 400 });
  }

  const reminders = await getAircraftReminders(aircraftId);
  return NextResponse.json(reminders);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = request.nextUrl.searchParams.get("action");

  if (action === "complete") {
    const body = await request.json();
    const { id, completedHours } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const row = await completeReminder(id, completedHours);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  }

  const body = await request.json();
  const { aircraftId, name, type, dueHours, warningHours, dueDate, warningDays, notes } = body;

  if (!aircraftId || !name) {
    return NextResponse.json({ error: "aircraftId and name are required" }, { status: 400 });
  }

  const row = await createReminder({ aircraftId, name, type, dueHours, warningHours, dueDate, warningDays, notes });
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const row = await updateReminder(id, updates);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const row = await deleteReminder(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
