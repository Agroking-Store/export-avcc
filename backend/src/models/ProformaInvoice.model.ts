import mongoose, { Document, Schema } from "mongoose";

export interface IProformaInvoice extends Document {
  piNumber: string;

  client_id: mongoose.Types.ObjectId; // buyer

  vehicleDetails: {
    model: string;
    quantity: number;
    unitPrice: number;
  }[];

  totalAmount: number;

  currency: string; // USD
  paymentTerms?: string;

  validityDate?: Date;

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

    vehicleDetails: [
      {
        model: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
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