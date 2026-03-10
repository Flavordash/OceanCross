import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/parsers/pdf-parser";
import { extractTextFromImage } from "@/lib/parsers/ocr-parser";
import {
  extractAircraft,
  extractCredential,
  extractParts,
} from "@/lib/parsers/regex-patterns";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as string | null; // aircraft | credential | parts

    if (!file || !docType) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // Extract text based on file type
    let text = "";
    if (ext === "pdf") {
      text = await extractTextFromPDF(buffer);
      // If PDF has very little text (scanned), fall back to OCR
      if (text.trim().length < 50) {
        // For scanned PDFs we'd need pdf2image conversion;
        // for now, note the limitation
        text = text || "(Scanned PDF — OCR not available server-side for PDF images)";
      }
    } else if (["png", "jpg", "jpeg", "tiff", "bmp", "webp"].includes(ext)) {
      text = await extractTextFromImage(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF or image files." },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `uploads/${user.id}/${timestamp}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    // Storage upload is best-effort; don't fail the extraction if storage is not configured
    const fileUrl = uploadError ? null : storagePath;

    // Extract structured data
    let extracted = {};
    if (docType === "aircraft") {
      extracted = extractAircraft(text);
    } else if (docType === "credential") {
      extracted = extractCredential(text);
    } else if (docType === "parts") {
      extracted = extractParts(text);
    }

    return NextResponse.json({
      raw_text: text,
      extracted,
      file_url: fileUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}
