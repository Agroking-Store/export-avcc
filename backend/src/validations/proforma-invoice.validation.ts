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
  model: Joi.string().required(),
  color: Joi.string().allow("").optional(),
  engineNo: Joi.string().allow("").optional(),
  chassisNo: Joi.string().allow("").optional(),
  quantity: Joi.number().min(1).required(),
  fob: Joi.number().min(0).required().allow(""),
  freight: Joi.number().min(0).required().allow(""),
  unitPrice: Joi.number().min(0).optional(), // Sent from frontend, but we recalculate
  hsn: Joi.string().allow("").optional(),
  yom: Joi.string().allow("").optional(),
  fuelType: Joi.string().allow("").optional(),
  countryOfOrigin: Joi.string().allow("").optional(),
  engineCapacity: Joi.string().allow("").optional(),
});

export const createPIValidationSchema = Joi.object({
  piNumber: Joi.string().allow("").optional(),
  client_id: Joi.string().required(),
  dealer_id: Joi.string().optional().allow(null, ""),
  clientDetails: Joi.object({
    name: Joi.string().allow("").optional(),
    companyName: Joi.string().allow("").optional(),
    address: addressSchema,
  }).optional(),
  dealerDetails: Joi.object({
    name: Joi.string().allow("").optional(),
    gstin: Joi.string().allow("").optional(),
    address: addressSchema,
  }).optional(),
  paymentTerms: Joi.string().allow("").optional(),
  validityDate: Joi.date().allow("").optional(),
  termsOfDelivery: Joi.string().allow("").optional(),
  bankDetails: Joi.object({
    bankName: Joi.string().allow("").optional(),
    accountNo: Joi.string().allow("").optional(),
    branchIfsc: Joi.string().allow("").optional(),
  }).optional(),
  vehicleDetails: Joi.array().items(vehicleDetailSchema).min(1).required(),
  totalAmount: Joi.number().optional(), // This is calculated on backend, but sent from frontend
});
