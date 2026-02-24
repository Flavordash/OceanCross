import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  createDispatch,
  recordReturn,
  getDispatchByEventId,
  getAircraftDispatchHistory,
  cancelDispatch,
  getPreflightData,
} from "@/lib/db/dispatch";
import { getAircraftMaintenanceStatus } from "@/lib/db/reminders";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const eventId = searchParams.get("eventId");
  const aircraftId = searchParams.get("aircraftId");
  const preflight = searchParams.get("preflight");

  if (eventId && preflight === "true") {
    const data = await getPreflightData(eventId);
    if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let maintenanceStatus: "pass" | "review" | "fail" = "pass";
    if (data.aircraft) {
      maintenanceStatus = await getAircraftMaintenanceStatus(data.aircraft.id);
    }

    return NextResponse.json({ ...data, maintenanceStatus });
  }

  if (eventId) {
    const dispatch = await getDispatchByEventId(eventId);
    return NextResponse.json(dispatch);
  }

  if (aircraftId) {
    const history = await getAircraftDispatchHistory(aircraftId);
    return NextResponse.json(history);
  }

  return NextResponse.json({ error: "eventId or aircraftId required" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { eventId, aircraftId, pilotId, instructorId, hobbsOut, tachOut, maintenanceStatus, preflightChecks, departTime, notes } = body;

  if (!eventId || !aircraftId || !pilotId || hobbsOut == null || tachOut == null || !maintenanceStatus || !departTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const row = await createDispatch({
    eventId,
    aircraftId,
    pilotId,
    instructorId,
    hobbsOut,
    tachOut,
    maintenanceStatus,
    preflightChecks: preflightChecks ?? {},
    departTime,
    notes,
  });
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { dispatchId, hobbsIn, tachIn, notes } = body;

  if (!dispatchId || hobbsIn == null || tachIn == null) {
    return NextResponse.json({ error: "dispatchId, hobbsIn, and tachIn are required" }, { status: 400 });
  }

  const row = await recordReturn(dispatchId, { hobbsIn, tachIn, notes });
  if (!row) return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const row = await cancelDispatch(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
