import mongoose, { Document, Schema } from "mongoose";

interface IAddressDetails {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IProformaInvoice extends Document {
  piNumber: string;

  client_id: mongoose.Types.ObjectId; // buyer
  dealer_id?: mongoose.Types.ObjectId; // exporter details

  clientDetails?: {
    name?: string;
    companyName?: string;
    address?: IAddressDetails;
  };

  dealerDetails?: {
    name?: string;
    gstin?: string;
    address?: IAddressDetails;
  };

  vehicleDetails: {
    vehicle_id?: mongoose.Types.ObjectId;
    model?: string;
    color?: string;
    engineNo?: string;
    chassisNo?: string;
    quantity: number;
    fob: number;
    freight: number;
    hsn?: string;
    yom?: string;
    fuelType?: string;
    countryOfOrigin?: string;
    engineCapacity?: string;
  }[];

  totalAmount: number;
  amountInWords?: string;

  currency: string; // USD
  paymentTerms?: string;
  termsOfDelivery?: string;

  validityDate?: Date;

  bankDetails?: {
    bankName: string;
    accountNo: string;
    branchIfsc: string;
  };

  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "sent_to_buyer"
    | "lc_received"
    | "expired";

  createdAt: Date;
  updatedAt: Date;
}

const addressDetailsSchema = new Schema<IAddressDetails>(
  {
    houseBuilding: { type: String },
    streetArea: { type: String },
    cityTown: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const proformaInvoiceSchema = new Schema<IProformaInvoice>(
  {
    piNumber: {
      type: String,
      unique: true,
    },

    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    dealer_id: {
      type: Schema.Types.ObjectId,
      ref: "Dealer",
    },

    clientDetails: {
      name: { type: String },
      companyName: { type: String },
      address: addressDetailsSchema,
    },

    dealerDetails: {
      name: { type: String },
      gstin: { type: String },
      address: addressDetailsSchema,
    },

    vehicleDetails: [
      {
        vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle" },
        model: { type: String },
        color: { type: String },
        engineNo: { type: String },
        chassisNo: { type: String },
        quantity: { type: Number, required: true },
        fob: { type: Number, default: 0 },
        freight: { type: Number, default: 0 },
        hsn: { type: String },
        yom: { type: String },
        fuelType: { type: String },
        countryOfOrigin: { type: String },
        engineCapacity: { type: String },
      },
    ],

    totalAmount: {
      type: Number,
      default: 0,
    },

    amountInWords: {
      type: String,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentTerms: {
      type: String,
    },

    termsOfDelivery: {
      type: String,
    },

    validityDate: {
      type: Date,
    },

    bankDetails: {
      bankName: { type: String },
      accountNo: { type: String },
      branchIfsc: { type: String },
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "sent_to_buyer",
        "lc_received",
        "expired",
      ],
      default: "draft",
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

// Index
proformaInvoiceSchema.index({ client_id: 1 });

export default mongoose.model<IProformaInvoice>(
  "ProformaInvoice",
  proformaInvoiceSchema
);
