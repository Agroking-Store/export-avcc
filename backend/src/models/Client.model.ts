import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  clientCode: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  companyName: string;
  address?: {
    houseBuilding?: string;
    streetArea?: string;
    cityTown?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  isActive: boolean;
  __v?: number; // Mongoose version key
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    clientCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      match: [/^[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    address: {
      houseBuilding: { type: String, trim: true },
      streetArea: { type: String, trim: true },
      cityTown: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes (like User model)
// clientSchema.index({ email: 1 });

export const Client = mongoose.model<IClient>("Client", clientSchema);
