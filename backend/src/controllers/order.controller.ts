import { Request, Response } from "express";
import {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
  deleteOrderService,
  updateOrderStatusService,
} from "../services/order.service";
import { validateCreateOrder, validateUpdateOrder } from "../validations/order.validation";

export const createOrder = async (req: Request, res: Response) => {
  try {
    validateCreateOrder(req.body);
    const order = await createOrderService(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getOrdersService(req.query);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await getOrderByIdService(req.params.id as string);
    res.json(order);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    validateUpdateOrder(req.body);
    const updated = await updateOrderService(req.params.id as string, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    await deleteOrderService(req.params.id as string);
    res.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !["Draft", "Confirmed", "PI Generated"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const updated = await updateOrderStatusService(req.params.id as string, status);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};