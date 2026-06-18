import { Request, Response } from "express";
import {
  addVehicleToShipment,
  createShipment,
  getAvailableShipmentVehicles,
  getShipmentById,
  listShipments,
  getShippedVehicleDetailsForShipment,
  removeVehicleFromShipment,
  updateShipment,
} from "../services/shipment.service";
import { getCustomerNamesHandler } from "./shipmentCustomer.controller";



export const listShipmentsHandler = async (req: Request, res: Response) => {
  try {
    const result = await listShipments(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createShipmentHandler = async (req: Request, res: Response) => {
  try {
    const shipment = await createShipment(req.body);
    res.status(201).json(shipment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getShipmentHandler = async (req: Request, res: Response) => {
  try {
    const shipment = await getShipmentById(req.params.id as string);
    res.json(shipment);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const availableShipmentVehiclesHandler = async (
  _req: Request,
  res: Response,
) => {
  try {
    const vehicles = await getAvailableShipmentVehicles();
    res.json(vehicles);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addVehicleToShipmentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const shipment = await addVehicleToShipment({
      shipmentId: req.params.id as string,
      vehicleBookingId: req.body.vehicleBookingId,
    });
    res.json(shipment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getShippedVehicleDetailsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const details = await getShippedVehicleDetailsForShipment(
      req.params.id as string,
    );
    res.json(details);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateShipmentHandler = async (req: Request, res: Response) => {
  try {
    const updated = await updateShipment({
      shipmentId: req.params.id as string,
      payload: req.body,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeVehicleFromShipmentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const shipment = await removeVehicleFromShipment({
      shipmentId: req.params.id as string,
      vehicleBookingId: req.params.vehicleBookingId as string,
    });
    res.json(shipment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
