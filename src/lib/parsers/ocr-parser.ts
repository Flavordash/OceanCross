import Tesseract from "tesseract.js";

export async function extractTextFromImage(
  buffer: ArrayBuffer,
  lang = "eng"
): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(Buffer.from(buffer), lang);
    return text.trim();
  } catch (err) {
    console.error("OCR extraction failed:", err);
    return "";
  }
}
