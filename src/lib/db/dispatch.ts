import { db } from "@/lib/db";
import {
  dispatchLogs,
  scheduleEvents,
  aircraft,
  profiles,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────

export interface CreateDispatchInput {
  eventId: string;
  aircraftId: string;
  pilotId: string;
  instructorId?: string | null;
  hobbsOut: number;
  tachOut: number;
  maintenanceStatus: string;
  preflightChecks: Record<string, boolean>;
  departTime: string;
  notes?: string | null;
}

export interface RecordReturnInput {
  hobbsIn: number;
  tachIn: number;
  notes?: string | null;
}

// ── Queries ─────────────────────────────────────────────

export async function createDispatch(input: CreateDispatchInput) {
  const [row] = await db
    .insert(dispatchLogs)
    .values({
      eventId: input.eventId,
      aircraftId: input.aircraftId,
      pilotId: input.pilotId,
      instructorId: input.instructorId ?? null,
      hobbsOut: input.hobbsOut,
      tachOut: input.tachOut,
      maintenanceStatus: input.maintenanceStatus,
      preflightChecks: input.preflightChecks,
      departTime: new Date(input.departTime),
      notes: input.notes ?? null,
      status: "dispatched",
    })
    .returning();

  // Update the schedule event's dispatch status
  await db
    .update(scheduleEvents)
    .set({ dispatchStatus: "dispatched" })
    .where(eq(scheduleEvents.id, input.eventId));

  return row;
}

export async function recordReturn(dispatchId: string, input: RecordReturnInput) {
  // Get the dispatch log to calculate hours flown
  const [dispatch] = await db
    .select()
    .from(dispatchLogs)
    .where(eq(dispatchLogs.id, dispatchId))
    .limit(1);

  if (!dispatch) return null;

  const hobbsFlown = +(input.hobbsIn - dispatch.hobbsOut).toFixed(1);
  const tachFlown = +(input.tachIn - dispatch.tachOut).toFixed(1);

  // Update dispatch log
  const [row] = await db
    .update(dispatchLogs)
    .set({
      hobbsIn: input.hobbsIn,
      tachIn: input.tachIn,
      hobbsFlown,
      tachFlown,
      returnTime: new Date(),
      status: "returned",
      notes: input.notes ?? dispatch.notes,
    })
    .where(eq(dispatchLogs.id, dispatchId))
    .returning();

  // Update aircraft hobbs/tach and add to total hours
  const [ac] = await db
    .select({ totalHours: aircraft.totalHours })
    .from(aircraft)
    .where(eq(aircraft.id, dispatch.aircraftId))
    .limit(1);

  await db
    .update(aircraft)
    .set({
      hobbsHours: input.hobbsIn,
      tachHours: input.tachIn,
      totalHours: (ac?.totalHours ?? 0) + Math.round(hobbsFlown),
    })
    .where(eq(aircraft.id, dispatch.aircraftId));

  // Update schedule event
  await db
    .update(scheduleEvents)
    .set({ dispatchStatus: "returned", status: "completed" })
    .where(eq(scheduleEvents.id, dispatch.eventId));

  return row;
}

export async function getDispatchByEventId(eventId: string) {
  const [row] = await db
    .select()
    .from(dispatchLogs)
    .where(eq(dispatchLogs.eventId, eventId))
    .limit(1);
  return row ?? null;
}

export async function getAircraftDispatchHistory(aircraftId: string, limit = 20) {
  return db
    .select({
      id: dispatchLogs.id,
      eventId: dispatchLogs.eventId,
      status: dispatchLogs.status,
      hobbsOut: dispatchLogs.hobbsOut,
      tachOut: dispatchLogs.tachOut,
      hobbsIn: dispatchLogs.hobbsIn,
      tachIn: dispatchLogs.tachIn,
      hobbsFlown: dispatchLogs.hobbsFlown,
      tachFlown: dispatchLogs.tachFlown,
      maintenanceStatus: dispatchLogs.maintenanceStatus,
      departTime: dispatchLogs.departTime,
      returnTime: dispatchLogs.returnTime,
      pilotName: profiles.fullName,
    })
    .from(dispatchLogs)
    .leftJoin(profiles, eq(dispatchLogs.pilotId, profiles.id))
    .where(eq(dispatchLogs.aircraftId, aircraftId))
    .orderBy(desc(dispatchLogs.departTime))
    .limit(limit);
}

export async function cancelDispatch(dispatchId: string) {
  const [dispatch] = await db
    .select()
    .from(dispatchLogs)
    .where(eq(dispatchLogs.id, dispatchId))
    .limit(1);

  if (!dispatch) return null;

  const [row] = await db
    .update(dispatchLogs)
    .set({ status: "cancelled" })
    .where(eq(dispatchLogs.id, dispatchId))
    .returning();

  await db
    .update(scheduleEvents)
    .set({ dispatchStatus: null })
    .where(eq(scheduleEvents.id, dispatch.eventId));

  return row;
}

export async function getPreflightData(eventId: string) {
  const [event] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);

  if (!event) return null;

  let ac = null;
  if (event.aircraftId) {
    const [row] = await db
      .select()
      .from(aircraft)
      .where(eq(aircraft.id, event.aircraftId))
      .limit(1);
    ac = row ?? null;
  }

  let pilot = null;
  if (event.studentId) {
    const [row] = await db
      .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, event.studentId))
      .limit(1);
    pilot = row ?? null;
  }

  let instructor = null;
  if (event.instructorId) {
    const [row] = await db
      .select({ id: profiles.id, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, event.instructorId))
      .limit(1);
    instructor = row ?? null;
  }

  const existingDispatch = await getDispatchByEventId(eventId);

  return {
    event,
    aircraft: ac,
    pilot,
    instructor,
    existingDispatch,
  };
}
