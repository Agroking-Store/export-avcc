import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleItem {
  slNo: number;
  hsnCode: string;
  vehicleName: string;
  exteriorColour: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  countryOfOrigin: string;
  yom: number;
  fobAmount: number;
  freight: number;
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
}

export interface IOrder extends Document {
  orderId: string;
  voucherNo: string;
  date: Date;
  clientId: mongoose.Types.ObjectId;
  incoterm: string;
  portOfLoading: string;
  portOfDischarge: string;
  paymentTerms: string;
  buyerRef: string;
  vehicles: IVehicleItem[];
  grandTotal: number;
  grandTotalInWords: string;
  bankName: string;
  accountNo: string;
  branch: string;
  ifscCode: string;
  status: "Draft" | "Confirmed" | "PI Generated";
  createdAt: Date;
  updatedAt: Date;
}

const vehicleItemSchema = new Schema<IVehicleItem>({
  slNo: { type: Number, required: true },
  hsnCode: { type: String, required: true },
  vehicleName: { type: String, required: true },
  exteriorColour: { type: String, required: true },
  chassisNo: { type: String, required: true },
  engineNo: { type: String, required: true },
  engineCapacity: { type: String, required: true },
  fuelType: { type: String, required: true },
  countryOfOrigin: { type: String, required: true },
  yom: { type: Number, required: true },
  fobAmount: { type: Number, required: true },
  freight: { type: Number, required: true },
  quantity: { type: Number, required: true },
  ratePerUnit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  voucherNo: {
    type: String,
    unique: true,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  incoterm: {
    type: String,
    default: "CFR",
  },
  portOfLoading: {
    type: String,
    default: "Any Port in India",
  },
  portOfDischarge: {
    type: String,
    default: "Any Port in Sri Lanka",
  },
  paymentTerms: {
    type: String,
    required: true,
  },
  buyerRef: {
    type: String,
    required: true,
  },
  vehicles: {
    type: [vehicleItemSchema],
    required: true,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  grandTotalInWords: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  accountNo: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  ifscCode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Draft", "Confirmed", "PI Generated"],
    default: "Draft",
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
orderSchema.index({ clientId: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ voucherNo: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);