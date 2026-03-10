import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getAllPartsOrders,
  createPartsOrder,
  updatePartsOrder,
  deletePartsOrder,
} from "@/lib/db/inventory";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getAllPartsOrders());
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { partName, supplier, jobId, orderDate, estimatedArrival } = body;

  if (!partName) {
    return NextResponse.json({ error: "Part name is required" }, { status: 400 });
  }

  const order = await createPartsOrder({
    partName,
    supplier,
    jobId: jobId || null,
    orderDate: orderDate ? new Date(orderDate) : undefined,
    estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
  });

  return NextResponse.json(order, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (updates.estimatedArrival) updates.estimatedArrival = new Date(updates.estimatedArrival);
  if (updates.actualArrival) updates.actualArrival = new Date(updates.actualArrival);

  const order = await updatePartsOrder(id, updates);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "mechanic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const order = await deletePartsOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
