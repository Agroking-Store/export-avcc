import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleListItem extends Document {
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  engineCapacity?: string;
  commercialHsnCode: string;
  exportHsnCode: string;
  hsnCode?: string;
  quantity: number;
  fobAmount: number;
  freight: number;
  igstRate: 5 | 18 | 40;
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
    engineCapacity: {
      type: String,
      trim: true,
      default: "",
    },
    commercialHsnCode: {
      type: String,
      required: [true, "Commercial HSN Code is required"],
      trim: true,
    },
    exportHsnCode: {
      type: String,
      required: [true, "Export HSN Code is required"],
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: false,
      default: 1,
      min: [0, "Quantity cannot be negative"],
    },
    fobAmount: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "FOB Amount cannot be negative"],
    },
    freight: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Freight cannot be negative"],
    },
    igstRate: {
      type: Number,
      enum: [5, 18, 40],
      default: 18,
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

// vehicleListItemSchema.pre("save", function () {
//   this.status = this.quantity > 0 ? "Available" : "Out of Stock";
// });

vehicleListItemSchema.pre("save", function (this: IVehicleListItem) {
  this.status = this.quantity > 0 ? "Available" : "Out of Stock";
});

vehicleListItemSchema.index({ brandName: 1, modelName: 1, variant: 1 });

export const VehicleListItem = mongoose.model<IVehicleListItem>(
  "VehicleListItem",
  vehicleListItemSchema,
);
