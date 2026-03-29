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

  const orderId = await generateOrderId();
  const voucherNo = await generateVoucherNo();
  const grandTotal = data.vehicles.reduce((sum, v) => sum + v.fobAmount + v.freight, 0);

  const order = new Order({
    orderId,
    voucherNo,
    date: new Date(data.date),
    clientId: data.clientId,
    dealerId: data.dealerId || null,
    vehicles: data.vehicles,
    grandTotal,
    status: "Draft"
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
{ $addFields: { 
    clientName: { $arrayElemAt: ["$client.name", 0] },
    dealerName: { $arrayElemAt: ["$dealer.name", 0] }
}},
{ $project: { client: 0, dealer: 0 } },
    { $lookup: { from: "clients", localField: "clientId", foreignField: "_id", as: "client" } },
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
  const updateData: any = { ...data };
  if (data.vehicles) {
    updateData.grandTotal = data.vehicles.reduce((sum, v) => sum + v.fobAmount + v.freight, 0);
  }
  if (data.date) updateData.date = new Date(data.date);
  return await Order.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteOrderService = async (id: string): Promise<void> => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) throw new Error("Order not found");
};

export const updateOrderStatusService = async (id: string, status: "Draft" | "Confirmed"): Promise<IOrder | null> => {
  return await Order.findByIdAndUpdate(id, { status }, { new: true });
};