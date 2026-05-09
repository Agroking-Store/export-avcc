import mongoose, { Document, Schema } from "mongoose";

export interface IProformaInvoice extends Document {
  piNumber: string;

  order_id?: mongoose.Types.ObjectId; // legacy old order
  vehicleBookingIds?: mongoose.Types.ObjectId[];

  client_id: mongoose.Types.ObjectId; // Buyer
  company_id?: mongoose.Types.ObjectId; // Exporter details (Company)

  vehicleDetails: {
    vehicle_id?: mongoose.Types.ObjectId;
    variant?: string;
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
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  buyersRef?: string;
  otherRef?: string;
  dispatchedThrough?: string;
  destination?: string;

  validityDate?: Date;

  clientSnapshot?: {
    // Moved clientSnapshot outside of status
    name?: string;
    companyName?: string;
    clientCode?: string;
    email?: string;
    phone?: string;
    address?: {
      houseBuilding?: string;
      streetArea?: string;
      cityTown?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  companySnapshot?: {
    // Moved companySnapshot outside of status
    name?: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
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
  };
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "sent_to_buyer"
    | "lc_received"
    | "expired";
  __v?: number; // Mongoose version key

  createdAt: Date;
  pdfPath?: string;
  updatedAt: Date;
}

const proformaInvoiceSchema = new Schema<IProformaInvoice>(
  {
    piNumber: {
      type: String,
      unique: true,
    },

    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    vehicleBookingIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "VehicleBooking",
      },
    ],
    client_id: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    // Renamed from dealer_id to company_id
    company_id: {
      type: Schema.Types.ObjectId, // This will store the ID of the Company
      ref: "Company", // Reference the Company model
    },

    vehicleDetails: [
      {
        vehicle_id: { type: Schema.Types.ObjectId, ref: "VehicleListItem" },
        variant: { type: String },
        model: { type: String },
        color: { type: String },
        engineNo: { type: String, trim: true },
        chassisNo: { type: String, trim: true },
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

    incoterm: {
      type: String,
    },

    portOfLoading: {
      type: String,
    },

    portOfDischarge: {
      type: String,
    },

    buyersRef: {
      type: String,
    },
    otherRef: {
      type: String,
    },
    dispatchedThrough: {
      type: String,
    },
    destination: {
      type: String,
    },

    validityDate: {
      type: Date,
    },
    // Moved clientSnapshot and companySnapshot here as top-level fields
    clientSnapshot: {
      name: { type: String },
      companyName: { type: String },
      clientCode: { type: String },
      email: { type: String },
      phone: { type: String },
      address: {
        houseBuilding: { type: String },
        streetArea: { type: String },
        cityTown: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String },
      },
    },
    companySnapshot: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      gstNumber: { type: String },
      address: {
        houseBuilding: { type: String },
        streetArea: { type: String },
        cityTown: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String },
      },
      bankDetails: {
        bankName: { type: String },
        accountNo: { type: String },
        branchIfsc: { type: String },
      },
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
    pdfPath: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Index
proformaInvoiceSchema.index({ client_id: 1 }); // Existing index
proformaInvoiceSchema.index({ order_id: 1 });
proformaInvoiceSchema.index({ vehicleBookingIds: 1 }); // New index for order_id

export default mongoose.model<IProformaInvoice>(
  "ProformaInvoice",
  proformaInvoiceSchema,
);
