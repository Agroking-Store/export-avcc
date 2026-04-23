import { Client } from "../models/Client.model";
import { VehicleListItem } from "../models/VehicleListItem.model";
import { VehicleOrder } from "../models/VehicleOrder.model";

interface CreateVehicleOrderDto {
  clientId: string;
  vehicleId: string;
  orderDate: string;
  quantity: number;
}

interface UpdateVehicleOrderDto {
  clientId: string;
  vehicleId: string;
  orderDate: string;
  quantity: number;
  status?: "Pending" | "Confirmed" | "Completed";
}

const generateVehicleOrderNumber = async (): Promise<string> => {
  const latest = await VehicleOrder.findOne()
    .sort({ createdAt: -1 })
    .select("orderNumber");

  if (!latest?.orderNumber) {
    return "VOR-001";
  }

  const lastNumber = parseInt(latest.orderNumber.split("-")[1] || "0", 10);
  return `VOR-${String(lastNumber + 1).padStart(3, "0")}`;
};

export const createVehicleOrderService = async (data: CreateVehicleOrderDto) => {
  const [client, vehicle] = await Promise.all([
    Client.findById(data.clientId),
    VehicleListItem.findById(data.vehicleId),
  ]);

  if (!client) {
    throw new Error("Client not found");
  }

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const orderQuantity = Number(data.quantity);
  if (orderQuantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const orderNumber = await generateVehicleOrderNumber();

  const order = new VehicleOrder({
    orderNumber,
    clientId: client._id as any,
    vehicleId: vehicle._id as any,
    orderDate: new Date(data.orderDate),
    quantity: orderQuantity,
    status: "Pending",
    clientSnapshot: {
      name: client.name,
      companyName: client.companyName,
    },
    vehicleSnapshot: {
      brandName: vehicle.brandName,
      modelName: vehicle.modelName,
      variant: vehicle.variant,
      color: vehicle.color,
    },
  });

  await order.save();

  return order;
};

export const getVehicleOrdersService = async (query: any) => {
  const { search, status, page = 1, limit = 5 } = query;
  const match: any = {};

  if (status && status !== "All") {
    match.status = status;
  }

  if (search) {
    match.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "clientSnapshot.name": { $regex: search, $options: "i" } },
      { "vehicleSnapshot.brandName": { $regex: search, $options: "i" } },
      { "vehicleSnapshot.modelName": { $regex: search, $options: "i" } },
      { "vehicleSnapshot.variant": { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    VehicleOrder.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VehicleOrder.countDocuments(match),
  ]);

  return {
    data: orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getVehicleOrderByIdService = async (id: string) => {
  const order = await VehicleOrder.findById(id);
  if (!order) {
    throw new Error("Vehicle order not found");
  }

  return order;
};

export const updateVehicleOrderService = async (
  id: string,
  data: UpdateVehicleOrderDto,
) => {
  const order = await VehicleOrder.findById(id);
  if (!order) {
    throw new Error("Vehicle order not found");
  }

  const [client, vehicle] = await Promise.all([
    Client.findById(data.clientId),
    VehicleListItem.findById(data.vehicleId),
  ]);

  if (!client) {
    throw new Error("Client not found");
  }

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const requestedQuantity = Number(data.quantity);
  if (requestedQuantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  order.clientId = client._id as any;
  order.vehicleId = vehicle._id as any;
  order.orderDate = new Date(data.orderDate);
  order.quantity = requestedQuantity;
  order.status = data.status || order.status;
  order.clientSnapshot = {
    name: client.name,
    companyName: client.companyName,
  };
  order.vehicleSnapshot = {
    brandName: vehicle.brandName,
    modelName: vehicle.modelName,
    variant: vehicle.variant,
    color: vehicle.color,
  };

  return await order.save();
};
