import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
  hsnCode?: string;
  vehicleName?: string;
  exteriorColour?: string;
  chassisNo?: string;
  engineNo?: string;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: string;
  fobAmount?: number;
  freight?: number;
}

export interface IOrder extends Document {
  orderId: string;
  voucherNo: string;
  date: Date;
  clientId: mongoose.Types.ObjectId; 
  vehicles: IVehicleItem[];
  status: "Draft" | "Confirmed";
  createdAt: Date;
  __v?: number; // Mongoose version key
  updatedAt: Date;
}

const vehicleItemSchema = new Schema<IVehicleItem>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true },
  hsnCode: { type: String },
  vehicleName: { type: String },
  exteriorColour: { type: String },
  chassisNo: { type: String },
  engineNo: { type: String },
  engineCapacity: { type: String },
  fuelType: { type: String },
  countryOfOrigin: { type: String },
  yom: { type: String },
  fobAmount: { type: Number },
  freight: { type: Number },
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, required: true },
    voucherNo: { type: String, unique: true, required: true },
    date: { type: Date, required: true },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true, 
    },

    vehicles: { type: [vehicleItemSchema], required: true },

    status: {
      type: String,
      enum: ["Draft", "Confirmed"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.index({ clientId: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);