import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import Tesseract from "tesseract.js";

const run = (cmd: string): string => {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return "";
  }
};

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const absPath = path.resolve(filePath);

  // ── Step 1: pdftotext (instant, perfect for text-layer PDFs) ─────────────
  const pdfText = run(`pdftotext -layout "${absPath}" -`);
  if (pdfText.trim().length > 100) {
    console.log("[OCR] pdftotext succeeded");
    return pdfText;
  }

  // ── Step 2: image-based OCR fallback ─────────────────────────────────────
  console.log("[OCR] Falling back to Tesseract image OCR");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lc-ocr-"));

  try {
    run(`pdftoppm -png -r 300 "${absPath}" "${path.join(tmpDir, "page")}"`);

    const pageFiles = fs
      .readdirSync(tmpDir)
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => path.join(tmpDir, f));

    if (pageFiles.length === 0) {
      throw new Error("pdftoppm produced no images — is poppler-utils installed?");
    }

    console.log(`[OCR] Processing ${pageFiles.length} page(s)...`);

    // Create a single reusable worker — createWorker is the correct API in
    // tesseract.js v4+ for setting Tesseract parameters like PSM.
    const worker = await Tesseract.createWorker("eng");

    // PSM 1 = auto page segmentation with OSD.
    // This is the right place to set tessedit_pageseg_mode — NOT in recognize().
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
      preserve_interword_spaces: "1",
    });

    const pageTexts: string[] = [];

    for (const imgPath of pageFiles) {
      const { data } = await worker.recognize(imgPath);
      pageTexts.push(data.text);
    }

    await worker.terminate();

    return pageTexts.join("\n\n--- PAGE BREAK ---\n\n");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};