import mongoose, { Document, Schema } from "mongoose";

export interface IVehicle extends Document {
  name: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  quantity: number;
  status: 'Available' | 'Booked';
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  engineNo: { type: String, required: true, unique: true },
  chassisNo: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Available', 'Booked'], 
    default: 'Available' 
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => { 
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v; 
      return ret; 
    } 
  }
});

export const Vehicle = mongoose.model<IVehicle>("Vehicle", vehicleSchema);

