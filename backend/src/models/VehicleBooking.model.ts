import mongoose, { Document, Schema } from "mongoose";

export type VehicleBookingStatus =
  | "pending"
  | "quotation_details_pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "delivered";

export interface IVehicleBooking extends Document {
  orderId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleIndex: number;
  assignedClientId?: mongoose.Types.ObjectId;
  assignedClientSnapshot?: {
    name: string;
    companyName?: string;
    clientCode?: string;
  };
  assignedDealerId?: mongoose.Types.ObjectId | null;
  assignedDealerSnapshot?: {
    name: string;
    contact?: string;
    gstNumber?: string;
  };
  status: VehicleBookingStatus;
  quotationFile?: string;
  quotationDetails?: {
    dealershipName?: string;
    brand?: string;
    carModelName?: string;
    driveLink?: string;
    netCost?: {
      basicValue?: number;
      handlingCharges?: number;
      crtm?: number;
      insurance?: number;
      cashComponent?: number;
      bureauVeritas?: number;
      shippingCost?: number;
      total?: number;
    };
    taxAmount?: {
      carGst?: number;
      bureauVeritasGst?: number;
      shippingGst?: number;
      tcs?: number;
      total?: number;
    };
    grandTotal?: number;
    savedAt?: Date;
  };
  rejectionReason?: string;
  paymentAmount?: number;
  paymentReference?: string;
  engineNumber?: string;
  chassisNumber?: string;
  deliveryDate?: Date;
  lastReminderAt?: Date;
  reminderCount?: number;
  documents: {
    form20?: string;
    form21?: string;
    form22?: string;
    tempRegCert?: string;
    bvCertificate?: string;
    dealerInvoice?: string;
  };
  isCRTMUploaded: boolean;
  isBVUploaded: boolean;
  isDealerInvoiceUploaded: boolean;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: string;
  commercialHsnCode?: string;
  exportHsnCode?: string;
  hsnCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleBookingSchema = new Schema<IVehicleBooking>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleOrder",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleListItem",
      required: true,
    },
    vehicleIndex: {
      type: Number,
      required: true,
    },
    assignedClientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    assignedClientSnapshot: {
      name: { type: String, trim: true, default: "" },
      companyName: { type: String, trim: true, default: "" },
      clientCode: { type: String, trim: true, default: "" },
    },
    assignedDealerId: {
      type: Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },
    assignedDealerSnapshot: {
      name: { type: String, trim: true, default: "" },
      contact: { type: String, trim: true, default: "" },
      gstNumber: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "quotation_details_pending",
        "quotation_uploaded",
        "approved",
        "rejected",
        "payment_done",
        "chassis_received",
        "delivered",
      ],
      default: "pending",
    },
    quotationFile: {
      type: String,
      default: "",
    },
    quotationDetails: {
      dealershipName: { type: String, default: "", trim: true },
      brand: { type: String, default: "", trim: true },
      carModelName: { type: String, default: "", trim: true },
      driveLink: { type: String, default: "", trim: true },
      netCost: {
        basicValue: { type: Number, default: 0 },
        handlingCharges: { type: Number, default: 0 },
        crtm: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        cashComponent: { type: Number, default: 0 },
        bureauVeritas: { type: Number, default: 0 },
        shippingCost: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      taxAmount: {
        carGst: { type: Number, default: 0 },
        bureauVeritasGst: { type: Number, default: 0 },
        shippingGst: { type: Number, default: 0 },
        tcs: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      grandTotal: { type: Number, default: 0 },
      savedAt: { type: Date },
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentReference: {
      type: String,
      default: "",
    },
    // engineNumber: {
    //   type: String,
    //   default: "",
    //   trim: true,
    //   index: { unique: true, sparse: true },
    // },
    engineNumber: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
      set: (v: string | undefined) => (v === "" ? undefined : v),
    },
    chassisNumber: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryDate: {
      type: Date,
    },
    lastReminderAt: {
      type: Date,
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    documents: {
      form20: { type: String, default: "" },
      form21: { type: String, default: "" },
      form22: { type: String, default: "" },
      tempRegCert: { type: String, default: "" },
      bvCertificate: { type: String, default: "" },
      dealerInvoice: { type: String, default: "" },
    },
    isCRTMUploaded: { type: Boolean, default: false },
    isBVUploaded: { type: Boolean, default: false },
    isDealerInvoiceUploaded: { type: Boolean, default: false },
    engineCapacity: { type: String, default: "", trim: true },
    fuelType: { type: String, default: "", trim: true },
    countryOfOrigin: { type: String, default: "", trim: true },
    yom: { type: String, default: "", trim: true },
    commercialHsnCode: { type: String, default: "", trim: true },
    exportHsnCode: { type: String, default: "", trim: true },
    hsnCode: { type: String, default: "", trim: true },
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

// Compound index: one booking per vehicle unit per order
vehicleBookingSchema.index({ orderId: 1, vehicleIndex: 1 }, { unique: true });
vehicleBookingSchema.index({ status: 1 });

export const VehicleBooking = mongoose.model<IVehicleBooking>(
  "VehicleBooking",
  vehicleBookingSchema,
);
