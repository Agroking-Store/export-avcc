import { Request, Response } from "express";
import mongoose from "mongoose";
import { extractTextFromPDF } from "../services/ocr.service";
import { parseLC } from "../services/lcParser.service";
import { compareLCWithPI } from "../services/compare.service";
import { getPIData, updatePIStatusService } from "../services/pi.service";
import LetterOfCredit from "../models/LetterOfCredit.model";

export const uploadLC = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) return res.status(400).json({ message: "Invalid PI ID" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = req.file.path;

    // Step 1: OCR
    console.log("[LC Upload] Starting OCR for:", filePath);
    const rawText = await extractTextFromPDF(filePath);
    console.log("[LC Upload] OCR complete, text length:", rawText.length);

    // Step 2: Parse
    const lcData = parseLC(rawText);
    console.log("[LC Upload] Parsed LC data:", lcData);

    // Step 3: Fetch PI directly from DB (no HTTP round-trip)
    const piData = await getPIData(id);
    console.log("[LC Upload] PI fetched, totalAmount:", (piData as any).totalAmount);

    // Step 4: Compare
    const comparison = compareLCWithPI(lcData, piData);
    console.log(
      "[LC Upload] Result:", comparison.status,
      "mismatches:", comparison.mismatches.length,
      "wrongLC:", comparison.wrongLCAttached
    );

    // Step 5: Persist LC record
    await LetterOfCredit.create({
      pi_id: new mongoose.Types.ObjectId(id),
      documentUrl: filePath,
      lcNumber: lcData.lcNumber,
      status: "uploaded",
      extractedData: lcData,
    });

    // Step 6: Update PI status
    await updatePIStatusService(id, "lc_received");

    return res.status(201).json({
      success: true,
      ocr: { textLength: rawText.length, extracted: lcData },
      comparison: {
        status: comparison.status,
        mismatches: comparison.mismatches,
        matchedFields: comparison.matchedFields,
        vehicleMismatch: comparison.vehicleMismatch,
        // Front-end uses this to show "Wrong LC Attached" banner
        wrongLCAttached: comparison.wrongLCAttached,
      },
    });
  } catch (error: any) {
    console.error("[LC Upload] Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};