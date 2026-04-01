import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleItem {
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
}

export interface IOrder extends Document {
  orderId: string;
  voucherNo: string;
  date: Date;
  clientId?: mongoose.Types.ObjectId;
  dealerId?: mongoose.Types.ObjectId;
  vehicles: IVehicleItem[];
  status: "Draft" | "Confirmed";
  createdAt: Date;
  updatedAt: Date;
}

const vehicleItemSchema = new Schema<IVehicleItem>({
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
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, required: true },
    voucherNo: { type: String, unique: true, required: true },
    date: { type: Date, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    dealerId: { type: Schema.Types.ObjectId, ref: "Dealer", default: null },
    vehicles: { type: [vehicleItemSchema], required: true },
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
