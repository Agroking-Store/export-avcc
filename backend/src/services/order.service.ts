import { Order, IOrder } from "../models/Order.model";
import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";
import { Client } from "../models/Client.model";
import mongoose from "mongoose";

const generateOrderId = async (): Promise<string> => {
  const latest = await Order.findOne().sort({ createdAt: -1 }).select('orderId');
  if (!latest) return 'ORD-001';
  const num = parseInt(latest.orderId.split('-')[1]) + 1;
  return `ORD-${String(num).padStart(3, "0")}`;
};

const generateVoucherNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearSuffix = `${currentYear}-${nextYear.toString().slice(2)}`;
  const latest = await Order.findOne().sort({ createdAt: -1 }).select('voucherNo');
  if (!latest) return `AN/${yearSuffix}/1`;
  const num = parseInt(latest.voucherNo.split('/').pop() || '0') + 1;
  return `AN/${yearSuffix}/${num}`;
};

export const createOrderService = async (data: CreateOrderDto): Promise<IOrder> => {
  if (data.clientId) {
    const client = await Client.findById(data.clientId);
    if (!client) throw new Error("Client not found");
  }

  if (!data.vehicles || data.vehicles.length === 0) {
    throw new Error("At least one vehicle is required");
  }

  const vehicles = data.vehicles.map(v => ({
    name: v.name,
    color: v.color,
    quantity: v.quantity,
    srNo: v.srNo || null,
  }));

  const orderId = await generateOrderId();
  const voucherNo = await generateVoucherNo();

  const order = new Order({
    orderId,
    voucherNo,
    date: new Date(data.date),
    clientId: data.clientId || null,
    dealerId: data.dealerId || null,
    vehicles,
    vehicleColors: [], // initialize empty
    status: "Draft",
  });

  return await order.save();
};

export const getOrdersService = async (query: any) => {
  const { search, page = 1, limit = 10, status } = query;
  let match: any = {};

  if (search) {
    match.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { voucherNo: { $regex: search, $options: "i" } }
    ];
  }

  if (status) match.status = status;

  if (query.dealerId) {
    match.dealerId = new mongoose.Types.ObjectId(query.dealerId);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.aggregate([
    { $match: match },
    { $lookup: { from: "clients", localField: "clientId", foreignField: "_id", as: "client" } },
    { $lookup: { from: "dealers", localField: "dealerId", foreignField: "_id", as: "dealer" } },
    {
      $addFields: {
        clientName: { $arrayElemAt: ["$client.name", 0] },
        companyName: { $arrayElemAt: ["$client.companyName", 0] },
        clientCountry: { $arrayElemAt: ["$client.country", 0] }
      }
    },
    { $project: { client: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) }
  ]);

  const total = await Order.countDocuments(match);
  return { data: orders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const getOrderByIdService = async (id: string) => {
  const order = await Order.findById(id).populate({
    path: 'clientId',
    select: 'name companyName country phone address'
  });
  if (!order) throw new Error("Order not found");
  return order;
};

export const updateOrderService = async (id: string, data: UpdateOrderDto): Promise<IOrder | null> => {
  if (data.clientId) {
    const client = await Client.findById(data.clientId);
    if (!client) throw new Error("Client not found");
  }

  const updateData: any = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.clientId !== undefined) updateData.clientId = data.clientId || null;
  if (data.dealerId !== undefined) updateData.dealerId = data.dealerId || null;
  if (data.vehicles) {
    if (data.vehicles.length === 0) {
      throw new Error("At least one vehicle is required");
    }
    updateData.vehicles = data.vehicles.map(v => ({
      name: v.name,
      color: v.color,
      quantity: v.quantity,
      srNo: v.srNo || null,
    }));
  }

  // ─── Handle vehicleColorUpdate ───────────────────────────────────────────────
  // Updates color for a single expanded vehicle slot (e.g. BMW copy #3)
  // Does NOT touch the vehicles[] array at all
  if (data.vehicleColorUpdate) {
    const { expandedIndex, color } = data.vehicleColorUpdate;

    const order = await Order.findById(id);
    if (!order) throw new Error("Order not found");

    const existing = order.vehicleColors.find(vc => vc.expandedIndex === expandedIndex);
    if (existing) {
      // Update existing color override
      existing.color = color;
    } else {
      // Add new color override for this slot
      order.vehicleColors.push({ expandedIndex, color });
    }

    return await order.save();
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Handle vehiclesUpdate (name/srNo edits on vehicles[] array) ─────────────
  let vehicleUpdate: any = {};
  let needsVehicleFetch = false;

  if (data.vehiclesUpdate) {
    const { index, color, name, srNo } = data.vehiclesUpdate;
    if (index < 0) throw new Error("Invalid vehicle index");

    needsVehicleFetch = true;

    if (color !== undefined) vehicleUpdate[`vehicles.${index}.color`] = color;
    if (name !== undefined) vehicleUpdate[`vehicles.${index}.name`] = name;
    if (srNo !== undefined) vehicleUpdate[`vehicles.${index}.srNo`] = srNo;
  }

  let order: IOrder | null = null;
  if (needsVehicleFetch) {
    order = await Order.findById(id);
    if (!order) throw new Error("Order not found");
    if (data.vehiclesUpdate!.index >= order.vehicles.length) {
      throw new Error("Vehicle index out of bounds");
    }
  }

  const finalUpdate: any = { ...updateData };
  if (Object.keys(vehicleUpdate).length > 0) {
    finalUpdate.$set = vehicleUpdate;
  }

  if (Object.keys(finalUpdate).length === 0 && Object.keys(vehicleUpdate).length === 0) {
    return order || await Order.findById(id);
  }

  return await Order.findByIdAndUpdate(id, finalUpdate, { returnDocument: 'after', runValidators: true });
};

export const updateOrderStatusService = async (id: string, status: "Draft" | "Confirmed"): Promise<IOrder | null> => {
  return await Order.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
};