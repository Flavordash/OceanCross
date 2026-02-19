import { db } from "@/lib/db";
import {
  profiles,
  scheduleEvents,
  maintenanceJobs,
  aircraft,
} from "@/db/schema";
import { eq, and, ne, desc, sql } from "drizzle-orm";

// ── Students ───────────────────────────────────────────

export async function getStudents() {
  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.role, "student"))
    .orderBy(profiles.fullName);

  return rows;
}

export async function getStudentWithStats(studentId: string) {
  // Completed flight hours (sum of event durations where type=flight_training, status=completed)
  const [hours] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(extract(epoch from (end_time - start_time)) / 60), 0)`,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.studentId, studentId),
        eq(scheduleEvents.type, "flight_training"),
        eq(scheduleEvents.status, "completed")
      )
    );

  // Next upcoming booking
  const [nextBooking] = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      startTime: scheduleEvents.startTime,
      type: scheduleEvents.type,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.studentId, studentId),
        ne(scheduleEvents.status, "cancelled"),
        sql`${scheduleEvents.startTime} >= now()`
      )
    )
    .orderBy(scheduleEvents.startTime)
    .limit(1);

  return {
    totalHours: Math.round((hours?.totalMinutes ?? 0) / 60 * 10) / 10,
    nextBooking: nextBooking ?? null,
  };
}

export async function getStudentHistory(studentId: string) {
  return db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
      status: scheduleEvents.status,
      aircraftReg: aircraft.registration,
    })
    .from(scheduleEvents)
    .leftJoin(aircraft, eq(scheduleEvents.aircraftId, aircraft.id))
    .where(
      and(
        eq(scheduleEvents.studentId, studentId),
        ne(scheduleEvents.status, "cancelled")
      )
    )
    .orderBy(desc(scheduleEvents.startTime))
    .limit(20);
}

// ── Mechanics ──────────────────────────────────────────

export async function getMechanics() {
  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.role, "mechanic"))
    .orderBy(profiles.fullName);
}

export async function getMechanicJobs(mechanicId: string) {
  return db
    .select({
      id: maintenanceJobs.id,
      description: maintenanceJobs.description,
      status: maintenanceJobs.status,
      bay: maintenanceJobs.bay,
      estimatedStart: maintenanceJobs.estimatedStart,
      estimatedEnd: maintenanceJobs.estimatedEnd,
      aircraftReg: aircraft.registration,
      aircraftModel: aircraft.model,
    })
    .from(maintenanceJobs)
    .leftJoin(aircraft, eq(maintenanceJobs.aircraftId, aircraft.id))
    .where(eq(maintenanceJobs.mechanicId, mechanicId))
    .orderBy(desc(maintenanceJobs.createdAt))
    .limit(20);
}

export async function getMechanicActiveJobCount(mechanicId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(maintenanceJobs)
    .where(
      and(
        eq(maintenanceJobs.mechanicId, mechanicId),
        ne(maintenanceJobs.status, "completed")
      )
    );
  return row?.count ?? 0;
}
