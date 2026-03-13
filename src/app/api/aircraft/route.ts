import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getAllAircraft,
  getAircraftById,
  createAircraft,
  updateAircraft,
  deleteAircraft,
  getAircraftSchedule,
  getAircraftMaintenance,
} from "@/lib/db/aircraft";

// GET /api/aircraft?id=...&detail=schedule|maintenance
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (id) {
    const detail = searchParams.get("detail");
    if (detail === "schedule") {
      return NextResponse.json(await getAircraftSchedule(id));
    }
    if (detail === "maintenance") {
      return NextResponse.json(await getAircraftMaintenance(id));
    }
    const ac = await getAircraftById(id);
    if (!ac) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(ac);
  }

  return NextResponse.json(await getAllAircraft());
}

// POST /api/aircraft
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { registration, type, model, status, totalHours, hobbsHours, tachHours,
    hourlyRate, year, emptyWeight, maxTakeoffWeight, usefulLoad, maxPassengers,
    luggageCapacityLbs, fuelCapacityGallons, fuelUsableGallons,
    fuelWeightLbs, fuelPerWingGallons, oilCapacityQuarts,
    maxEnduranceHours, vSpeeds, notes } = body;

  if (!registration || !type || !model) {
    return NextResponse.json({ error: "Registration, type, and model are required" }, { status: 400 });
  }

  try {
    const ac = await createAircraft({
      registration, type, model, status, totalHours, hobbsHours, tachHours,
      hourlyRate, year, emptyWeight, maxTakeoffWeight, usefulLoad, maxPassengers,
      luggageCapacityLbs, fuelCapacityGallons, fuelUsableGallons,
      fuelWeightLbs, fuelPerWingGallons, oilCapacityQuarts,
      maxEnduranceHours, vSpeeds, notes,
    });
    return NextResponse.json(ac, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Registration already exists" }, { status: 409 });
    }
    console.error("createAircraft error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/aircraft
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ac = await updateAircraft(id, updates);
  if (!ac) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ac);
}

// DELETE /api/aircraft?id=...
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ac = await deleteAircraft(id);
  if (!ac) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
