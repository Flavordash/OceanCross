import { db } from "@/lib/db";
import {
  pilotInfo,
  pilotCourses,
  pilotAircraftCheckouts,
  pilotPreferredInstructors,
  aircraft,
  profiles,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────

export interface PilotInfoInput {
  trainingStatus?: string | null;
  preferredLocation?: string | null;
  lastFlightReview?: string | null;
  rentersInsuranceExpiry?: string | null;
  medicalClass?: string | null;
  medicalExpires?: string | null;
  ftn?: string | null;
  soloDate?: string | null;
  certificate?: string | null;
  certificateType?: string | null;
  issuedBy?: string | null;
  dateIssued?: string | null;
  certificateNumber?: string | null;
  cfiExpiration?: string | null;
  craftCategories?: string[];
  endorsements?: string[];
  classRatings?: string[];
  otherRatings?: string[];
  tsaEvidenceShown?: string | null;
  tsaEndorsementsVerified?: boolean | null;
  tsaNotes?: string | null;
}

function toDate(val: string | null | undefined): Date | null {
  return val ? new Date(val) : null;
}

// ── Pilot Info (scalar, upsert) ────────────────────────

export async function getPilotInfo(profileId: string) {
  const [row] = await db
    .select()
    .from(pilotInfo)
    .where(eq(pilotInfo.profileId, profileId))
    .limit(1);
  return row ?? null;
}

export async function upsertPilotInfo(profileId: string, input: PilotInfoInput) {
  const existing = await getPilotInfo(profileId);

  const data = {
    trainingStatus: input.trainingStatus as typeof pilotInfo.$inferInsert.trainingStatus,
    preferredLocation: input.preferredLocation ?? null,
    lastFlightReview: toDate(input.lastFlightReview),
    rentersInsuranceExpiry: toDate(input.rentersInsuranceExpiry),
    medicalClass: input.medicalClass as typeof pilotInfo.$inferInsert.medicalClass,
    medicalExpires: toDate(input.medicalExpires),
    ftn: input.ftn ?? null,
    soloDate: toDate(input.soloDate),
    certificate: input.certificate as typeof pilotInfo.$inferInsert.certificate,
    certificateType: input.certificateType as typeof pilotInfo.$inferInsert.certificateType,
    issuedBy: input.issuedBy ?? null,
    dateIssued: toDate(input.dateIssued),
    certificateNumber: input.certificateNumber ?? null,
    cfiExpiration: toDate(input.cfiExpiration),
    craftCategories: input.craftCategories ?? [],
    endorsements: input.endorsements ?? [],
    classRatings: input.classRatings ?? [],
    otherRatings: input.otherRatings ?? [],
    tsaEvidenceShown: input.tsaEvidenceShown as typeof pilotInfo.$inferInsert.tsaEvidenceShown,
    tsaEndorsementsVerified: input.tsaEndorsementsVerified ?? false,
    tsaNotes: input.tsaNotes ?? null,
  };

  if (existing) {
    const [row] = await db
      .update(pilotInfo)
      .set(data)
      .where(eq(pilotInfo.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(pilotInfo)
    .values({ profileId, ...data })
    .returning();
  return row;
}

// ── Courses (CRUD) ─────────────────────────────────────

export async function getPilotCourses(profileId: string) {
  return db
    .select()
    .from(pilotCourses)
    .where(eq(pilotCourses.profileId, profileId))
    .orderBy(desc(pilotCourses.enrolledDate));
}

export async function createPilotCourse(input: {
  profileId: string;
  courseName: string;
  status?: string;
  enrolledDate?: string;
}) {
  const [row] = await db
    .insert(pilotCourses)
    .values({
      profileId: input.profileId,
      courseName: input.courseName,
      status: (input.status as typeof pilotCourses.$inferInsert.status) ?? "enrolled",
      enrolledDate: input.enrolledDate ? new Date(input.enrolledDate) : new Date(),
    })
    .returning();
  return row;
}

export async function updatePilotCourse(id: string, input: { status?: string; completedDate?: string | null }) {
  const values: Record<string, unknown> = {};
  if (input.status !== undefined) values.status = input.status;
  if (input.completedDate !== undefined) values.completedDate = input.completedDate ? new Date(input.completedDate) : null;

  const [row] = await db
    .update(pilotCourses)
    .set(values)
    .where(eq(pilotCourses.id, id))
    .returning();
  return row ?? null;
}

export async function deletePilotCourse(id: string) {
  const [row] = await db
    .delete(pilotCourses)
    .where(eq(pilotCourses.id, id))
    .returning();
  return row ?? null;
}

// ── Aircraft Checkouts (CRUD + JOIN) ───────────────────

export async function getPilotCheckouts(profileId: string) {
  return db
    .select({
      id: pilotAircraftCheckouts.id,
      aircraftId: pilotAircraftCheckouts.aircraftId,
      aircraftReg: aircraft.registration,
      aircraftModel: aircraft.model,
      checkoutDate: pilotAircraftCheckouts.checkoutDate,
      checkedOutBy: pilotAircraftCheckouts.checkedOutBy,
      checkedOutByName: sql<string>`cb.full_name`,
    })
    .from(pilotAircraftCheckouts)
    .leftJoin(aircraft, eq(pilotAircraftCheckouts.aircraftId, aircraft.id))
    .leftJoin(
      sql`profiles as cb`,
      sql`${pilotAircraftCheckouts.checkedOutBy} = cb.id`
    )
    .where(eq(pilotAircraftCheckouts.profileId, profileId))
    .orderBy(desc(pilotAircraftCheckouts.checkoutDate));
}

export async function createPilotCheckout(input: {
  profileId: string;
  aircraftId: string;
  checkedOutBy: string;
  checkoutDate?: string;
}) {
  const [row] = await db
    .insert(pilotAircraftCheckouts)
    .values({
      profileId: input.profileId,
      aircraftId: input.aircraftId,
      checkedOutBy: input.checkedOutBy,
      checkoutDate: input.checkoutDate ? new Date(input.checkoutDate) : new Date(),
    })
    .returning();
  return row;
}

export async function deletePilotCheckout(id: string) {
  const [row] = await db
    .delete(pilotAircraftCheckouts)
    .where(eq(pilotAircraftCheckouts.id, id))
    .returning();
  return row ?? null;
}

// ── Preferred Instructors (CRUD + JOIN) ────────────────

export async function getPilotPreferredInstructors(profileId: string) {
  return db
    .select({
      id: pilotPreferredInstructors.id,
      instructorId: pilotPreferredInstructors.instructorId,
      instructorName: profiles.fullName,
      addedDate: pilotPreferredInstructors.addedDate,
      addedBy: pilotPreferredInstructors.addedBy,
    })
    .from(pilotPreferredInstructors)
    .leftJoin(profiles, eq(pilotPreferredInstructors.instructorId, profiles.id))
    .where(eq(pilotPreferredInstructors.profileId, profileId))
    .orderBy(desc(pilotPreferredInstructors.addedDate));
}

export async function addPilotPreferredInstructor(input: {
  profileId: string;
  instructorId: string;
  addedBy: string;
}) {
  const [row] = await db
    .insert(pilotPreferredInstructors)
    .values({
      profileId: input.profileId,
      instructorId: input.instructorId,
      addedBy: input.addedBy,
    })
    .returning();
  return row;
}

export async function removePilotPreferredInstructor(id: string) {
  const [row] = await db
    .delete(pilotPreferredInstructors)
    .where(eq(pilotPreferredInstructors.id, id))
    .returning();
  return row ?? null;
}

// ── Lookup helpers ─────────────────────────────────────

export async function getInstructorList() {
  return db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.role, "instructor"));
}

export async function getAircraftList() {
  return db
    .select({
      id: aircraft.id,
      registration: aircraft.registration,
      model: aircraft.model,
    })
    .from(aircraft);
}
