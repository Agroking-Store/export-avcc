import { Order, IOrder } from "../models/Order.model";
import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";
import { Client } from "../models/Client.model";
import mongoose from "mongoose";

const generateOrderId = async (): Promise<string> => {
  const random = Math.floor(Math.random() * 1000000);
  return `ORD-${Date.now()}-${random}`;
};

const generateVoucherNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearSuffix = `${currentYear}-${nextYear.toString().slice(2)}`;

  const random = Math.floor(Math.random() * 1000000);
  return `AN/${yearSuffix}/${Date.now()}-${random}`;
};

// export const createOrderService = async (
//   data: CreateOrderDto,
// ): Promise<IOrder> => {
//   if (data.clientId) {
//     const client = await Client.findById(data.clientId);
//     if (!client) throw new Error("Client not found");
//   }

//   if (!data.vehicles || data.vehicles.length === 0) {
//     throw new Error("At least one vehicle is required");
//   }

//   let retries = 5;

//   while (retries > 0) {
//     try {
//       const orderId = await generateOrderId();
//       const voucherNo = await generateVoucherNo();

//       const vehicles = data.vehicles.map((v) => ({
//         name: v.name,
//         color: v.color,
//         quantity: v.quantity,
//       }));

//       const order = new Order({
//         orderId,
//         voucherNo,
//         date: new Date(data.date),
//         clientId: data.clientId || null,
//         dealerId: data.dealerId || null,
//         vehicles,
//         status: "Draft",
//       });

//       return await order.save();
//     } catch (err: any) {
//       if (err.code === 11000) {
//         retries--;
//         continue;
//       } else {
//         throw err;
//       }
//     }
//   }

//   throw new Error("Failed to generate unique order ID");
// };

export const createOrderService = async (
  data: CreateOrderDto,
): Promise<IOrder> => {
  
  if (!data.clientId) {
    throw new Error("clientId is required");
  }

  const client = await Client.findById(data.clientId);
  if (!client) throw new Error("Client not found");

  if (!data.vehicles || data.vehicles.length === 0) {
    throw new Error("At least one vehicle is required");
  }

  const lastOrder = await Order.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastOrder && lastOrder.orderId) {
    const lastNumber = parseInt(lastOrder.orderId.split("-")[1]);
    nextNumber = lastNumber + 1;
  }

  const orderId = `ORD-${String(nextNumber).padStart(3, "0")}`;

  const voucherNo = `AN-${String(nextNumber).padStart(3, "0")}`;

  const vehicles = data.vehicles.map((v) => ({
    name: v.name,
    color: v.color,
    quantity: v.quantity,
    hsnCode: v.hsnCode,
    vehicleName: v.vehicleName,
    exteriorColour: v.exteriorColour,
    chassisNo: v.chassisNo,
    engineNo: v.engineNo,
    engineCapacity: v.engineCapacity,
    fuelType: v.fuelType,
    countryOfOrigin: v.countryOfOrigin,
    yom: v.yom,
    fobAmount: v.fobAmount,
    freight: v.freight,
  }));

  const order = new Order({
    orderId,
    voucherNo,
    date: new Date(data.date),
    clientId: data.clientId,
    vehicles,
    status: "Draft",
  });

  return await order.save();
};

export const getOrdersService = async (query: any) => {
  const { search, page = 1, limit = 10, status } = query;
  let match: any = {};

if (query.clientId) {
  match.clientId = new mongoose.Types.ObjectId(query.clientId);
}

  if (search) {
    match.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { voucherNo: { $regex: search, $options: "i" } },
    ];
  }

  if (status) match.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "clients",
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    {
      $addFields: {
        clientName: { $arrayElemAt: ["$client.name", 0] },
        companyName: { $arrayElemAt: ["$client.companyName", 0] },
        clientCountry: { $arrayElemAt: ["$client.country", 0] },
      }
    },
    { $project: { client: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const total = await Order.countDocuments(match);
  return {
    data: orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getOrderByIdService = async (id: string) => {
  const order = await Order.findById(id)
    .populate({
      path: "clientId",
      select: "name companyName country phone address",
    })
  if (!order) throw new Error("Order not found");
  return order;
};

export const updateOrderService = async (
  id: string,
  data: UpdateOrderDto,
): Promise<IOrder | null> => {
  if (data.clientId) {
    const client = await Client.findById(data.clientId);
    if (!client) throw new Error("Client not found");
  }
  const updateData: any = { ...data };
  if (data.vehicles) {
    if (data.vehicles.length === 0) {
      throw new Error("At least one vehicle is required");
    }

    updateData.vehicles = data.vehicles.map((v) => ({
      name: v.name,
      color: v.color,
      quantity: v.quantity,
      hsnCode: v.hsnCode,
      vehicleName: v.vehicleName,
      exteriorColour: v.exteriorColour,
      chassisNo: v.chassisNo,
      engineNo: v.engineNo,
      engineCapacity: v.engineCapacity,
      fuelType: v.fuelType,
      countryOfOrigin: v.countryOfOrigin,
      yom: v.yom,
      fobAmount: v.fobAmount,
      freight: v.freight,
    }));
  }
  if (data.date) updateData.date = new Date(data.date);
  return await Order.findByIdAndUpdate(id, updateData, { new: true });
};

export const updateOrderStatusService = async (
  id: string,
  status: "Draft" | "Confirmed",
): Promise<IOrder | null> => {
  return await Order.findByIdAndUpdate(id, { status }, { new: true });
};
