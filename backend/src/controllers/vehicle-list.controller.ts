import { Request, Response } from "express";
import {
  createVehicleListItemService,
  createVehicleListItemsService,
  getVehicleListItemsService,
  getVehicleOrderFormOptionsService,
  getVehicleListItemByIdService,
  updateVehicleListItemService,
  deleteVehicleListItemService,
} from "../services/vehicle-list.service";

export const createVehicleListItem = async (req: Request, res: Response) => {
  try {
    const {
      brandName,
      modelName,
      variant,
      color,
      commercialHsnCode,
      exportHsnCode,
      quantity,
      fobAmount,
      freight,
    } = req.body;

    if (
      !brandName ||
      !modelName ||
      !variant ||
      !color ||
      !commercialHsnCode ||
      !exportHsnCode
    ) {
      throw new Error("All vehicle fields are required");
    }

    const item = await createVehicleListItemService({
      brandName,
      modelName,
      variant,
      color,
      commercialHsnCode,
      exportHsnCode,
      quantity: quantity !== undefined ? Number(quantity) : 1,
      fobAmount: fobAmount !== undefined ? Number(fobAmount) : undefined,
      freight: freight !== undefined ? Number(freight) : undefined,
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

export const createVehicleListItems = async (req: Request, res: Response) => {
  try {
    const { vehicles } = req.body;

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      throw new Error("Vehicles array is required");
    }

    for (const v of vehicles) {
      if (
        !v.brandName ||
        !v.modelName ||
        !v.variant ||
        !v.color ||
        !v.commercialHsnCode ||
        !v.exportHsnCode
      ) {
        throw new Error("All vehicle fields are required for each entry");
      }
    }

    const items = await createVehicleListItemsService(
      vehicles.map((v: any) => ({
        brandName: v.brandName.trim(),
        modelName: v.modelName.trim(),
        variant: v.variant.trim(),
        color: v.color.trim(),
        commercialHsnCode: v.commercialHsnCode.trim(),
        exportHsnCode: v.exportHsnCode.trim(),
        quantity: v.quantity !== undefined ? Number(v.quantity) : 1,
        fobAmount: v.fobAmount !== undefined ? Number(v.fobAmount) : undefined,
        freight: v.freight !== undefined ? Number(v.freight) : undefined,
      })),
    );

    res.status(201).json({ data: items, count: items.length });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVehicleListItem = async (req: Request, res: Response) => {
  try {
    const item = await updateVehicleListItemService(req.params.id as string, {
      ...req.body,
      quantity:
        req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
      fobAmount:
        req.body.fobAmount !== undefined
          ? Number(req.body.fobAmount)
          : undefined,
      freight:
        req.body.freight !== undefined ? Number(req.body.freight) : undefined,
    });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicleListItem = async (req: Request, res: Response) => {
  try {
    await deleteVehicleListItemService(req.params.id as string);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
