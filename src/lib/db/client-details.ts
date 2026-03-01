import { db } from "@/lib/db";
import { clientDetails } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ClientDetailInput {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  driversLicense?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export async function getClientDetails(profileId: string) {
  const [row] = await db
    .select()
    .from(clientDetails)
    .where(eq(clientDetails.profileId, profileId))
    .limit(1);
  return row ?? null;
}

export async function upsertClientDetails(profileId: string, input: ClientDetailInput) {
  const existing = await getClientDetails(profileId);

  if (existing) {
    const [row] = await db
      .update(clientDetails)
      .set({
        address: input.address ?? existing.address,
        city: input.city ?? existing.city,
        state: input.state ?? existing.state,
        zip: input.zip ?? existing.zip,
        country: input.country ?? existing.country,
        gender: input.gender ?? existing.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : existing.dateOfBirth,
        driversLicense: input.driversLicense ?? existing.driversLicense,
        passportNumber: input.passportNumber ?? existing.passportNumber,
        passportExpiry: input.passportExpiry ? new Date(input.passportExpiry) : existing.passportExpiry,
        emergencyContactName: input.emergencyContactName ?? existing.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone ?? existing.emergencyContactPhone,
        notes: input.notes ?? existing.notes,
      })
      .where(eq(clientDetails.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(clientDetails)
    .values({
      profileId,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      country: input.country ?? null,
      gender: input.gender ?? null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      driversLicense: input.driversLicense ?? null,
      passportNumber: input.passportNumber ?? null,
      passportExpiry: input.passportExpiry ? new Date(input.passportExpiry) : null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}
