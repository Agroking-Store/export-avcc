import mongoose, { Document, Schema } from "mongoose";

export type VehicleBookingStatus =
  | "pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "delivered";

export interface IVehicleBooking extends Document {
  orderId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleIndex: number;
  assignedClientId?: mongoose.Types.ObjectId;
  assignedClientSnapshot?: {
    name: string;
    companyName?: string;
    clientCode?: string;
  };
  status: VehicleBookingStatus;
  quotationFile?: string;
  rejectionReason?: string;
  paymentAmount?: number;
  paymentReference?: string;
  engineNumber?: string;
  chassisNumber?: string;
  deliveryDate?: Date;
  lastReminderAt?: Date;
  reminderCount?: number;
  documents: {
    form20?: string;
    form21?: string;
    form22?: string;
    tempRegCert?: string;
    bvCertificate?: string;
    dealerInvoice?: string;
  };
  isCRTMUploaded: boolean;
  isBVUploaded: boolean;
  isDealerInvoiceUploaded: boolean;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: string;
  hsnCode?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedDealerId?: mongoose.Types.ObjectId;
  assignedDealerSnapshot?: {
    name: string;
    contact?: string;
    gstNumber?: string;
  };
}

const vehicleBookingSchema = new Schema<IVehicleBooking>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleOrder",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleListItem",
      required: true,
    },
    vehicleIndex: {
      type: Number,
      required: true,
    },
    assignedClientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    assignedClientSnapshot: {
      name: { type: String, trim: true, default: "" },
      companyName: { type: String, trim: true, default: "" },
      clientCode: { type: String, trim: true, default: "" },
    },
    assignedDealerId: {
      type: Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },
    assignedDealerSnapshot: {
      name: { type: String, trim: true, default: "" },
      contact: { type: String, trim: true, default: "" },
      gstNumber: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "quotation_uploaded",
        "approved",
        "rejected",
        "payment_done",
        "chassis_received",
        "delivered",
      ],
      default: "pending",
    },
    quotationFile: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentReference: {
      type: String,
      default: "",
    },
    engineNumber: {
      type: String,
      default: "",
      trim: true,
    },
    chassisNumber: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    lastReminderAt: {
      type: Date,
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    documents: {
      form20: { type: String, default: "" },
      form21: { type: String, default: "" },
      form22: { type: String, default: "" },
      tempRegCert: { type: String, default: "" },
      bvCertificate: { type: String, default: "" },
      dealerInvoice: { type: String, default: "" },
    },
    isCRTMUploaded: { type: Boolean, default: false },
    isBVUploaded: { type: Boolean, default: false },
    isDealerInvoiceUploaded: { type: Boolean, default: false },
    engineCapacity: { type: String, default: "", trim: true },
    fuelType: { type: String, default: "", trim: true },
    countryOfOrigin: { type: String, default: "", trim: true },
    yom: { type: String, default: "", trim: true },
    hsnCode: { type: String, default: "", trim: true },
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

// Compound index: one booking per vehicle unit per order
vehicleBookingSchema.index({ orderId: 1, vehicleIndex: 1 }, { unique: true });
vehicleBookingSchema.index({ status: 1 });

export const VehicleBooking = mongoose.model<IVehicleBooking>(
  "VehicleBooking",
  vehicleBookingSchema,
);
