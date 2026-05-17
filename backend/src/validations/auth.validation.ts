import * as Joi from "joi";
import { ROLES } from "../config/constants";

const clientAddressSchema = Joi.object({
  houseBuilding: Joi.string().trim().allow("").optional(),
  streetArea: Joi.string().trim().allow("").optional(),
  cityTown: Joi.string().trim().allow("").optional(),
  state: Joi.string().trim().allow("").optional(),
  pincode: Joi.string().trim().allow("").optional(),
  country: Joi.string().trim().required().messages({
    "any.required": "Country is required",
    "string.empty": "Country is required",
  }),
});

const dealerBankDetailsSchema = Joi.object({
  bankName: Joi.string().trim().required(),
  accountNo: Joi.string().trim().required(),
  branchIfsc: Joi.string().trim().required(),
});

const phoneSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const digits = value.replace(/\D/g, "");
    if (!/^[0-9]{10,15}$/.test(digits)) {
      return helpers.error("string.pattern.base");
    }
    return value;
  })
  .messages({
    "string.pattern.base": "Please provide a valid phone number",
  });

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .optional(),
  phone: phoneSchema
    .when("role", {
      is: Joi.valid(ROLES.CLIENT, ROLES.DEALER),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Phone is required",
    }),
  clientProfile: Joi.object({
    companyName: Joi.string().trim().required().messages({
      "any.required": "Company name is required",
      "string.empty": "Company name is required",
    }),
    address: clientAddressSchema.required(),
  }).when("role", {
    is: ROLES.CLIENT,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  dealerProfile: Joi.object({
    address: Joi.string().trim().allow("").optional(),
    gstNumber: Joi.string()
      .trim()
      .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid GST number format",
        "any.required": "GST number is required",
      }),
    bankDetails: dealerBankDetailsSchema.required(),
  }).when("role", {
    is: ROLES.DEALER,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

