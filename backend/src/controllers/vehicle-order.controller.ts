import { Request, Response } from "express";
import {
  createVehicleOrderService,
  getVehicleOrderByIdService,
  getVehicleOrdersService,
  updateVehicleOrderService,
} from "../services/vehicle-order.service";

export const createVehicleOrder = async (req: Request, res: Response) => {
  try {
    const { clientId, vehicleId, orderDate, quantity } = req.body;

    if (!clientId || !vehicleId || !orderDate || !quantity) {
      throw new Error("Client, vehicle, date, and quantity are required");
    }

    const order = await createVehicleOrderService({
      clientId,
      vehicleId,
      orderDate,
      quantity: Number(quantity),
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getVehicleOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getVehicleOrdersService(req.query);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleOrderById = async (req: Request, res: Response) => {
  try {
    const order = await getVehicleOrderByIdService(req.params.id as string);
    res.json(order);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateVehicleOrder = async (req: Request, res: Response) => {
  try {
    const { clientId, vehicleId, orderDate, quantity, status } = req.body;

    if (!clientId || !vehicleId || !orderDate || !quantity) {
      throw new Error("Client, vehicle, date, and quantity are required");
    }

    const order = await updateVehicleOrderService(req.params.id as string, {
      clientId,
      vehicleId,
      orderDate,
      quantity: Number(quantity),
      status,
    });

    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
