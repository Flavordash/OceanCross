import { db } from "@/lib/db";
import {
  profiles,
  scheduleEvents,
  aircraft,
  instructorSettings,
  instructorSpecialties,
  instructorSpecialtyAssignments,
} from "@/db/schema";
import { eq, and, ne, desc, sql } from "drizzle-orm";

// ── Instructor List ────────────────────────────────────

export async function getInstructors() {
  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.role, "instructor"))
    .orderBy(profiles.fullName);
}

export async function getInstructorWithStats(instructorId: string) {
  // Teaching hours (completed events where instructor)
  const [hours] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(extract(epoch from (end_time - start_time)) / 60), 0)`,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.instructorId, instructorId),
        eq(scheduleEvents.status, "completed")
      )
    );

  // Settings (authorization + CFI)
  const [settings] = await db
    .select()
    .from(instructorSettings)
    .where(eq(instructorSettings.profileId, instructorId))
    .limit(1);

  // Most recent flight
  const [recentFlight] = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      startTime: scheduleEvents.startTime,
      type: scheduleEvents.type,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.instructorId, instructorId),
        eq(scheduleEvents.status, "completed")
      )
    )
    .orderBy(desc(scheduleEvents.startTime))
    .limit(1);

  // Specialties with rates
  const assignments = await db
    .select({
      id: instructorSpecialtyAssignments.id,
      specialtyName: instructorSpecialties.name,
      hourlyRate: instructorSpecialtyAssignments.hourlyRate,
    })
    .from(instructorSpecialtyAssignments)
    .innerJoin(instructorSpecialties, eq(instructorSpecialtyAssignments.specialtyId, instructorSpecialties.id))
    .where(eq(instructorSpecialtyAssignments.instructorId, instructorId));

  const rates = assignments.map((a) => a.hourlyRate).filter((r) => r > 0);

  return {
    teachingHours: Math.round((hours?.totalMinutes ?? 0) / 60 * 10) / 10,
    isAuthorized: settings?.isAuthorized ?? true,
    cfiExpiration: settings?.cfiExpiration ?? null,
    specialties: assignments.map((a) => ({ name: a.specialtyName, hourlyRate: a.hourlyRate })),
    recentFlight: recentFlight ?? null,
    rateRange: rates.length > 0 ? { min: Math.min(...rates), max: Math.max(...rates) } : null,
  };
}

// ── Create Instructor ──────────────────────────────────

export async function createInstructor(input: { fullName: string; email: string; phone?: string | null }) {
  const [row] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      role: "instructor",
    })
    .returning();
  return row;
}

// ── Instructor Settings (upsert) ───────────────────────

export async function getInstructorSettings(profileId: string) {
  const [row] = await db
    .select()
    .from(instructorSettings)
    .where(eq(instructorSettings.profileId, profileId))
    .limit(1);
  return row ?? null;
}

export async function upsertInstructorSettings(
  profileId: string,
  input: {
    cfiNumber?: string | null;
    cfiExpiration?: string | null;
    isAuthorized?: boolean;
    groundRate?: number;
    flightRate?: number;
    notes?: string | null;
  }
) {
  const existing = await getInstructorSettings(profileId);

  const data = {
    cfiNumber: input.cfiNumber ?? null,
    cfiExpiration: input.cfiExpiration ? new Date(input.cfiExpiration) : null,
    isAuthorized: input.isAuthorized ?? true,
    groundRate: input.groundRate ?? 0,
    flightRate: input.flightRate ?? 0,
    notes: input.notes ?? null,
  };

  if (existing) {
    const [row] = await db
      .update(instructorSettings)
      .set(data)
      .where(eq(instructorSettings.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(instructorSettings)
    .values({ profileId, ...data })
    .returning();
  return row;
}

// ── Specialties Catalog (Admin CRUD) ───────────────────

export async function getAllSpecialties() {
  return db
    .select()
    .from(instructorSpecialties)
    .orderBy(instructorSpecialties.name);
}

export async function createSpecialty(name: string) {
  const [row] = await db
    .insert(instructorSpecialties)
    .values({ name })
    .returning();
  return row;
}

export async function deleteSpecialty(id: string) {
  const [row] = await db
    .delete(instructorSpecialties)
    .where(eq(instructorSpecialties.id, id))
    .returning();
  return row ?? null;
}

// ── Specialty Assignments (per instructor) ─────────────

export async function getInstructorAssignments(profileId: string) {
  return db
    .select({
      id: instructorSpecialtyAssignments.id,
      specialtyId: instructorSpecialtyAssignments.specialtyId,
      specialtyName: instructorSpecialties.name,
      hourlyRate: instructorSpecialtyAssignments.hourlyRate,
    })
    .from(instructorSpecialtyAssignments)
    .innerJoin(instructorSpecialties, eq(instructorSpecialtyAssignments.specialtyId, instructorSpecialties.id))
    .where(eq(instructorSpecialtyAssignments.instructorId, profileId))
    .orderBy(instructorSpecialties.name);
}

export async function assignSpecialty(input: {
  instructorId: string;
  specialtyId: string;
  hourlyRate: number;
}) {
  const [row] = await db
    .insert(instructorSpecialtyAssignments)
    .values({
      instructorId: input.instructorId,
      specialtyId: input.specialtyId,
      hourlyRate: input.hourlyRate,
    })
    .returning();
  return row;
}

export async function updateAssignmentRate(id: string, hourlyRate: number) {
  const [row] = await db
    .update(instructorSpecialtyAssignments)
    .set({ hourlyRate })
    .where(eq(instructorSpecialtyAssignments.id, id))
    .returning();
  return row ?? null;
}

export async function removeAssignment(id: string) {
  const [row] = await db
    .delete(instructorSpecialtyAssignments)
    .where(eq(instructorSpecialtyAssignments.id, id))
    .returning();
  return row ?? null;
}

// ── Teaching History ───────────────────────────────────

export async function getInstructorHistory(instructorId: string) {
  return db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
      status: scheduleEvents.status,
      aircraftReg: aircraft.registration,
      studentName: sql<string>`sp.full_name`,
    })
    .from(scheduleEvents)
    .leftJoin(aircraft, eq(scheduleEvents.aircraftId, aircraft.id))
    .leftJoin(
      sql`profiles as sp`,
      sql`${scheduleEvents.studentId} = sp.id`
    )
    .where(
      and(
        eq(scheduleEvents.instructorId, instructorId),
        ne(scheduleEvents.status, "cancelled")
      )
    )
    .orderBy(desc(scheduleEvents.startTime))
    .limit(20);
}
