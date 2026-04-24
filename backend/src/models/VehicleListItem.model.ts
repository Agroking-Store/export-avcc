import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleListItem extends Document {
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  quantity: number;
  status: "Available" | "Out of Stock";
  createdAt: Date;
  updatedAt: Date;
}

const vehicleListItemSchema = new Schema<IVehicleListItem>(
  {
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    modelName: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
    },
    variant: {
      type: String,
      required: [true, "Variant is required"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Available", "Out of Stock"],
      default: "Available",
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

vehicleListItemSchema.pre("save", function () {
  this.status = this.quantity > 0 ? "Available" : "Out of Stock";
});

vehicleListItemSchema.index({ brandName: 1, modelName: 1, variant: 1 });

export const VehicleListItem = mongoose.model<IVehicleListItem>(
  "VehicleListItem",
  vehicleListItemSchema,
);
