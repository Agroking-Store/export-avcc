import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  clientCode: string;
  name: string;
  email?: string;
  phone: string;
  country: string;
  companyName?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
      clientCode: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
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
      trim: true,
    },
    address: {
      type: String,
      trim: true,
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
  }
);

// Indexes (like User model)
clientSchema.index({ phone: 1 });
clientSchema.index({ email: 1 });

export const Client = mongoose.model<IClient>("Client", clientSchema);