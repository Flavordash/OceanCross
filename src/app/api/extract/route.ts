import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const visionModel = openai("gpt-4o-mini");

// ── Zod schemas for each document type ──────────────────

const AircraftSchema = z.object({
  registration: z
    .string()
    .nullable()
    .describe("Aircraft N-number (e.g. N12345)"),
  model: z
    .string()
    .nullable()
    .describe("Aircraft model (e.g. Cessna 172S, Piper PA-28-161)"),
  year: z.number().int().nullable().describe("Year of manufacture (4-digit)"),
  empty_weight: z
    .number()
    .nullable()
    .describe("Basic empty weight in lbs"),
  max_takeoff_weight: z
    .number()
    .nullable()
    .describe("Maximum takeoff weight (MTOW / gross weight) in lbs"),
  useful_load: z
    .number()
    .nullable()
    .describe("Useful load in lbs. If not stated, derive as MTOW - empty_weight"),
  max_passengers: z
    .number()
    .int()
    .nullable()
    .describe("Maximum seats / occupants including pilot"),
  luggage_capacity_lbs: z
    .number()
    .nullable()
    .describe("Baggage / luggage compartment capacity in lbs"),
  fuel_capacity_gallons: z
    .number()
    .nullable()
    .describe("Total fuel capacity in US gallons"),
  fuel_usable_gallons: z
    .number()
    .nullable()
    .describe("Usable fuel in US gallons"),
  fuel_weight_lbs: z
    .number()
    .nullable()
    .describe("Total fuel weight in lbs (often fuel_capacity × 6.0)"),
  fuel_per_wing_gallons: z
    .number()
    .nullable()
    .describe("Fuel per wing / tank in US gallons"),
  oil_capacity_quarts: z
    .string()
    .nullable()
    .describe("Oil capacity as a string (e.g. '8 qts' or '6–8 qts')"),
  max_endurance_hours: z
    .number()
    .nullable()
    .describe("Maximum endurance in hours (not leaned)"),
  v_speeds: z
    .object({
      Vr: z.string().nullable().describe("Rotation speed in knots"),
      Vx: z.string().nullable().describe("Best angle of climb in knots"),
      Vy: z.string().nullable().describe("Best rate of climb in knots"),
      Va: z.string().nullable().describe("Maneuvering speed in knots"),
      Vs: z.string().nullable().describe("Stall speed clean in knots"),
      Vso: z.string().nullable().describe("Stall speed landing config in knots"),
      Vfe: z.string().nullable().describe("Max flap extended speed in knots"),
      Vno: z.string().nullable().describe("Max structural cruising speed in knots"),
      Vne: z.string().nullable().describe("Never exceed speed in knots"),
      best_glide: z.string().nullable().describe("Best glide speed in knots"),
      climb: z.string().nullable().describe("Normal climb speed in knots"),
      max_crosswind: z.string().nullable().describe("Max crosswind component in knots"),
    })
    .describe("V-speeds — use null for any speed not found in the document. All values as strings in knots."),
  stations: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Station name (e.g. Front Seats, Rear Seats, Baggage Area)"),
        arm: z.number().describe("Moment arm in inches from datum"),
        max_weight: z
          .number()
          .describe("Maximum allowable weight at this station in lbs"),
      })
    )
    .describe("Weight & Balance loading stations from the W&B table"),
});

const CredentialSchema = z.object({
  document_type: z
    .enum(["medical_certificate", "renters_insurance", "pilot_certificate"])
    .nullable()
    .describe("Type of aviation document"),
  holder_name: z
    .string()
    .nullable()
    .describe("Full name of the certificate or policy holder"),
  expiry_date: z
    .string()
    .nullable()
    .describe("Expiration date in ISO format YYYY-MM-DD"),
  medical_class: z
    .enum(["1st_class", "2nd_class", "3rd_class", "basicmed"])
    .nullable()
    .describe("Medical certificate class (only for medical_certificate type)"),
  certificate_number: z
    .string()
    .nullable()
    .describe("Certificate or policy number"),
});

const PartsSchema = z.object({
  part_name: z
    .string()
    .nullable()
    .describe("Name or description of the part"),
  part_number: z
    .string()
    .nullable()
    .describe("Part number or P/N"),
  supplier: z.string().nullable().describe("Supplier or vendor name"),
  order_date: z
    .string()
    .nullable()
    .describe("Order date in YYYY-MM-DD format"),
  estimated_arrival: z
    .string()
    .nullable()
    .describe("Estimated arrival date in YYYY-MM-DD format"),
  cost: z.number().nullable().describe("Total cost in USD"),
});

const SYSTEM_PROMPT = `You are an expert aviation document parser specializing in FAA-format documents.
Extract structured data from the provided document text. Rules:
- Return null for any field not clearly present in the document.
- Be precise with numbers — do not guess or estimate.
- For W&B stations: look for tables listing station name, arm (inches from datum), and max weight (lbs).
- For V-speeds: values are in KIAS/KCAS. Map to standard keys: Vr, Vx, Vy, Va, Vs, Vso, Vfe, Vno, Vne, best_glide, climb, max_crosswind.
- For useful_load: if not explicitly stated, compute as max_takeoff_weight - empty_weight.
- For fuel_weight_lbs: if not stated, compute as fuel_capacity_gallons * 6.0 (avgas weight).`;

// ── Route handler ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { images, type } = body as { images: string[]; type: string };

    if (!images?.length || !type) {
      return NextResponse.json(
        { error: "images and type are required" },
        { status: 400 }
      );
    }

    let schema: z.ZodTypeAny;
    if (type === "aircraft") schema = AircraftSchema;
    else if (type === "credential") schema = CredentialSchema;
    else if (type === "parts") schema = PartsSchema;
    else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Send images directly to GPT-4o-mini vision
    const result = await generateText({
      model: visionModel,
      output: Output.object({ schema }),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Document type: ${type}\n\nExtract all relevant aviation data from these document images:`,
            },
            // Max 5 pages to keep costs low
            ...images.slice(0, 5).map((img) => ({
              type: "image" as const,
              image: img,
            })),
          ],
        },
      ],
    });

    return NextResponse.json({ extracted: result.output });
  } catch (err) {
    console.error("AI extract error:", err);
    return NextResponse.json(
      { error: "AI extraction failed" },
      { status: 500 }
    );
  }
}
