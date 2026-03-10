import { db } from "@/lib/db";
import {
  profiles,
  scheduleEvents,
  maintenanceJobs,
  aircraft,
  clientTags,
  profileTags,
} from "@/db/schema";
import { eq, and, ne, desc, sql, inArray } from "drizzle-orm";

// ── Clients ───────────────────────────────────────────

export async function getClients() {
  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(inArray(profiles.role, ["client", "student", "customer"]))
    .orderBy(profiles.fullName);

  return rows;
}

export interface CreateClientInput {
  fullName: string;
  email: string;
  phone?: string | null;
}

export async function createClient(input: CreateClientInput) {
  const [row] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      role: "client",
    })
    .returning();
  return row;
}

export async function getClientWithStats(clientId: string) {
  // Completed flight hours (sum of event durations where type=flight_training, status=completed)
  const [hours] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(extract(epoch from (end_time - start_time)) / 60), 0)`,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.studentId, clientId),
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
        eq(scheduleEvents.studentId, clientId),
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

export async function getClientHistory(clientId: string) {
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
        eq(scheduleEvents.studentId, clientId),
        ne(scheduleEvents.status, "cancelled")
      )
    )
    .orderBy(desc(scheduleEvents.startTime))
    .limit(20);
}

// ── Client Tags ───────────────────────────────────────

export async function getAllClientTags() {
  return db
    .select()
    .from(clientTags)
    .orderBy(clientTags.name);
}

export async function createClientTag(name: string, color: string) {
  const [row] = await db
    .insert(clientTags)
    .values({ name, color })
    .returning();
  return row;
}

export async function deleteClientTag(id: string) {
  const [row] = await db
    .delete(clientTags)
    .where(eq(clientTags.id, id))
    .returning();
  return row ?? null;
}

export async function getProfileTags(profileId: string) {
  return db
    .select({
      id: clientTags.id,
      name: clientTags.name,
      color: clientTags.color,
    })
    .from(profileTags)
    .innerJoin(clientTags, eq(profileTags.tagId, clientTags.id))
    .where(eq(profileTags.profileId, profileId));
}

export async function getProfilesWithTags(profileIds: string[]) {
  if (profileIds.length === 0) return {};

  const rows = await db
    .select({
      profileId: profileTags.profileId,
      tagId: clientTags.id,
      tagName: clientTags.name,
      tagColor: clientTags.color,
    })
    .from(profileTags)
    .innerJoin(clientTags, eq(profileTags.tagId, clientTags.id))
    .where(inArray(profileTags.profileId, profileIds));

  const map: Record<string, { id: string; name: string; color: string }[]> = {};
  for (const r of rows) {
    if (!map[r.profileId]) map[r.profileId] = [];
    map[r.profileId].push({ id: r.tagId, name: r.tagName, color: r.tagColor });
  }
  return map;
}

export async function setProfileTags(profileId: string, tagIds: string[]) {
  // Delete existing tags
  await db
    .delete(profileTags)
    .where(eq(profileTags.profileId, profileId));

  // Insert new tags
  if (tagIds.length > 0) {
    await db.insert(profileTags).values(
      tagIds.map((tagId) => ({ profileId, tagId }))
    );
  }
}

// ── Mechanics ──────────────────────────────────────────

export interface CreateMechanicInput {
  fullName: string;
  email: string;
  phone?: string | null;
}

export async function createMechanic(input: CreateMechanicInput) {
  const [row] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      role: "mechanic",
    })
    .returning();
  return row;
}

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
