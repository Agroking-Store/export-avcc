import Joi from 'joi';

export const createVehicleSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.base': 'Name must be a string',
    'string.min': 'Name is required',
    'any.required': 'Name is required'
  }),
  color: Joi.string().min(1).required().messages({
    'string.base': 'Color must be a string',
    'string.min': 'Color is required',
    'any.required': 'Color is required'
  }),
  engineNo: Joi.string().min(1).max(50).required().messages({
    'string.base': 'Engine No must be a string',
    'string.min': 'Engine No is required',
    'string.max': 'Engine No cannot exceed 50 characters',
    'any.required': 'Engine No is required'
  }),
  chassisNo: Joi.string().min(1).max(50).required().messages({
    'string.base': 'Chassis No must be a string',
    'string.min': 'Chassis No is required',
    'string.max': 'Chassis No cannot exceed 50 characters',
    'any.required': 'Chassis No is required'
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  }),
  status: Joi.string().valid('Available', 'Booked').default('Available').optional().messages({
    'any.only': 'Status must be Available or Booked'
  })
});

export const updateVehicleSchema = Joi.object({
  name: Joi.string().min(1).optional().messages({'string.base': 'Name must be a string', 'string.min': 'Name is required'}),
  color: Joi.string().min(1).optional().messages({'string.base': 'Color must be a string', 'string.min': 'Color is required'}),
  engineNo: Joi.string().min(1).max(50).optional().messages({'string.base': 'Engine No must be a string', 'string.min': 'Engine No is required', 'string.max': 'Engine No cannot exceed 50 characters'}),
  chassisNo: Joi.string().min(1).max(50).optional().messages({'string.base': 'Chassis No must be a string', 'string.min': 'Chassis No is required', 'string.max': 'Chassis No cannot exceed 50 characters'}),
  quantity: Joi.number().min(0).required().messages({'number.base': 'Quantity must be a number', 'number.min': 'Quantity must be at least 0'}),
  status: Joi.string().valid('Available', 'Booked').optional().messages({'any.only': 'Status must be Available or Booked'})
});

export const bookVehicleSchema = Joi.object({
  vehicleId: Joi.string().required().messages({
    'string.base': 'Vehicle ID must be a string',
    'any.required': 'Vehicle ID is required'
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be 0 or greater',
    'any.required': 'Amount is required'
  }),
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Invalid date format',
    'any.required': 'Date is required'
  }),
  clientId: Joi.string().optional().messages({
    'string.base': 'Client ID must be a string'
  }),
  notes: Joi.string().optional().allow('')
});

export interface CreateVehicleDto {
  name: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  quantity: number;
  status?: 'Available' | 'Booked';
}

export interface UpdateVehicleDto {
  name?: string;
  color?: string;
  engineNo?: string;
  chassisNo?: string;
  quantity: number;
  status?: 'Available' | 'Booked';
}

export interface BookVehicleDto {
  vehicleId: string;
  quantity: number;
  amount: number;
  date: string;
  clientId?: string;
  notes?: string;
}
