import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleOrder extends Document {
  orderNumber: string;
  clientId?: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  orderDate?: Date;
  quantity: number;
  status: "Pending" | "Confirmed" | "Completed";
  clientSnapshot?: {
    name: string;
    companyName?: string;
  };
  vehicleSnapshot: {
    brandName: string;
    modelName: string;
    variant: string;
    color: string;
    engineCapacity?: string;
    commercialHsnCode: string;
    exportHsnCode: string;
    hsnCode?: string;
    igstRate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vehicleOrderSchema = new Schema<IVehicleOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleListItem",
      required: true,
    },
    orderDate: {
      type: Date,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed"],
      default: "Pending",
    },
    clientSnapshot: {
      name: { type: String, required: false, trim: true },
      companyName: { type: String, trim: true },
    },
    vehicleSnapshot: {
      brandName: { type: String, required: true, trim: true },
      modelName: { type: String, required: true, trim: true },
      variant: { type: String, required: true, trim: true },
      color: { type: String, required: true, trim: true },
      engineCapacity: { type: String, trim: true, default: "" },
      commercialHsnCode: { type: String, required: true, trim: true },
      exportHsnCode: { type: String, required: true, trim: true },
      hsnCode: { type: String, trim: true },
      igstRate: { type: Number, default: 18 },
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

vehicleOrderSchema.index({ clientId: 1 });
vehicleOrderSchema.index({ vehicleId: 1 });
vehicleOrderSchema.index({ status: 1 });

export const VehicleOrder = mongoose.model<IVehicleOrder>(
  "VehicleOrder",
  vehicleOrderSchema,
);
