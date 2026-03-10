import { db } from "@/lib/db";
import {
  partsOrders,
  maintenanceJobs,
  aircraft,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface CreatePartsOrderInput {
  jobId?: string | null;
  partName: string;
  supplier?: string | null;
  orderDate?: Date;
  estimatedArrival?: Date | null;
  status?: "ordered" | "shipped" | "delivered";
}

export interface UpdatePartsOrderInput {
  partName?: string;
  supplier?: string | null;
  status?: "ordered" | "shipped" | "delivered";
  estimatedArrival?: Date | null;
  actualArrival?: Date | null;
}

export async function getAllPartsOrders() {
  return db
    .select({
      id: partsOrders.id,
      partName: partsOrders.partName,
      supplier: partsOrders.supplier,
      status: partsOrders.status,
      orderDate: partsOrders.orderDate,
      estimatedArrival: partsOrders.estimatedArrival,
      actualArrival: partsOrders.actualArrival,
      jobId: partsOrders.jobId,
      jobDescription: maintenanceJobs.description,
      aircraftRegistration: aircraft.registration,
    })
    .from(partsOrders)
    .leftJoin(maintenanceJobs, eq(partsOrders.jobId, maintenanceJobs.id))
    .leftJoin(aircraft, eq(maintenanceJobs.aircraftId, aircraft.id))
    .orderBy(desc(partsOrders.orderDate));
}

export async function createPartsOrder(input: CreatePartsOrderInput) {
  const [row] = await db
    .insert(partsOrders)
    .values({
      jobId: input.jobId ?? null,
      partName: input.partName,
      supplier: input.supplier ?? null,
      orderDate: input.orderDate ?? new Date(),
      estimatedArrival: input.estimatedArrival ?? null,
      status: input.status ?? "ordered",
    })
    .returning();
  return row;
}

export async function updatePartsOrder(id: string, input: UpdatePartsOrderInput) {
  const values: Record<string, unknown> = {};
  if (input.partName !== undefined) values.partName = input.partName;
  if (input.supplier !== undefined) values.supplier = input.supplier;
  if (input.status !== undefined) values.status = input.status;
  if (input.estimatedArrival !== undefined) values.estimatedArrival = input.estimatedArrival;
  if (input.actualArrival !== undefined) values.actualArrival = input.actualArrival;

  const [row] = await db
    .update(partsOrders)
    .set(values)
    .where(eq(partsOrders.id, id))
    .returning();
  return row;
}

export async function deletePartsOrder(id: string) {
  const [row] = await db
    .delete(partsOrders)
    .where(eq(partsOrders.id, id))
    .returning();
  return row;
}
