import Joi from 'joi';
import { validate } from '../middleware/validate.middleware';

const vehicleSchema = Joi.object({
  hsnCode: Joi.string().required(),
  name: Joi.string().required(),
  color: Joi.string().required(),
  chassisNo: Joi.string().required(),
  engineNo: Joi.string().required(),
  engineCapacity: Joi.string().optional(),
  fuelType: Joi.string().optional(),
  countryOfOrigin: Joi.string().optional(),
  yom: Joi.number().min(1900).optional(),
  fobAmount: Joi.number().min(0).optional(),
  freight: Joi.number().min(0).optional(),
  quantity: Joi.number().min(1).max(100).default(1),
  srNo: Joi.string().optional().allow(''),
});

const bookingSchema = Joi.object({
  dealerId: Joi.string().required(),
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
  vehicles: Joi.array().items(vehicleSchema).min(1).required(),
  status: Joi.string().valid('To be Sourced', 'Booked', 'Payment Done', 'Transit', 'JNPT Warehouse', 'Shipped', 'Commercial Invoice Submitted').default('To be Sourced'),
  orderId: Joi.string().optional(),
});

export const createBookingSchema = bookingSchema;
export const updateBookingSchema = bookingSchema.keys({
  dealerId: Joi.string().optional(),
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vehicles: Joi.array().items(vehicleSchema).optional(),
  status: Joi.string().valid('To be Sourced', 'Booked', 'Payment Done', 'Transit', 'JNPT Warehouse', 'Shipped', 'Commercial Invoice Submitted').optional(),
});

export const validateCreateBooking = validate(createBookingSchema);
export const validateUpdateBooking = validate(updateBookingSchema);