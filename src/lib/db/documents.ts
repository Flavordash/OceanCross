import { db } from "@/lib/db";
import { documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateDocumentInput {
  profileId?: string | null;
  aircraftId?: string | null;
  type: "aircraft_wb" | "medical_certificate" | "renters_insurance" | "parts_receipt" | "pilot_certificate" | "other";
  fileUrl: string;
  expiresAt?: Date | null;
  extractedData?: Record<string, unknown> | null;
}

export async function getDocumentsByProfile(profileId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.profileId, profileId))
    .orderBy(desc(documents.uploadedAt));
}

export async function getDocumentsByAircraft(aircraftId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.aircraftId, aircraftId))
    .orderBy(desc(documents.uploadedAt));
}

export async function createDocument(input: CreateDocumentInput) {
  const [row] = await db
    .insert(documents)
    .values({
      profileId: input.profileId ?? null,
      aircraftId: input.aircraftId ?? null,
      type: input.type,
      fileUrl: input.fileUrl,
      expiresAt: input.expiresAt ?? null,
      extractedData: input.extractedData ?? null,
    })
    .returning();
  return row;
}

export async function deleteDocument(id: string) {
  const [row] = await db
    .delete(documents)
    .where(eq(documents.id, id))
    .returning();
  return row;
}
