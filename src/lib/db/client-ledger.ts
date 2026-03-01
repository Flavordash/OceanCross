import { db } from "@/lib/db";
import { clientLedger } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface CreateLedgerEntryInput {
  profileId: string;
  date?: string;
  description: string;
  type: "charge" | "payment" | "adjustment";
  quantity?: number | null;
  amount: number;
  paymentMethod?: string | null;
  notes?: string | null;
}

export async function getLedgerEntries(profileId: string, limit = 50) {
  return db
    .select()
    .from(clientLedger)
    .where(eq(clientLedger.profileId, profileId))
    .orderBy(desc(clientLedger.date))
    .limit(limit);
}

export async function createLedgerEntry(input: CreateLedgerEntryInput) {
  const [row] = await db
    .insert(clientLedger)
    .values({
      profileId: input.profileId,
      date: input.date ? new Date(input.date) : new Date(),
      description: input.description,
      type: input.type,
      quantity: input.quantity ?? null,
      amount: input.amount,
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function deleteLedgerEntry(id: string) {
  const [row] = await db
    .delete(clientLedger)
    .where(eq(clientLedger.id, id))
    .returning();
  return row ?? null;
}

export async function getClientBalance(profileId: string) {
  const [row] = await db
    .select({
      totalCharges: sql<number>`coalesce(sum(case when type = 'charge' then amount else 0 end), 0)`,
      totalPayments: sql<number>`coalesce(sum(case when type = 'payment' then amount else 0 end), 0)`,
      totalAdjustments: sql<number>`coalesce(sum(case when type = 'adjustment' then amount else 0 end), 0)`,
    })
    .from(clientLedger)
    .where(eq(clientLedger.profileId, profileId));

  const charges = row?.totalCharges ?? 0;
  const payments = row?.totalPayments ?? 0;
  const adjustments = row?.totalAdjustments ?? 0;

  return {
    totalCharges: charges,
    totalPayments: payments,
    totalAdjustments: adjustments,
    balance: charges - payments + adjustments,
  };
}
