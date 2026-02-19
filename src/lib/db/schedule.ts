import { db } from "@/lib/db";
import { scheduleEvents, profiles, aircraft } from "@/db/schema";
import { and, eq, ne, or, lt, gt, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────

export type EventType =
  | "flight_training"
  | "maintenance"
  | "exam"
  | "ground_school";
export type EventStatus = "scheduled" | "completed" | "cancelled";

export interface CreateEventInput {
  title: string;
  type: EventType;
  startTime: string;
  endTime: string;
  aircraftId?: string | null;
  instructorId?: string | null;
  studentId?: string | null;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: string[];
}

// ── Queries ────────────────────────────────────────────

export async function getEvents(filters?: {
  start?: string;
  end?: string;
  userId?: string;
  role?: string;
}) {
  const conditions = [ne(scheduleEvents.status, "cancelled")];

  if (filters?.start) {
    conditions.push(
      gt(scheduleEvents.endTime, new Date(filters.start))
    );
  }
  if (filters?.end) {
    conditions.push(
      lt(scheduleEvents.startTime, new Date(filters.end))
    );
  }

  // Role-based filtering
  if (filters?.role === "student" && filters.userId) {
    conditions.push(eq(scheduleEvents.studentId, filters.userId));
  } else if (filters?.role === "instructor" && filters.userId) {
    conditions.push(eq(scheduleEvents.instructorId, filters.userId));
  } else if (filters?.role === "mechanic") {
    conditions.push(eq(scheduleEvents.type, "maintenance"));
  }

  const rows = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
      status: scheduleEvents.status,
      aircraftId: scheduleEvents.aircraftId,
      instructorId: scheduleEvents.instructorId,
      studentId: scheduleEvents.studentId,
      aircraftReg: aircraft.registration,
      instructorName: sql<string>`ip.full_name`,
      studentName: sql<string>`sp.full_name`,
    })
    .from(scheduleEvents)
    .leftJoin(aircraft, eq(scheduleEvents.aircraftId, aircraft.id))
    .leftJoin(
      sql`profiles as ip`,
      sql`${scheduleEvents.instructorId} = ip.id`
    )
    .leftJoin(
      sql`profiles as sp`,
      sql`${scheduleEvents.studentId} = sp.id`
    )
    .where(and(...conditions))
    .orderBy(scheduleEvents.startTime);

  return rows;
}

export async function getEventById(id: string) {
  const [row] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, id))
    .limit(1);
  return row ?? null;
}

export async function createEvent(input: CreateEventInput) {
  const [row] = await db
    .insert(scheduleEvents)
    .values({
      title: input.title,
      type: input.type,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      aircraftId: input.aircraftId || null,
      instructorId: input.instructorId || null,
      studentId: input.studentId || null,
    })
    .returning();
  return row;
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.type !== undefined) values.type = input.type;
  if (input.status !== undefined) values.status = input.status;
  if (input.startTime !== undefined)
    values.startTime = new Date(input.startTime);
  if (input.endTime !== undefined) values.endTime = new Date(input.endTime);
  if (input.aircraftId !== undefined)
    values.aircraftId = input.aircraftId || null;
  if (input.instructorId !== undefined)
    values.instructorId = input.instructorId || null;
  if (input.studentId !== undefined)
    values.studentId = input.studentId || null;

  const [row] = await db
    .update(scheduleEvents)
    .set(values)
    .where(eq(scheduleEvents.id, id))
    .returning();
  return row;
}

export async function deleteEvent(id: string) {
  const [row] = await db
    .update(scheduleEvents)
    .set({ status: "cancelled" })
    .where(eq(scheduleEvents.id, id))
    .returning();
  return row;
}

// ── Conflict Detection ─────────────────────────────────

export async function checkConflicts(
  startTime: string,
  endTime: string,
  opts: {
    aircraftId?: string | null;
    instructorId?: string | null;
    studentId?: string | null;
    excludeEventId?: string;
  }
): Promise<ConflictResult> {
  const conflicts: string[] = [];
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Time overlap: existing.start < new.end AND existing.end > new.start
  const baseConditions = [
    lt(scheduleEvents.startTime, end),
    gt(scheduleEvents.endTime, start),
    ne(scheduleEvents.status, "cancelled"),
  ];

  if (opts.excludeEventId) {
    baseConditions.push(ne(scheduleEvents.id, opts.excludeEventId));
  }

  if (opts.aircraftId) {
    const [hit] = await db
      .select({ id: scheduleEvents.id })
      .from(scheduleEvents)
      .where(
        and(...baseConditions, eq(scheduleEvents.aircraftId, opts.aircraftId))
      )
      .limit(1);
    if (hit) conflicts.push("Aircraft is already booked for this time slot");
  }

  if (opts.instructorId) {
    const [hit] = await db
      .select({ id: scheduleEvents.id })
      .from(scheduleEvents)
      .where(
        and(
          ...baseConditions,
          eq(scheduleEvents.instructorId, opts.instructorId)
        )
      )
      .limit(1);
    if (hit)
      conflicts.push("Instructor is already booked for this time slot");
  }

  if (opts.studentId) {
    const [hit] = await db
      .select({ id: scheduleEvents.id })
      .from(scheduleEvents)
      .where(
        and(...baseConditions, eq(scheduleEvents.studentId, opts.studentId))
      )
      .limit(1);
    if (hit) conflicts.push("Student is already booked for this time slot");
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

// ── Lookup helpers ─────────────────────────────────────

export async function getInstructors() {
  return db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.role, "instructor"));
}

export async function getStudents() {
  return db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.role, "student"));
}

export async function getAvailableAircraft() {
  return db
    .select({
      id: aircraft.id,
      registration: aircraft.registration,
      model: aircraft.model,
    })
    .from(aircraft);
}
