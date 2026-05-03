import mongoose, { Schema, Document } from "mongoose";

export type InvoiceDocumentType = "INR" | "USD" | "COMMERCIAL";

export interface IInvoice extends Document {
  piId: mongoose.Types.ObjectId;
  vehicleId: string;
  vehicleLineIndex: number;
  vehicleBookingId?: mongoose.Types.ObjectId | null;
  type: InvoiceDocumentType;
  invoiceNumber: string;
  invoiceDate: Date;
  containerNo?: string;
  manualFields: Record<string, any>;
  computedFields: Record<string, any>;
  filePath: string;
  packingListPath?: string;
  generatedAt: Date;
  active: boolean;
  dataSnapshot: Record<string, any>;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    piId: {
      type: Schema.Types.ObjectId,
      ref: "ProformaInvoice",
      required: true,
      index: true,
    },
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleLineIndex: {
      type: Number,
      required: true,
    },
    vehicleBookingId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleBooking",
      default: null,
    },
    type: {
      type: String,
      enum: ["INR", "USD", "COMMERCIAL"],
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    containerNo: {
      type: String,
      default: "",
      trim: true,
    },
    manualFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    computedFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    filePath: {
      type: String,
      required: true,
    },
    packingListPath: {
      type: String,
      default: "",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    dataSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

invoiceSchema.index(
  { piId: 1, vehicleId: 1, type: 1, active: 1 },
  { name: "pi_vehicle_type_active_idx" },
);

export default mongoose.model<IInvoice>("Invoice", invoiceSchema);
