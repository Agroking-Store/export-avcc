import { Request, Response, NextFunction } from "express";
import {
  createVehicleSchema,
  updateVehicleSchema,
  bookVehicleSchema,
} from "../dto/vehicle.dto";

const formatJoiError = (error: any) => {
  return error.details.map((detail: any) => ({
    path: detail.path,
    message: detail.message.replace(/['"]+/g, ""),
  }));
};

const validateSchema = (schema: any, payload: unknown) => {
  const { error, value } = schema.validate(payload, { abortEarly: false });

  if (error) {
    const details = formatJoiError(error);
    throw new Error(details.map((detail: any) => detail.message).join(", "));
  }

  return value;
};

export const assertCreateVehicle = (data: unknown) =>
  validateSchema(createVehicleSchema, data);

export const assertUpdateVehicle = (data: unknown) =>
  validateSchema(updateVehicleSchema, data);

export const assertBookVehicle = (data: unknown) =>
  validateSchema(bookVehicleSchema, data);

export const validateCreateVehicle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.body = assertCreateVehicle(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};

export const validateUpdateVehicle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.body = assertUpdateVehicle(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};

export const validateBookVehicle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.body = assertBookVehicle(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
    });
  }
};
