import { Client } from "../models/Client.model";
import { VehicleListItem } from "../models/VehicleListItem.model";

interface CreateVehicleListItemDto {
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  quantity: number;
}

interface UpdateVehicleListItemDto {
  brandName?: string;
  modelName?: string;
  variant?: string;
  color?: string;
  quantity?: number;
}

export const createVehicleListItemService = async (
  data: CreateVehicleListItemDto,
) => {
  const item = new VehicleListItem({
    ...data,
    quantity: Number(data.quantity),
  });

  return await item.save();
};

export const getVehicleListItemsService = async (query: any) => {
  const { search, page = 1, limit = 5 } = query;

  const match: any = {};
  if (search) {
    match.$or = [
      { brandName: { $regex: search, $options: "i" } },
      { modelName: { $regex: search, $options: "i" } },
      { variant: { $regex: search, $options: "i" } },
      { color: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    VehicleListItem.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VehicleListItem.countDocuments(match),
  ]);

  return {
    data: items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getVehicleOrderFormOptionsService = async () => {
  const [clients, vehicles] = await Promise.all([
    Client.find({})
      .select("name companyName")
      .sort({ createdAt: -1 }),
    VehicleListItem.find({})
      .select("brandName modelName variant color quantity status")
      .sort({ createdAt: -1 }),
  ]);

  return { clients, vehicles };
};

export const getVehicleListItemByIdService = async (id: string) => {
  const item = await VehicleListItem.findById(id);
  if (!item) {
    throw new Error("Vehicle not found");
  }

  return item;
};

export const updateVehicleListItemService = async (
  id: string,
  data: UpdateVehicleListItemDto,
) => {
  const updateData = {
    ...data,
    quantity:
      typeof data.quantity === "number" ? Number(data.quantity) : data.quantity,
  };

  const item = await VehicleListItem.findById(id);
  if (!item) {
    throw new Error("Vehicle not found");
  }

  if (updateData.brandName !== undefined) item.brandName = updateData.brandName;
  if (updateData.modelName !== undefined) item.modelName = updateData.modelName;
  if (updateData.variant !== undefined) item.variant = updateData.variant;
  if (updateData.color !== undefined) item.color = updateData.color;
  if (updateData.quantity !== undefined) item.quantity = Number(updateData.quantity);

  item.status = item.quantity > 0 ? "Available" : "Out of Stock";

  return await item.save();
};
