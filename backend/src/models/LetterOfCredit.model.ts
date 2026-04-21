// backend/src/models/LetterOfCredit.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ILetterOfCredit extends Document {
  pi_id: mongoose.Types.ObjectId;
  lcNumber?: string;
  documentUrl: string;
  status: "uploaded" | "verified" | "rejected";
  uploadedAt: Date;
  extractedData?: any; // 🔥 add this
}

const letterOfCreditSchema = new Schema<ILetterOfCredit>(
  {
    pi_id: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
      required: true,
    },
    lcNumber: { type: String },
    documentUrl: { type: String, required: true },
    extractedData: {
      type: Object, // 🔥 add this
    },
    status: {
      type: String,
      enum: ["uploaded", "verified", "rejected"],
      default: "uploaded",
    },
  },
  { timestamps: { createdAt: "uploadedAt" } },
);

export default mongoose.model<ILetterOfCredit>(
  "LetterOfCredit",
  letterOfCreditSchema,
);
