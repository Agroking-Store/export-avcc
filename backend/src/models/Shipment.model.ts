import mongoose, { Document, Schema } from "mongoose";

export interface IShipmentContainer {
  _id: mongoose.Types.ObjectId;
  containerNumber: string;
  vehicleBookingIds: mongoose.Types.ObjectId[];
  createdAt?: Date;
}

export interface IShipment extends Document {
  customerName: string;
  destinationCountry: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  shippingLine?: string;
  vesselName?: string;
  sailingDate?: Date;
  arrivalDate?: Date;
  containers: IShipmentContainer[];
  createdAt: Date;
  updatedAt: Date;
}

const shipmentContainerSchema = new Schema<IShipmentContainer>(
  {
    containerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleBookingIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "VehicleBooking",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

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
    containers: {
      type: [shipmentContainerSchema],
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
shipmentSchema.index({ "containers.vehicleBookingIds": 1 });

export const Shipment = mongoose.model<IShipment>("Shipment", shipmentSchema);
