import mongoose, { Document, Schema } from "mongoose";

export interface IVehicle extends Document {
  name: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  status: "Available" | "Booked";
  bookedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    engineNo: { type: String, required: true, unique: true },
    chassisNo: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Available", "Booked"],
      default: "Available",
    },
    bookedBy: { type: Schema.Types.ObjectId, ref: "Client", default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        (ret as any).id = ret._id;
        // delete ret._id;
        delete (ret as { _id?: any })?._id;
        // delete ret.__v;
        delete (ret as { __v?: any })?.__v;
        return ret;
      },
    },
  },
);

export const Vehicle = mongoose.model<IVehicle>("Vehicle", vehicleSchema);
