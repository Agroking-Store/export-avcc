import { Order, IOrder } from "../models/Order.model";
import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";
import { Client } from "../models/Client.model";

// Helper function to generate orderId (ORD-001, ORD-002, etc.)
const generateOrderId = async (): Promise<string> => {
  const count = await Order.countDocuments();
  return `ORD-${String(count + 1).padStart(3, "0")}`;
};

// Helper function to generate voucherNo (AN/2025-26/1, AN/2025-26/2, etc.)
const generateVoucherNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearSuffix = `${currentYear}-${nextYear.toString().slice(2)}`;
  
  const count = await Order.countDocuments();
  return `AN/${yearSuffix}/${count + 1}`;
};

// Helper function to convert number to words (simplified version)
const numberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (num === 0) return "Zero";
  
  const convertChunk = (n: number): string => {
    let result = "";
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      n = 0;
    }
    
    if (n > 0) {
      result += ones[n] + " ";
    }
    
    return result.trim();
  };
  
  if (num < 1000) {
    return convertChunk(num) + " Dollars";
  } else if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertChunk(thousands) + " Thousand " + (remainder > 0 ? convertChunk(remainder) : "") + " Dollars";
  } else {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return convertChunk(millions) + " Million " + (remainder > 0 ? convertChunk(remainder) : "") + " Dollars";
  }
};

// Create
export const createOrderService = async (data: CreateOrderDto): Promise<IOrder> => {
  // Check if client exists
  const client = await Client.findById(data.clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  // Generate orderId and voucherNo
  const orderId = await generateOrderId();
  const voucherNo = await generateVoucherNo();

  // Calculate grandTotal if not provided
  let grandTotal = data.grandTotal;
  if (!grandTotal) {
    grandTotal = data.vehicles.reduce((sum, vehicle) => sum + vehicle.totalAmount, 0);
  }

  // Generate grandTotalInWords if not provided
  const grandTotalInWords = data.grandTotalInWords || numberToWords(grandTotal);

  const order = new Order({
    ...data,
    orderId,
    voucherNo,
    grandTotal,
    grandTotalInWords,
    status: "Draft", // Default status
  });

  return await order.save();
};

// Get all
export const getOrdersService = async (query: any) => {
  const { search, page = 1, limit = 10, status, clientId } = query;

  let match: any = {};

  if (search) {
    match.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { voucherNo: { $regex: search, $options: "i" } },
      { paymentTerms: { $regex: search, $options: "i" } },
      { buyerRef: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    match.status = status;
  }

  if (clientId) {
    match.clientId = clientId;
  }

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
        clientCountry: { $arrayElemAt: ["$client.country", 0] },
      },
    },
    {
      $project: {
        client: 0, // remove heavy data
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const total = await Order.countDocuments(match);

  return {
    data: orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// Get by ID
export const getOrderByIdService = async (id: string) => {
  const order = await Order.findById(id)
    .populate("clientId", "name country phone email");

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// Update
export const updateOrderService = async (
  id: string,
  data: UpdateOrderDto
): Promise<IOrder | null> => {
  // If clientId is being updated, check if client exists
  if (data.clientId) {
    const client = await Client.findById(data.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
  }

  // If vehicles are being updated, recalculate grandTotal
  let updateData = { ...data };
  if (data.vehicles) {
    const grandTotal = data.vehicles.reduce((sum, vehicle) => sum + vehicle.totalAmount, 0);
    updateData.grandTotal = grandTotal;
    updateData.grandTotalInWords = numberToWords(grandTotal);
  }

  const updated = await Order.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return updated;
};

// Delete
export const deleteOrderService = async (id: string): Promise<void> => {
  const order = await Order.findById(id);
  if (!order) {
    throw new Error("Order not found");
  }

  await Order.findByIdAndDelete(id);
};

// Change status
export const updateOrderStatusService = async (
  id: string,
  status: "Draft" | "Confirmed" | "PI Generated"
): Promise<IOrder | null> => {
  const updated = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  return updated;
};