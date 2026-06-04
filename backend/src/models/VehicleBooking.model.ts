import mongoose, { Document, Schema } from "mongoose";

export type VehicleBookingStatus =
  | "pending"
  | "quotation_details_pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "shipped"
  | "delivered";

export interface IVehicleBooking extends Document {
  orderId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleIndex: number;
  usdRate?: number;
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
    /** Car colour fetched from vehicleSnapshot (replaces driveLink) */
    carColour?: string;
    /** Ex-Showroom price entered by user; used to derive basicValue & carGst */
    exShowroomPrice?: number;
    /** GST rate (%) fetched from the vehicle list item */
    gstRate?: number;
    netCost?: {
      basicValue?: number;
      handlingCharges?: number;
      crtm?: number;
      insurance?: number;
      registrationCost?: number;
      cashComponent?: number;
      bureauVeritas?: number;
      shippingCost?: number;
      total?: number;
    };
    taxAmount?: {
      carGst?: number;
      bureauVeritasGst?: number;
      shippingGst?: number;
      insuranceGst?: number;
      tcs?: number;
      total?: number;
    };
    grandTotal?: number;
    savedAt?: Date;
    usdRate?: number;
  };
  rejectionReason?: string;
  bookingAmount?: number;
  paymentAmount?: number;
  paymentReference?: string;
  payments: Array<{
    amount: number;
    date: Date;
    reference?: string;
    remarks?: string;
  }>;
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
    hblDocument?: string;
    shippingBill?: string;
  };
  clientCorrections: Array<{
    filePath: string;
    originalName: string;
    uploadedAt: Date;
  }>;
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
    usdRate: { type: Number },
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
        "shipped",
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
      /** Replaces driveLink – colour fetched from vehicleSnapshot */
      carColour: { type: String, default: "", trim: true },
      /** Ex-Showroom price entered by user */
      exShowroomPrice: { type: Number, default: 0 },
      /** GST rate (%) fetched from vehicle list item */
      gstRate: { type: Number, default: 0 },
      netCost: {
        basicValue: { type: Number, default: 0 },
        handlingCharges: { type: Number, default: 0 },
        crtm: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        registrationCost: { type: Number, default: 0 },
        cashComponent: { type: Number, default: 0 },
        bureauVeritas: { type: Number, default: 0 },
        shippingCost: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      taxAmount: {
        carGst: { type: Number, default: 0 },
        bureauVeritasGst: { type: Number, default: 0 },
        shippingGst: { type: Number, default: 0 },
        insuranceGst: { type: Number, default: 0 },
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
    bookingAmount: {
      type: Number,
      default: 0,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentReference: {
      type: String,
      default: "",
    },
    payments: {
      type: [
        {
          amount: { type: Number, required: true },
          date: { type: Date, default: Date.now },
          reference: { type: String, default: "" },
          remarks: { type: String, default: "" },
        },
      ],
      default: [],
    },
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
      index: {
        unique: true,
        partialFilterExpression: {
          chassisNumber: { $type: "string", $ne: "" },
        },
      },
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
      hblDocument: { type: String, default: "" },
      shippingBill: { type: String, default: "" },
    },
    clientCorrections: {
      type: [
        {
          filePath: { type: String, required: true },
          originalName: { type: String, default: "" },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
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
