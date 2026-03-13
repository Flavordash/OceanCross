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
  hobbsHours?: number;
  tachHours?: number;
  hourlyRate?: number;
  year?: number | null;
  emptyWeight?: number | null;
  maxTakeoffWeight?: number | null;
  usefulLoad?: number | null;
  maxPassengers?: number | null;
  luggageCapacityLbs?: number | null;
  fuelCapacityGallons?: number | null;
  fuelUsableGallons?: number | null;
  fuelWeightLbs?: number | null;
  fuelPerWingGallons?: number | null;
  oilCapacityQuarts?: string | null;
  maxEnduranceHours?: number | null;
  vSpeeds?: Record<string, string> | null;
  notes?: string | null;
}

export interface UpdateAircraftInput {
  registration?: string;
  type?: string;
  model?: string;
  status?: AircraftStatus;
  totalHours?: number;
  hobbsHours?: number;
  tachHours?: number;
  hourlyRate?: number;
  year?: number | null;
  emptyWeight?: number | null;
  maxTakeoffWeight?: number | null;
  usefulLoad?: number | null;
  maxPassengers?: number | null;
  luggageCapacityLbs?: number | null;
  fuelCapacityGallons?: number | null;
  fuelUsableGallons?: number | null;
  fuelWeightLbs?: number | null;
  fuelPerWingGallons?: number | null;
  oilCapacityQuarts?: string | null;
  maxEnduranceHours?: number | null;
  vSpeeds?: Record<string, string> | null;
  notes?: string | null;
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
      hobbsHours: input.hobbsHours ?? 0,
      tachHours: input.tachHours ?? 0,
      hourlyRate: input.hourlyRate ?? 0,
      year: input.year ?? null,
      emptyWeight: input.emptyWeight ?? null,
      maxTakeoffWeight: input.maxTakeoffWeight ?? null,
      usefulLoad: input.usefulLoad ?? null,
      maxPassengers: input.maxPassengers ?? null,
      luggageCapacityLbs: input.luggageCapacityLbs ?? null,
      fuelCapacityGallons: input.fuelCapacityGallons ?? null,
      fuelUsableGallons: input.fuelUsableGallons ?? null,
      fuelWeightLbs: input.fuelWeightLbs ?? null,
      fuelPerWingGallons: input.fuelPerWingGallons ?? null,
      oilCapacityQuarts: input.oilCapacityQuarts ?? null,
      maxEnduranceHours: input.maxEnduranceHours ?? null,
      vSpeeds: input.vSpeeds ?? null,
      notes: input.notes ?? null,
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
  if (input.hobbsHours !== undefined) values.hobbsHours = input.hobbsHours;
  if (input.tachHours !== undefined) values.tachHours = input.tachHours;
  if (input.hourlyRate !== undefined) values.hourlyRate = input.hourlyRate;
  if (input.year !== undefined) values.year = input.year;
  if (input.emptyWeight !== undefined) values.emptyWeight = input.emptyWeight;
  if (input.maxTakeoffWeight !== undefined) values.maxTakeoffWeight = input.maxTakeoffWeight;
  if (input.usefulLoad !== undefined) values.usefulLoad = input.usefulLoad;
  if (input.maxPassengers !== undefined) values.maxPassengers = input.maxPassengers;
  if (input.luggageCapacityLbs !== undefined) values.luggageCapacityLbs = input.luggageCapacityLbs;
  if (input.fuelCapacityGallons !== undefined) values.fuelCapacityGallons = input.fuelCapacityGallons;
  if (input.fuelUsableGallons !== undefined) values.fuelUsableGallons = input.fuelUsableGallons;
  if (input.fuelWeightLbs !== undefined) values.fuelWeightLbs = input.fuelWeightLbs;
  if (input.fuelPerWingGallons !== undefined) values.fuelPerWingGallons = input.fuelPerWingGallons;
  if (input.oilCapacityQuarts !== undefined) values.oilCapacityQuarts = input.oilCapacityQuarts;
  if (input.maxEnduranceHours !== undefined) values.maxEnduranceHours = input.maxEnduranceHours;
  if (input.vSpeeds !== undefined) values.vSpeeds = input.vSpeeds;
  if (input.notes !== undefined) values.notes = input.notes;

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
    .limit(20);
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
