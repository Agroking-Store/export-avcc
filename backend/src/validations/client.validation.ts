import Joi from "joi";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";

const clientAddressDetailsSchema = Joi.object({
  houseBuilding: Joi.string().trim().allow(""),
  streetArea: Joi.string().trim().allow(""),
  cityTown: Joi.string().trim().allow(""),
  state: Joi.string().trim().allow(""),
  pincode: Joi.string().trim().allow(""),
  country: Joi.string().trim().required().messages({
    "any.required": "Country is required",
    "string.empty": "Country is required",
  }),
});

const createClientSchema = Joi.object<CreateClientDto>({
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must be 10-15 digits",
      "any.required": "Phone is required",
    }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  companyName: Joi.string().trim().required().messages({
    "any.required": "Company name is required",
  }),
  address: clientAddressDetailsSchema,
});

const updateClientSchema = Joi.object<UpdateClientDto>({
  name: Joi.string().trim().min(2),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      "string.pattern.base": "Phone must be 10-15 digits",
    }),
  email: Joi.string().trim().email(),
  companyName: Joi.string().trim(),
  address: clientAddressDetailsSchema,
}).min(1);

export const validateCreateClient = (data: CreateClientDto) => {
  const { error } = createClientSchema.validate(data, { abortEarly: false });
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));
};

export const validateUpdateClient = (data: UpdateClientDto) => {
  const { error } = updateClientSchema.validate(data, { abortEarly: false });
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));
};
