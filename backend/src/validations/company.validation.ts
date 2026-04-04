import Joi from "joi";
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  IAddressDetailsDto,
} from "../dto/company.dto";

const addressDetailsSchema = Joi.object<IAddressDetailsDto>({
  houseBuilding: Joi.string().trim().allow(""),
  streetArea: Joi.string().trim().allow(""),
  cityTown: Joi.string().trim().allow(""),
  state: Joi.string().trim().min(2).allow("").messages({
    "string.min": "State name must be at least 2 characters long.",
  }),
  pincode: Joi.string().trim().allow(""),
  country: Joi.string().trim().min(2).allow("").messages({
    "string.min": "Country name must be at least 2 characters long.",
  }),
});

const createCompanySchema = Joi.object<CreateCompanyDto>({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Company name cannot be empty",
    "string.min": "Company name must be at least 2 characters long",
    "string.max": "Company name cannot exceed 100 characters",
    "any.required": "Company name is required",
  }),
  email: Joi.string().trim().lowercase().email().messages({
    "string.email": "Please provide a valid email address",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      "string.pattern.base": "Phone number must be 10-15 digits",
    })
    .allow(""), // Allow empty string for phone
  address: addressDetailsSchema,
  gstNumber: Joi.string().trim(),
});

const updateCompanySchema = Joi.object<UpdateCompanyDto>({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().lowercase().email(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .allow(""),
  address: addressDetailsSchema,
  gstNumber: Joi.string().trim(),
}).min(1); // At least one field is required for update

export const validateCreateCompany = (data: CreateCompanyDto) => {
  const { error } = createCompanySchema.validate(data);
  if (error) throw new Error(error.details[0].message);
};

export const validateUpdateCompany = (data: UpdateCompanyDto) => {
  const { error } = updateCompanySchema.validate(data);
  if (error) throw new Error(error.details[0].message);
};
