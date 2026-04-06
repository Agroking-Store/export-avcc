import mongoose, { Document, Schema } from "mongoose";

export interface ICompany extends Document {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  isActive: boolean;
  address?: {
    houseBuilding?: string;
    streetArea?: string;
    cityTown?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    branchIfsc?: string;
  };

  __v?: number; // Mongoose version key
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    companyId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    address: {
      houseBuilding: { type: String, trim: true },
      streetArea: { type: String, trim: true },
      cityTown: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNo: { type: String, trim: true },
      branchIfsc: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

companySchema.index({ name: 1 });
companySchema.index({ companyId: 1 });

export const Company = mongoose.model<ICompany>("Company", companySchema);
