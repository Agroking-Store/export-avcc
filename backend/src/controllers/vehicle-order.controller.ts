import { Request, Response } from "express";
import {
  createVehicleOrderService,
  getVehicleOrderByIdService,
  getVehicleOrdersService,
  updateVehicleOrderService,
  deleteVehicleOrderService,
} from "../services/vehicle-order.service";
import { ROLES } from "../config/constants";
import { getClientByEmailService } from "../services/client.service";

export const createVehicleOrder = async (req: Request, res: Response) => {
  try {
    const { clientId, vehicleId, orderDate, quantity } = req.body;
    const userRole = (req as any).user?.role;
    const userEmail = (req as any).user?.email;

    if (!vehicleId || !quantity) {
      throw new Error("Vehicle and quantity are required");
    }

    let resolvedClientId = clientId || undefined;

    if (userRole === ROLES.CLIENT) {
      if (!userEmail) {
        throw new Error("Unauthorized");
      }

      const currentClient = await getClientByEmailService(userEmail);
      resolvedClientId = currentClient?.client?._id?.toString();

      if (!resolvedClientId) {
        throw new Error("Client profile not found for logged in user");
      }
    }

    const order = await createVehicleOrderService({
      clientId: resolvedClientId,
      vehicleId,
      orderDate: orderDate || undefined,
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

    if (!vehicleId || !quantity) {
      throw new Error("Vehicle and quantity are required");
    }

    const order = await updateVehicleOrderService(req.params.id as string, {
      clientId: clientId || undefined,
      vehicleId,
      orderDate: orderDate || undefined,
      quantity: Number(quantity),
      status,
    });

    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicleOrder = async (req: Request, res: Response) => {
  try {
    await deleteVehicleOrderService(req.params.id as string);
    res.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
