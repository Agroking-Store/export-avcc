import { Client } from "../models/Client.model";
import { VehicleListItem } from "../models/VehicleListItem.model";
import { VehicleOrder } from "../models/VehicleOrder.model";

interface CreateVehicleListItemDto {
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  hsnCode: string;
  quantity?: number;
  fobAmount?: number;
  freight?: number;
}

interface UpdateVehicleListItemDto {
  brandName?: string;
  modelName?: string;
  variant?: string;
  color?: string;
  hsnCode?: string;
  quantity?: number;
  fobAmount?: number;
  freight?: number;
}

export const createVehicleListItemService = async (
  data: CreateVehicleListItemDto,
) => {
  const item = new VehicleListItem({
    ...data,
    quantity: data.quantity !== undefined ? Number(data.quantity) : 1,
  });

  return await item.save();
};

export const createVehicleListItemsService = async (
  items: CreateVehicleListItemDto[],
) => {
  const created = await Promise.all(
    items.map((data) =>
      new VehicleListItem({
        ...data,
        quantity: data.quantity !== undefined ? Number(data.quantity) : 1,
      }).save(),
    ),
  );
  return created;
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
    Client.find({}).select("name companyName").sort({ createdAt: -1 }),
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
  if (updateData.hsnCode !== undefined) item.hsnCode = updateData.hsnCode;
  if (updateData.quantity !== undefined)
    item.quantity = Number(updateData.quantity);
  if (updateData.fobAmount !== undefined)
    item.fobAmount = Number(updateData.fobAmount);
  if (updateData.freight !== undefined)
    item.freight = Number(updateData.freight);

  item.status = item.quantity > 0 ? "Available" : "Out of Stock";

  return await item.save();
};

export const deleteVehicleListItemService = async (id: string) => {
  const isUsed = await VehicleOrder.findOne({ vehicleId: id });
  if (isUsed) {
    throw new Error(
      "Cannot delete: This vehicle is currently linked to an active order.",
    );
  }

  const item = await VehicleListItem.findByIdAndDelete(id);
  if (!item) throw new Error("Vehicle not found");
  return item;
};
