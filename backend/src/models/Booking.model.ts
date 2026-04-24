import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingVehicle {
  hsnCode: string;
  name: string;
  color: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  countryOfOrigin: string;
  yom: number;
  fobAmount: number;
  freight: number;
  quantity: number;
  srNo?: string;

  documents?: {
    form20?: string;
    form21?: string;
    form22?: string;
    tempRegCert?: string;
    bvCertificate?: string;
  };
  isCRTMUploaded?: boolean;
  isBVUploaded?: boolean;
}

export interface IBooking extends Document {
  dealerId: mongoose.Types.ObjectId;
  date: string;
  vehicles: IBookingVehicle[];
  status:
    | "To be Sourced"
    | "Booked"
    | "Payment Done"
    | "Transit"
    | "JNPT Warehouse"
    | "Shipped"
    | "Commercial Invoice Submitted";
  orderId?: mongoose.Types.ObjectId;
  bookingAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const bookingVehicleSchema = new Schema<IBookingVehicle>({
  hsnCode: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  chassisNo: { type: String, required: true, unique: true, trim: true },
  engineNo: { type: String, required: true, unique: true, trim: true },
  engineCapacity: { type: String },
  fuelType: { type: String },
  countryOfOrigin: { type: String },
  yom: { type: Number, default: 0 },
  fobAmount: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  srNo: { type: String },
  documents: {
    form20: { type: String, default: "" },
    form21: { type: String, default: "" },
    form22: { type: String, default: "" },
    tempRegCert: { type: String, default: "" },
    bvCertificate: { type: String, default: "" },
  },
  isCRTMUploaded: { type: Boolean, default: false },
  isBVUploaded: { type: Boolean, default: false },
});

const bookingSchema = new Schema<IBooking>(
  {
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    vehicles: [bookingVehicleSchema],
    status: {
      type: String,
      enum: [
        "To be Sourced",
        "Booked",
        "Payment Done",
        "Transit",
        "JNPT Warehouse",
        "Shipped",
        "Commercial Invoice Submitted",
      ],
      default: "To be Sourced",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    bookingAmount: {
      type: Number,
      required: true,
      min: 0
    },
  },
  {
    timestamps: true,
  },
);

export const Booking: Model<IBooking> = mongoose.model<IBooking>(
  "Booking",
  bookingSchema,
  "DealerBooking",
);
