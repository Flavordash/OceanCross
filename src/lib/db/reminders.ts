import { db } from "@/lib/db";
import { aircraftReminders, aircraft } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────

export type ReminderStatus = "expired" | "warning" | "ok" | "good";

export interface ReminderWithStatus {
  id: string;
  aircraftId: string;
  name: string;
  type: string;
  dueHours: number | null;
  warningHours: number | null;
  dueDate: Date | null;
  warningDays: number | null;
  lastCompletedAt: Date | null;
  lastCompletedHours: number | null;
  notes: string | null;
  // Computed fields
  hoursRemaining: number | null;
  daysRemaining: number | null;
  status: ReminderStatus;
  percentRemaining: number; // 0-100 for progress bar
}

export interface CreateReminderInput {
  aircraftId: string;
  name: string;
  type?: string;
  dueHours?: number | null;
  warningHours?: number | null;
  dueDate?: string | null;
  warningDays?: number | null;
  notes?: string | null;
}

export interface UpdateReminderInput {
  name?: string;
  type?: string;
  dueHours?: number | null;
  warningHours?: number | null;
  dueDate?: string | null;
  warningDays?: number | null;
  notes?: string | null;
}

// ── Helpers ─────────────────────────────────────────────

function computeStatus(
  hoursRemaining: number | null,
  daysRemaining: number | null,
  warningHours: number | null,
  warningDays: number | null,
): { status: ReminderStatus; percentRemaining: number } {
  // Check hours-based expiration
  if (hoursRemaining !== null) {
    if (hoursRemaining <= 0) return { status: "expired", percentRemaining: 0 };
    const warn = warningHours ?? 10;
    if (hoursRemaining <= warn) {
      return { status: "warning", percentRemaining: Math.round((hoursRemaining / (warn * 3)) * 100) };
    }
    if (hoursRemaining <= warn * 2) {
      return { status: "ok", percentRemaining: Math.round((hoursRemaining / (warn * 3)) * 100) };
    }
    return { status: "good", percentRemaining: Math.min(100, Math.round((hoursRemaining / (warn * 3)) * 100)) };
  }

  // Check date-based expiration
  if (daysRemaining !== null) {
    if (daysRemaining <= 0) return { status: "expired", percentRemaining: 0 };
    const warn = warningDays ?? 30;
    if (daysRemaining <= warn) {
      return { status: "warning", percentRemaining: Math.round((daysRemaining / (warn * 3)) * 100) };
    }
    if (daysRemaining <= warn * 2) {
      return { status: "ok", percentRemaining: Math.round((daysRemaining / (warn * 3)) * 100) };
    }
    return { status: "good", percentRemaining: Math.min(100, Math.round((daysRemaining / (warn * 3)) * 100)) };
  }

  return { status: "good", percentRemaining: 100 };
}

// ── Queries ─────────────────────────────────────────────

export async function getAircraftReminders(aircraftId: string): Promise<ReminderWithStatus[]> {
  const [ac] = await db
    .select({ hobbsHours: aircraft.hobbsHours })
    .from(aircraft)
    .where(eq(aircraft.id, aircraftId))
    .limit(1);

  if (!ac) return [];

  const rows = await db
    .select()
    .from(aircraftReminders)
    .where(eq(aircraftReminders.aircraftId, aircraftId))
    .orderBy(aircraftReminders.name);

  const now = new Date();

  return rows.map((r) => {
    const hoursRemaining = r.dueHours != null ? +(r.dueHours - ac.hobbsHours).toFixed(1) : null;
    const daysRemaining = r.dueDate
      ? Math.round((r.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const { status, percentRemaining } = computeStatus(
      hoursRemaining,
      daysRemaining,
      r.warningHours,
      r.warningDays,
    );

    return {
      id: r.id,
      aircraftId: r.aircraftId,
      name: r.name,
      type: r.type,
      dueHours: r.dueHours,
      warningHours: r.warningHours,
      dueDate: r.dueDate,
      warningDays: r.warningDays,
      lastCompletedAt: r.lastCompletedAt,
      lastCompletedHours: r.lastCompletedHours,
      notes: r.notes,
      hoursRemaining,
      daysRemaining,
      status,
      percentRemaining,
    };
  });
}

export async function createReminder(input: CreateReminderInput) {
  const [row] = await db
    .insert(aircraftReminders)
    .values({
      aircraftId: input.aircraftId,
      name: input.name,
      type: (input.type as "oil_change" | "elt" | "100_hour" | "annual" | "transponder" | "pitot_static" | "registration" | "custom") ?? "custom",
      dueHours: input.dueHours ?? null,
      warningHours: input.warningHours ?? 10,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      warningDays: input.warningDays ?? 30,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function updateReminder(id: string, input: UpdateReminderInput) {
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.type !== undefined) values.type = input.type;
  if (input.dueHours !== undefined) values.dueHours = input.dueHours;
  if (input.warningHours !== undefined) values.warningHours = input.warningHours;
  if (input.dueDate !== undefined) values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.warningDays !== undefined) values.warningDays = input.warningDays;
  if (input.notes !== undefined) values.notes = input.notes;

  const [row] = await db
    .update(aircraftReminders)
    .set(values)
    .where(eq(aircraftReminders.id, id))
    .returning();
  return row;
}

export async function deleteReminder(id: string) {
  const [row] = await db
    .delete(aircraftReminders)
    .where(eq(aircraftReminders.id, id))
    .returning();
  return row;
}

export async function completeReminder(id: string, completedHours?: number) {
  const [row] = await db
    .update(aircraftReminders)
    .set({
      lastCompletedAt: new Date(),
      lastCompletedHours: completedHours ?? null,
    })
    .where(eq(aircraftReminders.id, id))
    .returning();
  return row;
}

export async function getAircraftMaintenanceStatus(
  aircraftId: string,
): Promise<"pass" | "review" | "fail"> {
  const reminders = await getAircraftReminders(aircraftId);
  if (reminders.length === 0) return "pass";

  const hasExpired = reminders.some((r) => r.status === "expired");
  if (hasExpired) return "fail";

  const hasWarning = reminders.some((r) => r.status === "warning");
  if (hasWarning) return "review";

  return "pass";
}
