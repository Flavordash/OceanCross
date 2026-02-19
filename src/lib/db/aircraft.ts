import { db } from "@/lib/db";
import {
  aircraft,
  scheduleEvents,
  maintenanceJobs,
  profiles,
} from "@/db/schema";
import { eq, and, ne, desc, gte, sql } from "drizzle-orm";

export type AircraftStatus = "available" | "in_maintenance" | "grounded";

export interface CreateAircraftInput {
  registration: string;
  type: string;
  model: string;
  status?: AircraftStatus;
  totalHours?: number;
}

export interface UpdateAircraftInput {
  registration?: string;
  type?: string;
  model?: string;
  status?: AircraftStatus;
  totalHours?: number;
}

export async function getAllAircraft() {
  return db
    .select()
    .from(aircraft)
    .orderBy(aircraft.registration);
}

export async function getAircraftById(id: string) {
  const [row] = await db
    .select()
    .from(aircraft)
    .where(eq(aircraft.id, id))
    .limit(1);
  return row ?? null;
}

export async function createAircraft(input: CreateAircraftInput) {
  const [row] = await db
    .insert(aircraft)
    .values({
      registration: input.registration,
      type: input.type,
      model: input.model,
      status: input.status ?? "available",
      totalHours: input.totalHours ?? 0,
    })
    .returning();
  return row;
}

export async function updateAircraft(id: string, input: UpdateAircraftInput) {
  const values: Record<string, unknown> = {};
  if (input.registration !== undefined) values.registration = input.registration;
  if (input.type !== undefined) values.type = input.type;
  if (input.model !== undefined) values.model = input.model;
  if (input.status !== undefined) values.status = input.status;
  if (input.totalHours !== undefined) values.totalHours = input.totalHours;

  const [row] = await db
    .update(aircraft)
    .set(values)
    .where(eq(aircraft.id, id))
    .returning();
  return row;
}

export async function deleteAircraft(id: string) {
  const [row] = await db
    .delete(aircraft)
    .where(eq(aircraft.id, id))
    .returning();
  return row;
}

export async function getAircraftSchedule(aircraftId: string) {
  return db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
      status: scheduleEvents.status,
    })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.aircraftId, aircraftId),
        ne(scheduleEvents.status, "cancelled"),
        gte(scheduleEvents.startTime, new Date())
      )
    )
    .orderBy(scheduleEvents.startTime)
    .limit(10);
}

export async function getAircraftMaintenance(aircraftId: string) {
  return db
    .select({
      id: maintenanceJobs.id,
      description: maintenanceJobs.description,
      status: maintenanceJobs.status,
      bay: maintenanceJobs.bay,
      estimatedStart: maintenanceJobs.estimatedStart,
      estimatedEnd: maintenanceJobs.estimatedEnd,
      mechanicName: profiles.fullName,
    })
    .from(maintenanceJobs)
    .leftJoin(profiles, eq(maintenanceJobs.mechanicId, profiles.id))
    .where(eq(maintenanceJobs.aircraftId, aircraftId))
    .orderBy(desc(maintenanceJobs.createdAt))
    .limit(10);
}
