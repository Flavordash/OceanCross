import { db } from "@/lib/db";
import { invoices, invoiceItems, dispatchLogs, aircraft, profiles, instructorSettings, clientDetails } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────

export interface InvoiceWithItems {
  id: string;
  invoiceNumber: number;
  dispatchLogId: string | null;
  clientId: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  previousBalance: number;
  notes: string | null;
  issuedAt: Date;
  paidAt: Date | null;
  client: {
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    sortOrder: number;
  }[];
  dispatch?: {
    hobbsOut: number;
    hobbsIn: number | null;
    hobbsFlown: number | null;
    departTime: Date;
    aircraftRegistration: string | null;
    aircraftModel: string | null;
    instructorName: string | null;
  };
}

// ── Create invoice from a returned dispatch log ────────

export async function createInvoiceFromDispatch(dispatchId: string): Promise<InvoiceWithItems | null> {
  // Load dispatch with aircraft + instructor
  const [dispatch] = await db
    .select({
      id: dispatchLogs.id,
      aircraftId: dispatchLogs.aircraftId,
      pilotId: dispatchLogs.pilotId,
      instructorId: dispatchLogs.instructorId,
      hobbsOut: dispatchLogs.hobbsOut,
      hobbsIn: dispatchLogs.hobbsIn,
      hobbsFlown: dispatchLogs.hobbsFlown,
      departTime: dispatchLogs.departTime,
      aircraftReg: aircraft.registration,
      aircraftModel: aircraft.model,
      aircraftRate: aircraft.hourlyRate,
    })
    .from(dispatchLogs)
    .leftJoin(aircraft, eq(dispatchLogs.aircraftId, aircraft.id))
    .where(eq(dispatchLogs.id, dispatchId))
    .limit(1);

  if (!dispatch) return null;

  const hobbsFlown = dispatch.hobbsFlown ?? 0;

  // Load instructor rates if present
  let groundRate = 0;
  let flightRate = 0;
  let instructorName: string | null = null;
  if (dispatch.instructorId) {
    const [inst] = await db
      .select({
        fullName: profiles.fullName,
        groundRate: instructorSettings.groundRate,
        flightRate: instructorSettings.flightRate,
      })
      .from(instructorSettings)
      .leftJoin(profiles, eq(instructorSettings.profileId, profiles.id))
      .where(eq(instructorSettings.profileId, dispatch.instructorId))
      .limit(1);
    if (inst) {
      groundRate = inst.groundRate ?? 0;
      flightRate = inst.flightRate ?? 0;
      instructorName = inst.fullName ?? null;
    }
  }

  // Build line items
  const items: { description: string; quantity: number; rate: number; amount: number; sortOrder: number }[] = [];

  // Aircraft rental
  const aircraftRate = dispatch.aircraftRate ?? 0;
  if (aircraftRate > 0 || hobbsFlown > 0) {
    items.push({
      description: `Aircraft: ${dispatch.aircraftModel ?? ""} ${dispatch.aircraftReg ?? ""} (Standard)\nTime: ${dispatch.hobbsOut?.toFixed(2)} > ${dispatch.hobbsIn?.toFixed(2) ?? "—"}`,
      quantity: hobbsFlown,
      rate: aircraftRate,
      amount: +(hobbsFlown * aircraftRate).toFixed(2),
      sortOrder: 0,
    });
  }

  // Ground instruction (pre/post = 0.2 hr standard)
  if (instructorName && groundRate > 0) {
    const groundQty = 0.2;
    items.push({
      description: `Ground: Pre and Post (${instructorName})`,
      quantity: groundQty,
      rate: groundRate,
      amount: +(groundQty * groundRate).toFixed(2),
      sortOrder: 1,
    });
  }

  // Flight instruction
  if (instructorName && flightRate > 0 && hobbsFlown > 0) {
    items.push({
      description: `Flight: Standard Instruction (${instructorName})`,
      quantity: hobbsFlown,
      rate: flightRate,
      amount: +(hobbsFlown * flightRate).toFixed(2),
      sortOrder: 2,
    });
  }

  const subtotal = +items.reduce((s, i) => s + i.amount, 0).toFixed(2);
  const taxRate = 0.07;
  const taxAmount = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);

  // Generate invoice number from sequence
  const [{ nextval }] = await db.execute<{ nextval: string }>(
    sql`SELECT nextval('invoice_number_seq') AS nextval`
  );
  const invoiceNumber = parseInt(nextval, 10);

  // Insert invoice
  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      dispatchLogId: dispatchId,
      clientId: dispatch.pilotId,
      subtotal,
      taxRate,
      taxAmount,
      total,
      previousBalance: 0,
    })
    .returning();

  // Insert items
  await db.insert(invoiceItems).values(
    items.map((item) => ({ invoiceId: invoice.id, ...item }))
  );

  return getInvoice(invoice.id);
}

// ── Get single invoice with all details ───────────────

export async function getInvoice(invoiceId: string): Promise<InvoiceWithItems | null> {
  const [row] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      dispatchLogId: invoices.dispatchLogId,
      clientId: invoices.clientId,
      status: invoices.status,
      subtotal: invoices.subtotal,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      previousBalance: invoices.previousBalance,
      notes: invoices.notes,
      issuedAt: invoices.issuedAt,
      paidAt: invoices.paidAt,
      clientName: profiles.fullName,
      clientEmail: profiles.email,
      clientPhone: profiles.phone,
      clientAddress: clientDetails.address,
      clientCity: clientDetails.city,
      clientState: clientDetails.state,
      clientZip: clientDetails.zip,
    })
    .from(invoices)
    .leftJoin(profiles, eq(invoices.clientId, profiles.id))
    .leftJoin(clientDetails, eq(invoices.clientId, clientDetails.profileId))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(invoiceItems.sortOrder);

  // Load dispatch summary if linked
  let dispatch: InvoiceWithItems["dispatch"] | undefined;
  if (row.dispatchLogId) {
    const [d] = await db
      .select({
        hobbsOut: dispatchLogs.hobbsOut,
        hobbsIn: dispatchLogs.hobbsIn,
        hobbsFlown: dispatchLogs.hobbsFlown,
        departTime: dispatchLogs.departTime,
        aircraftRegistration: aircraft.registration,
        aircraftModel: aircraft.model,
        instructorName: profiles.fullName,
      })
      .from(dispatchLogs)
      .leftJoin(aircraft, eq(dispatchLogs.aircraftId, aircraft.id))
      .leftJoin(profiles, eq(dispatchLogs.instructorId, profiles.id))
      .where(eq(dispatchLogs.id, row.dispatchLogId))
      .limit(1);
    if (d) dispatch = d;
  }

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    dispatchLogId: row.dispatchLogId,
    clientId: row.clientId,
    status: row.status,
    subtotal: row.subtotal,
    taxRate: row.taxRate,
    taxAmount: row.taxAmount,
    total: row.total,
    previousBalance: row.previousBalance,
    notes: row.notes,
    issuedAt: row.issuedAt,
    paidAt: row.paidAt,
    client: {
      fullName: row.clientName ?? "",
      email: row.clientEmail ?? "",
      phone: row.clientPhone ?? null,
      address: row.clientAddress ?? null,
      city: row.clientCity ?? null,
      state: row.clientState ?? null,
      zip: row.clientZip ?? null,
    },
    items: items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.amount,
      sortOrder: i.sortOrder,
    })),
    dispatch,
  };
}

// ── List invoices ──────────────────────────────────────

export async function getInvoiceList(limit = 50) {
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      total: invoices.total,
      issuedAt: invoices.issuedAt,
      paidAt: invoices.paidAt,
      clientName: profiles.fullName,
      clientId: invoices.clientId,
    })
    .from(invoices)
    .leftJoin(profiles, eq(invoices.clientId, profiles.id))
    .orderBy(desc(invoices.issuedAt))
    .limit(limit);

  return rows;
}

// ── Get invoices for a specific client ────────────────

export async function getClientInvoices(clientId: string) {
  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      total: invoices.total,
      issuedAt: invoices.issuedAt,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.issuedAt));
}

// ── Update invoice status ──────────────────────────────

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "draft" | "sent" | "paid" | "void"
) {
  const [row] = await db
    .update(invoices)
    .set({ status, ...(status === "paid" ? { paidAt: new Date() } : {}) })
    .where(eq(invoices.id, invoiceId))
    .returning();
  return row ?? null;
}

// ── Check if invoice already exists for a dispatch log ─

export async function getInvoiceByDispatchId(dispatchLogId: string) {
  const [row] = await db
    .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.dispatchLogId, dispatchLogId))
    .limit(1);
  return row ?? null;
}
