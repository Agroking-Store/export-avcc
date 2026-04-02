import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
  srNo?: string;
}

// Stores individual color per expanded vehicle slot
// e.g. BMW qty=3 → vehicleColors[0], [1], [2] = color for each copy
export interface IVehicleColor {
  expandedIndex: number; // position in the fully expanded list (0,1,2,3...)
  color: string;
}

export interface IOrder extends Document {
  orderId: string;
  voucherNo: string;
  date: Date;
  clientId?: mongoose.Types.ObjectId;
  dealerId?: mongoose.Types.ObjectId;
  vehicles: IVehicleItem[];
  vehicleColors: IVehicleColor[]; // NEW: individual color overrides per expanded slot
  status: "Draft" | "Confirmed";
  createdAt: Date;
  updatedAt: Date;
}

const vehicleItemSchema = new Schema<IVehicleItem>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true },
  srNo: { type: String, default: null },
});

const vehicleColorSchema = new Schema<IVehicleColor>({
  expandedIndex: { type: Number, required: true },
  color: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, required: true },
    voucherNo: { type: String, unique: true, required: true },
    date: { type: Date, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    dealerId: { type: Schema.Types.ObjectId, ref: "Dealer", default: null },
    vehicles: { type: [vehicleItemSchema], required: true },
    vehicleColors: { type: [vehicleColorSchema], default: [] }, // NEW
    status: { type: String, enum: ["Draft", "Confirmed"], default: "Draft" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes
orderSchema.index({ clientId: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);