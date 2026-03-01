import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getLedgerEntries,
  createLedgerEntry,
  deleteLedgerEntry,
  getClientBalance,
} from "@/lib/db/client-ledger";

// GET /api/clients/ledger?profileId=xxx
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

  const [entries, balance] = await Promise.all([
    getLedgerEntries(profileId),
    getClientBalance(profileId),
  ]);

  return NextResponse.json({ entries, balance });
}

// POST /api/clients/ledger
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { profileId, description, type, amount, quantity, date, paymentMethod, notes } = body;

  if (!profileId || !description || !type || amount === undefined) {
    return NextResponse.json({ error: "profileId, description, type, and amount are required" }, { status: 400 });
  }

  const entry = await createLedgerEntry({
    profileId,
    description,
    type,
    amount: parseFloat(amount),
    quantity: quantity ? parseFloat(quantity) : null,
    date,
    paymentMethod,
    notes,
  });

  return NextResponse.json(entry, { status: 201 });
}

// DELETE /api/clients/ledger?id=xxx
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const entry = await deleteLedgerEntry(id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
