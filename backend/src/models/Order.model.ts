import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
}

export interface IOrder extends Document {
  orderId: string;
  voucherNo: string;
  date: Date;
  clientId: mongoose.Types.ObjectId;
  vehicles: IVehicleItem[];
  grandTotal: number;
  status: "Draft" | "Confirmed";
  createdAt: Date;
  updatedAt: Date;
}

const vehicleItemSchema = new Schema<IVehicleItem>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new Schema<IOrder>({
  orderId: { type: String, unique: true, required: true },
  voucherNo: { type: String, unique: true, required: true },
  date: { type: Date, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  vehicles: { type: [vehicleItemSchema], required: true },
  grandTotal: { type: Number, required: true },
  status: { type: String, enum: ["Draft", "Confirmed"], default: "Draft" },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => { 
      delete ret.__v; 
      return ret; 
    } 
  },
});

orderSchema.index({ clientId: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);

