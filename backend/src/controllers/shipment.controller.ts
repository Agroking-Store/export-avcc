import { Request, Response } from "express";
import {
  addContainerToShipment,
  addVehicleToContainer,
  createShipment,
  getAvailableShipmentVehicles,
  getShipmentById,
  listShipments,
  getShippedVehicleDetailsForShipment,
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

export const addContainerHandler = async (req: Request, res: Response) => {
  try {
    const shipment = await addContainerToShipment(
      req.params.id as string,
      req.body.containerNumber,
    );
    res.status(201).json(shipment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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

export const addVehicleToContainerHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const shipment = await addVehicleToContainer({
      shipmentId: req.params.id as string,
      containerId: req.params.containerId as string,
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
