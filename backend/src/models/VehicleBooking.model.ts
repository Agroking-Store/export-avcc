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
  lastReminderAt?: Date;
  reminderCount?: number;
  createdAt: Date;
  updatedAt: Date;
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
    lastReminderAt: {
      type: Date,
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
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

// Compound index: one booking per vehicle unit per order
vehicleBookingSchema.index({ orderId: 1, vehicleIndex: 1 }, { unique: true });
vehicleBookingSchema.index({ status: 1 });

export const VehicleBooking = mongoose.model<IVehicleBooking>(
  "VehicleBooking",
  vehicleBookingSchema,
);
