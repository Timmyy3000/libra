import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractTextFromSourceBytes } from "./r2";

async function makePdfBuffer(lines: string[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 760;
  for (const line of lines) {
    page.drawText(line, {
      x: 50,
      y,
      size: 18,
      font,
    });
    y -= 28;
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

describe("extractTextFromSourceBytes", () => {
  it("returns plain text content for txt sources", async () => {
    await expect(
      extractTextFromSourceBytes("books/alice.txt", Buffer.from("Alice met Bob. Alice smiled.")),
    ).resolves.toBe("Alice met Bob. Alice smiled.");
  });

  it("extracts readable text from pdf sources", async () => {
    const pdfBuffer = await makePdfBuffer([
      "Alice met Bob.",
      "Alice waved at Bob again.",
      "The Mad Hatter laughed.",
    ]);

    const text = await extractTextFromSourceBytes("books/alice.pdf", pdfBuffer);

    expect(text).toContain("Alice met Bob");
    expect(text).toContain("Alice waved at Bob again");
    expect(text).toContain("Mad Hatter laughed");
  });

  it("fails honestly for unsupported formats", async () => {
    await expect(
      extractTextFromSourceBytes("books/alice.epub", Buffer.from("not really epub")),
    ).rejects.toThrow("Only TXT and PDF source discovery are implemented right now. EPUB extraction is still pending.");
  });
});
