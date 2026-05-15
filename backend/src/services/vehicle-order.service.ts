import { Client } from "../models/Client.model";
import { VehicleListItem } from "../models/VehicleListItem.model";
import { VehicleOrder } from "../models/VehicleOrder.model";
import { VehicleBooking } from "../models/VehicleBooking.model";

interface CreateVehicleOrderDto {
  clientId?: string;
  vehicleId: string;
  orderDate?: string;
  quantity: number;
}

interface UpdateVehicleOrderDto {
  clientId?: string;
  vehicleId: string;
  orderDate?: string;
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

export const createVehicleOrderService = async (
  data: CreateVehicleOrderDto,
) => {
  const vehicle = await VehicleListItem.findById(data.vehicleId);

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  let client = null;
  if (data.clientId) {
    client = await Client.findById(data.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
  }

  const orderQuantity = Number(data.quantity);
  if (orderQuantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const orderNumber = await generateVehicleOrderNumber();

  const orderData: any = {
    orderNumber,
    vehicleId: vehicle._id as any,
    quantity: orderQuantity,
    status: "Pending",
    vehicleSnapshot: {
      brandName: vehicle.brandName,
      modelName: vehicle.modelName,
      variant: vehicle.variant,
      color: vehicle.color,
      commercialHsnCode:
        vehicle.commercialHsnCode || vehicle.hsnCode || "",
      exportHsnCode: vehicle.exportHsnCode || vehicle.hsnCode || "",
      hsnCode: vehicle.exportHsnCode || vehicle.hsnCode || "",
    },
  };

  if (client) {
    orderData.clientId = client._id as any;
    orderData.clientSnapshot = {
      name: client.name,
      companyName: client.companyName,
    };
  }

  if (data.orderDate) {
    orderData.orderDate = new Date(data.orderDate);
  }

  const order = new VehicleOrder(orderData);

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

  const vehicle = await VehicleListItem.findById(data.vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  let client = null;
  if (data.clientId) {
    client = await Client.findById(data.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
  }

  const requestedQuantity = Number(data.quantity);
  if (requestedQuantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  if (client) {
    order.clientId = client._id as any;
    order.clientSnapshot = {
      name: client.name,
      companyName: client.companyName,
    };
  } else {
    order.clientId = undefined;
    order.clientSnapshot = undefined;
  }

  order.vehicleId = vehicle._id as any;
  order.orderDate = data.orderDate ? new Date(data.orderDate) : undefined;
  order.quantity = requestedQuantity;
  order.status = data.status || order.status;
  order.vehicleSnapshot = {
    brandName: vehicle.brandName,
    modelName: vehicle.modelName,
    variant: vehicle.variant,
    color: vehicle.color,
    commercialHsnCode: vehicle.commercialHsnCode || vehicle.hsnCode || "",
    exportHsnCode: vehicle.exportHsnCode || vehicle.hsnCode || "",
    hsnCode: vehicle.exportHsnCode || vehicle.hsnCode || "",
  };

  return await order.save();
};

export const deleteVehicleOrderService = async (id: string) => {
  // Check if any bookings exist for this order
  const hasBookings = await VehicleBooking.findOne({ orderId: id });
  if (hasBookings) {
    throw new Error(
      "Cannot delete: This order has existing vehicle bookings/allotments.",
    );
  }

  const order = await VehicleOrder.findByIdAndDelete(id);
  if (!order) throw new Error("Order not found");
  return order;
};
