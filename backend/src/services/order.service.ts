import { Order, IOrder } from "../models/Order.model";
import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";
import { Client } from "../models/Client.model";
import * as pdf from "html-pdf";
import * as path from "path";

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

// Generate PDF
export const generateOrderPDFService = async (id: string): Promise<Buffer> => {
  const order = await Order.findById(id).populate("clientId", "name country phone email address companyName");
  
  if (!order) {
    throw new Error("Order not found");
  }

  // Calculate totals
  const totalFOB = order.vehicles.reduce((sum, v) => sum + (v.fobAmount * v.quantity), 0);
  const totalFreight = order.vehicles.reduce((sum, v) => sum + (v.freight * v.quantity), 0);
  const grandTotal = order.grandTotal;

  // Format date
  const date = new Date(order.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  // HTML template for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proforma Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .company-info { font-size: 14px; line-height: 1.4; }
        .company-name { font-size: 18px; font-weight: bold; color: #2563eb; }
        .invoice-title { font-size: 24px; font-weight: bold; text-align: right; }
        .section { margin-bottom: 15px; }
        .section h3 { margin: 0 0 5px 0; font-size: 14px; color: #333; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .detail-item { font-size: 12px; }
        .detail-label { color: #666; }
        .detail-value { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background-color: #f2f2f2; text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary { margin-top: 20px; }
        .total-row { font-weight: bold; background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .signature { margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">AN AUTOMOBILES</div>
          <div>101, 1st Floor, Shreeji Complex</div>
          <div>Opp. S.T. Bus Stand, Rajkot - 360001</div>
          <div>GSTIN: 24AAEFA0853C1ZL</div>
          <div>Mobile: +91 98790 12345</div>
        </div>
        <div>
          <div class="invoice-title">PROFORMA INVOICE</div>
          <div style="text-align: right; font-size: 12px; margin-top: 5px;">
            Voucher No: <strong>${order.voucherNo}</strong><br>
            Date: <strong>${date}</strong>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>CLIENT INFORMATION</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${order.clientId.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${order.clientId.companyName || "-"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Country:</span>
            <span class="detail-value">${order.clientId.country}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Contact:</span>
            <span class="detail-value">${order.clientId.phone}</span>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1;">
            <span class="detail-label">Address:</span>
            <span class="detail-value">${order.clientId.address}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>SHIPPING INFORMATION</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Incoterm:</span>
            <span class="detail-value">${order.incoterm}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Port of Loading:</span>
            <span class="detail-value">${order.portOfLoading}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Port of Discharge:</span>
            <span class="detail-value">${order.portOfDischarge}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Terms:</span>
            <span class="detail-value">${order.paymentTerms || "-"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Buyer's Reference:</span>
            <span class="detail-value">${order.buyerRef || "-"}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>VEHICLE DETAILS</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center">Sl</th>
              <th>Vehicle</th>
              <th class="text-center">Chassis No</th>
              <th class="text-center">Engine No</th>
              <th class="text-center">Colour</th>
              <th class="text-center">Fuel</th>
              <th class="text-center">YOM</th>
              <th class="text-right">FOB (USD)</th>
              <th class="text-right">Freight</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.vehicles.map((v, index) => `
              <tr>
                <td class="text-center">${v.slNo || index + 1}</td>
                <td>
                  <div><strong>${v.vehicleName}</strong></div>
                  <div style="font-size: 10px; color: #666;">${v.hsnCode}</div>
                </td>
                <td class="text-center">${v.chassisNo}</td>
                <td class="text-center">${v.engineNo}</td>
                <td class="text-center">${v.exteriorColour || "-"}</td>
                <td class="text-center">${v.fuelType}</td>
                <td class="text-center">${v.yom}</td>
                <td class="text-right">$${(v.fobAmount * v.quantity).toLocaleString()}</td>
                <td class="text-right">$${(v.freight * v.quantity).toLocaleString()}</td>
                <td class="text-right">$${v.totalAmount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary">
        <table>
          <tr>
            <td style="width: 70%;"></td>
            <td style="width: 30%;">
              <table>
                <tr>
                  <td>Total FOB</td>
                  <td class="text-right">$${totalFOB.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total Freight</td>
                  <td class="text-right">$${totalFreight.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td>Grand Total</td>
                  <td class="text-right">$${grandTotal.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>AMOUNT IN WORDS</h3>
        <div style="font-weight: bold; font-style: italic;">
          ${order.grandTotalInWords} Only
        </div>
      </div>

      <div class="section">
        <h3>BANK DETAILS</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Bank Name:</span>
            <span class="detail-value">${order.bankName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Account No:</span>
            <span class="detail-value">${order.accountNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Branch:</span>
            <span class="detail-value">${order.branch}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">IFS Code:</span>
            <span class="detail-value">${order.ifscCode}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div><strong>Terms & Conditions:</strong></div>
        <div>1. All prices are in USD and subject to change without notice.</div>
        <div>2. Payment must be made as per agreed terms.</div>
        <div>3. Delivery subject to receipt of payment.</div>
      </div>

      <div class="signature">
        <div style="float: right; text-align: center;">
          <div style="height: 40px;"></div>
          <div><strong>Authorized Signatory</strong></div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Promise((resolve, reject) => {
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: '10mm',
      header: {
        height: '5mm',
        contents: ''
      },
      footer: {
        height: '5mm',
        contents: ''
      }
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
};
