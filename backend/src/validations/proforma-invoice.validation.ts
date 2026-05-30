import Joi from "joi";

const addressSchema = Joi.object({
  houseBuilding: Joi.string().allow("").optional(),
  streetArea: Joi.string().allow("").optional(),
  cityTown: Joi.string().allow("").optional(),
  state: Joi.string().allow("").optional(),
  pincode: Joi.string().allow("").optional(),
  country: Joi.string().allow("").optional(),
});

const vehicleDetailSchema = Joi.object({
  vehicle_id: Joi.string().optional().allow(null, ""),
  variant: Joi.string().allow("").optional(),
  model: Joi.string().required(),
  color: Joi.string().allow("").optional(),
  engineNo: Joi.string().allow("").optional(),
  chassisNo: Joi.string().allow("").optional(),
  quantity: Joi.number().min(1).required(),
  fob: Joi.number().min(0).required().allow(""),
  freight: Joi.number().min(0).required().allow(""),
  unitPrice: Joi.number().min(0).optional(), // Sent from frontend, but we recalculate
  commercialHsn: Joi.string().allow("").optional(),
  exportHsn: Joi.string().allow("").optional(),
  hsn: Joi.string().allow("").optional(),
  yom: Joi.string().allow("").optional(),
  fuelType: Joi.string().allow("").optional(),
  countryOfOrigin: Joi.string().allow("").optional(),
  engineCapacity: Joi.string().allow("").optional(),
  igstRate: Joi.number().valid(5, 18, 40).optional(),
});

const clientSnapshotSchema = Joi.object({
  name: Joi.string().allow("").optional(),
  companyName: Joi.string().allow("").optional(),
  clientCode: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  address: addressSchema.optional(),
});

const bankDetailsSchema = Joi.object({
  bankName: Joi.string().allow("").optional(),
  accountNo: Joi.string().allow("").optional(),
  branchIfsc: Joi.string().allow("").optional(),
});

const companySnapshotSchema = Joi.object({
  name: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  address: addressSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  gstNumber: Joi.string().allow("").optional(),
});

export const createPIValidationSchema = Joi.object({
  piNumber: Joi.string().allow("").optional(),
  order_id: Joi.string().allow(null, "").optional(), // Added missing order_id
  vehicleBookingIds: Joi.array()
    .items(Joi.any())
    .custom((value: any[]) =>
      value
        .map((id) => (typeof id === "string" ? id : id?._id))
        .filter(Boolean),
    )
    .optional(),
  client_id: Joi.string().required(),
  company_id: Joi.string().optional().allow(null, ""), // Renamed from dealer_id
  paymentTerms: Joi.string().allow("").optional(),
  validityDate: Joi.date().allow("").optional(),
  termsOfDelivery: Joi.string().allow("").optional(),
  incoterm: Joi.string().allow("").optional(),
  portOfLoading: Joi.string().allow("").optional(),
  portOfDischarge: Joi.string().allow("").optional(),
  buyersRef: Joi.string().allow("").optional(),
  otherRef: Joi.string().allow("").optional(),
  dispatchedThrough: Joi.string().allow("").optional(),
  destination: Joi.string().allow("").optional(),
  vehicleDetails: Joi.array().items(vehicleDetailSchema).min(1).required(),
  totalAmount: Joi.number().optional(), // This is calculated on backend, but sent from frontend
  clientSnapshot: clientSnapshotSchema.optional(),
  companySnapshot: companySnapshotSchema.optional(),
});
