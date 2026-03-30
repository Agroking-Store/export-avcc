import mongoose, { Document, Schema } from "mongoose";

export interface IProformaInvoice extends Document {
  piNumber: string;

  client_id: mongoose.Types.ObjectId; // buyer
  dealer_id?: mongoose.Types.ObjectId; // exporter details

  clientDetails?: {
    name: string;
    companyName: string;
    address: string;
    country: string;
    state: string;
  };

  dealerDetails?: {
    name: string;
    address: string;
    state: string;
    stateCode: string;
    gstin: string;
  };

  vehicleDetails: {
    vehicle_id?: mongoose.Types.ObjectId;
    model?: string;
    color?: string;
    engineNo?: string;
    chassisNo?: string;
    quantity: number;
    unitPrice: number;
    hsn?: string;
    fob?: string;
    freight?: string;
    yom?: string;
  }[];

  totalAmount: number;

  currency: string; // USD
  paymentTerms?: string;

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
      address: { type: String },
      country: { type: String },
      state: { type: String },
    },

    dealerDetails: {
      name: { type: String },
      address: { type: String },
      state: { type: String },
      stateCode: { type: String },
      gstin: { type: String },
    },

    vehicleDetails: [
      {
        vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle" },
        model: { type: String },
        color: { type: String },
        engineNo: { type: String },
        chassisNo: { type: String },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        hsn: { type: String },
        fob: { type: String },
        freight: { type: String },
        yom: { type: String },
      },
    ],

    totalAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentTerms: {
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
