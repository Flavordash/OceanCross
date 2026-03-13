import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getInvoiceList,
  createInvoiceFromDispatch,
  getInvoiceByDispatchId,
} from "@/lib/db/invoices";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await getInvoiceList();
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dispatchLogId } = await request.json();
  if (!dispatchLogId) {
    return NextResponse.json({ error: "dispatchLogId is required" }, { status: 400 });
  }

  // Return existing invoice if already generated
  const existing = await getInvoiceByDispatchId(dispatchLogId);
  if (existing) {
    return NextResponse.json({ id: existing.id, invoiceNumber: existing.invoiceNumber, existing: true });
  }

  const invoice = await createInvoiceFromDispatch(dispatchLogId);
  if (!invoice) {
    return NextResponse.json({ error: "Dispatch log not found" }, { status: 404 });
  }

  return NextResponse.json(invoice, { status: 201 });
}
