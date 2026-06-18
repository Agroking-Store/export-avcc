import mongoose, { Document, Schema } from "mongoose";

export interface IShipment extends Document {
  customerName: string;
  destinationCountry: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  shippingLine?: string;
  vesselName?: string;
  sailingDate?: Date;
  arrivalDate?: Date;
  vehicleBookingIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipment>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCountry: {
      type: String,
      required: true,
      trim: true,
    },
    portOfLoading: {
      type: String,
      default: "",
      trim: true,
    },
    portOfDischarge: {
      type: String,
      default: "",
      trim: true,
    },
    shippingLine: {
      type: String,
      default: "",
      trim: true,
    },
    vesselName: {
      type: String,
      default: "",
      trim: true,
    },
    sailingDate: {
      type: Date,
    },
    arrivalDate: {
      type: Date,
    },
    vehicleBookingIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "VehicleBooking",
        },
      ],
      default: [],
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

shipmentSchema.index({ customerName: 1 });
shipmentSchema.index({ destinationCountry: 1 });
shipmentSchema.index({ vehicleBookingIds: 1 });

export const Shipment = mongoose.model<IShipment>("Shipment", shipmentSchema);
