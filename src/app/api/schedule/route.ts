import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  checkConflicts,
  getInstructors,
  getStudents,
  getAvailableAircraft,
} from "@/lib/db/schedule";

// GET /api/schedule?start=...&end=...&lookup=true
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;

  // Lookup mode: return instructors, students, aircraft for form selects
  if (searchParams.get("lookup") === "true") {
    const [instructors, students, aircraftList] = await Promise.all([
      getInstructors(),
      getStudents(),
      getAvailableAircraft(),
    ]);
    return NextResponse.json({ instructors, students, aircraft: aircraftList });
  }

  const events = await getEvents({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    userId: user.id,
    role: user.role,
  });

  return NextResponse.json(events);
}

// POST /api/schedule
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, type, startTime, endTime, aircraftId, instructorId, studentId } = body;

  if (!title || !type || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Conflict check
  const conflict = await checkConflicts(startTime, endTime, {
    aircraftId,
    instructorId,
    studentId,
  });

  if (conflict.hasConflict) {
    return NextResponse.json(
      { error: "Scheduling conflict", conflicts: conflict.conflicts },
      { status: 409 }
    );
  }

  const event = await createEvent({
    title,
    type,
    startTime,
    endTime,
    aircraftId,
    instructorId,
    studentId,
  });

  return NextResponse.json(event, { status: 201 });
}

// PUT /api/schedule
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  // Conflict check if time/resources changed
  if (updates.startTime || updates.endTime || updates.aircraftId || updates.instructorId || updates.studentId) {
    const conflict = await checkConflicts(
      updates.startTime ?? body.startTime,
      updates.endTime ?? body.endTime,
      {
        aircraftId: updates.aircraftId,
        instructorId: updates.instructorId,
        studentId: updates.studentId,
        excludeEventId: id,
      }
    );
    if (conflict.hasConflict) {
      return NextResponse.json(
        { error: "Scheduling conflict", conflicts: conflict.conflicts },
        { status: 409 }
      );
    }
  }

  const event = await updateEvent(id, updates);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

// DELETE /api/schedule?id=...
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const event = await deleteEvent(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
