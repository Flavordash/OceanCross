// Use dynamic import to load the legacy build at runtime (Node.js compatible)
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (item.str as string) ?? "")
      .join(" ");
    if (text.trim()) pages.push(text);
  }

  return pages.join("\n");
}
