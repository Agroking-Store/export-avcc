import { Request, Response } from "express";
import {
  createVehicleListItemService,
  getVehicleListItemsService,
  getVehicleOrderFormOptionsService,
  getVehicleListItemByIdService,
  updateVehicleListItemService,
} from "../services/vehicle-list.service";

export const createVehicleListItem = async (req: Request, res: Response) => {
  try {
    const { brandName, modelName, variant, color, quantity } = req.body;

    if (!brandName || !modelName || !variant || !color) {
      throw new Error("All vehicle fields are required");
    }

    const item = await createVehicleListItemService({
      brandName,
      modelName,
      variant,
      color,
      quantity: Number(quantity),
    });

    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getVehicleListItems = async (req: Request, res: Response) => {
  try {
    const items = await getVehicleListItemsService(req.query);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleOrderFormOptions = async (
  _req: Request,
  res: Response,
) => {
  try {
    const options = await getVehicleOrderFormOptionsService();
    res.json(options);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleListItemById = async (req: Request, res: Response) => {
  try {
    const item = await getVehicleListItemByIdService(req.params.id as string);
    res.json(item);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateVehicleListItem = async (req: Request, res: Response) => {
  try {
    const item = await updateVehicleListItemService(req.params.id as string, {
      ...req.body,
      quantity:
        req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
    });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
