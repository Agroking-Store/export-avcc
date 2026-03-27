import { Request, Response, NextFunction } from 'express';
import { createVehicleSchema, updateVehicleSchema, bookVehicleSchema } from '../dto/vehicle.dto';

const formatJoiError = (error: any) => {
  return error.details.map((detail: any) => ({
    path: detail.path,
    message: detail.message.replace(/['"]+/g, '')
  }));
};

export const validateCreateVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = createVehicleSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formatJoiError(error)
    });
  }
  req.body = value;
  next();
};

export const validateUpdateVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = updateVehicleSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formatJoiError(error)
    });
  }
  req.body = value;
  next();
};

export const validateBookVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = bookVehicleSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formatJoiError(error)
    });
  }
  req.body = value;
  next();
};

