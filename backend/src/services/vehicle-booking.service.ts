import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { VehicleBooking, VehicleBookingStatus } from "../models/VehicleBooking.model";
import { Client } from "../models/Client.model";
import { VehicleOrder } from "../models/VehicleOrder.model";

/**
 * Get all bookings for a given order
 */
export const getBookingsByOrderId = async (orderId: string) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  const existingBookings = await VehicleBooking.find({ orderId }).sort({
    vehicleIndex: 1,
  });

  const existingByIndex = new Map(
    existingBookings.map((booking) => [booking.vehicleIndex, booking]),
  );

  const createOps = [];
  for (let vehicleIndex = 0; vehicleIndex < order.quantity; vehicleIndex += 1) {
    if (!existingByIndex.has(vehicleIndex)) {
      createOps.push({
        orderId: order._id,
        vehicleId: order.vehicleId,
        vehicleIndex,
        status: "pending",
      });
    }
  }

  if (createOps.length > 0) {
    await VehicleBooking.insertMany(createOps, { ordered: false });
  }

  return await VehicleBooking.find({ orderId }).sort({ vehicleIndex: 1 });
};

/**
 * Get or create a booking for a specific vehicle unit in an order
 */
export const getOrCreateBooking = async (orderId: string, vehicleIndex: number) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  if (vehicleIndex < 0 || vehicleIndex >= order.quantity) {
    throw new Error("Vehicle index out of range");
  }

  let booking = await VehicleBooking.findOne({ orderId, vehicleIndex });
  if (!booking) {
    booking = new VehicleBooking({
      orderId,
      vehicleId: order.vehicleId,
      vehicleIndex,
      status: "pending",
    });
    await booking.save();
  }

  return booking;
};

/**
 * Upload quotation file and set status
 */
export const uploadQuotation = async (bookingId: string, filePath: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!["pending", "rejected", "quotation_uploaded"].includes(booking.status)) {
    throw new Error(
      "Quotation can only be uploaded when status is pending, rejected, or awaiting approval",
    );
  }

  const previousQuotation = booking.quotationFile;
  booking.quotationFile = filePath;
  booking.status = "quotation_uploaded";
  booking.rejectionReason = "";

  const updatedBooking = await booking.save();

  if (previousQuotation && previousQuotation !== filePath) {
    const previousAbsolutePath = path.join(
      process.cwd(),
      previousQuotation.replace(/^\/+/, ""),
    );

    if (fs.existsSync(previousAbsolutePath)) {
      fs.unlinkSync(previousAbsolutePath);
    }
  }

  return updatedBooking;
};

/**
 * Approve a booking (quotation must be uploaded)
 */
export const approveBooking = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only approve when quotation is uploaded");
  }

  booking.status = "approved";
  return await booking.save();
};

/**
 * Reject a booking with a mandatory reason
 */
export const rejectBooking = async (bookingId: string, reason: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only reject when quotation is uploaded");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Rejection reason is required");
  }

  booking.status = "rejected";
  booking.rejectionReason = reason.trim();
  return await booking.save();
};

/**
 * Confirm payment with amount only
 */
export const confirmPayment = async (
  bookingId: string,
  amount: number,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "approved") {
    throw new Error("Can only confirm payment when booking is approved");
  }

  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  booking.paymentAmount = amount;
  booking.paymentReference = "";
  booking.status = "payment_done";
  return await booking.save();
};

/**
 * Update chassis and engine numbers
 */
export const updateChassisEngine = async (
  bookingId: string,
  data: {
    chassisNumber?: string;
    engineNumber?: string;
    deliveryDate?: string;
    engineCapacity?: string;
    fuelType?: string;
    countryOfOrigin?: string;
    yom?: string;
    hsnCode?: string;
  },
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  // Client can be allotted at any moment; no restriction on engine/chassis entry

  const chassisNum = data.chassisNumber?.trim().toUpperCase();
  const engineNum = data.engineNumber?.trim().toUpperCase();

  if (engineNum !== undefined) {
    if (!/^[A-Z0-9]{6,20}$/.test(engineNum)) {
      throw new Error("Engine number must be 6-20 alphanumeric characters");
    }
    const dupEngine = await VehicleBooking.findOne({
      _id: { $ne: bookingId },
      engineNumber: { $regex: new RegExp(`^${engineNum}$`, "i") },
    });
    if (dupEngine) throw new Error("Engine number already exists for another vehicle");
  }

  if (chassisNum !== undefined) {
    if (!/^[A-Z0-9]{17}$/.test(chassisNum)) {
      throw new Error("Chassis number must be exactly 17 alphanumeric characters");
    }
    const dupChassis = await VehicleBooking.findOne({
      _id: { $ne: bookingId },
      chassisNumber: { $regex: new RegExp(`^${chassisNum}$`, "i") },
    });
    if (dupChassis) throw new Error("Chassis number already exists for another vehicle");
  }

  if (chassisNum !== undefined) {
    booking.chassisNumber = chassisNum;
  }
  if (engineNum !== undefined) {
    booking.engineNumber = engineNum;
  }
  if (data.deliveryDate !== undefined) {
    booking.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : undefined;
  }
  if (data.engineCapacity !== undefined) {
    booking.engineCapacity = data.engineCapacity.trim();
  }
  if (data.fuelType !== undefined) {
    booking.fuelType = data.fuelType.trim();
  }
  if (data.countryOfOrigin !== undefined) {
    booking.countryOfOrigin = data.countryOfOrigin.trim();
  }
  if (data.yom !== undefined) {
    booking.yom = data.yom.trim();
  }
  if (data.hsnCode !== undefined) {
    booking.hsnCode = data.hsnCode.trim();
  }

  // Auto-advance status if both are filled and status is payment_done
  if (
    booking.chassisNumber &&
    booking.engineNumber &&
    booking.status === "payment_done"
  ) {
    booking.status = "chassis_received";
  }

  return await booking.save();
};

/**
 * Update status manually (e.g. mark as delivered)
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: VehicleBookingStatus,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.status = status;
  return await booking.save();
};

export const assignDealerToBooking = async (
  bookingId: string,
  dealerId: string,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!dealerId || !mongoose.isValidObjectId(dealerId)) {
    throw new Error("Valid dealer is required");
  }

  const Dealer = mongoose.model("Dealer");
  const dealer = await Dealer.findById(dealerId);
  if (!dealer) throw new Error("Dealer not found");

  booking.assignedDealerId = dealer._id as mongoose.Types.ObjectId;
  booking.assignedDealerSnapshot = {
    name: dealer.get("name") || "",
    contact: dealer.get("contact") || "",
    gstNumber: dealer.get("gstNumber") || "",
  };

  return await booking.save();
};

export const assignClientToBooking = async (
  bookingId: string,
  clientId: string,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!clientId || !mongoose.isValidObjectId(clientId)) {
    throw new Error("Valid client is required");
  }

  const client = await Client.findById(clientId);
  if (!client) throw new Error("Client not found");

  booking.assignedClientId = client._id as mongoose.Types.ObjectId;
  booking.assignedClientSnapshot = {
    name: client.name,
    companyName: client.companyName,
    clientCode: client.clientCode,
  };

  return await booking.save();
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return booking;
};

/**
 * Upload CRTM/BV documents for a booking
 */
export const uploadBookingDocuments = async (
  bookingId: string,
  files: { [fieldname: string]: Express.Multer.File[] },
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const updateData: any = {};
  if (files["form20"]) updateData["form20"] = files["form20"][0].path;
  if (files["form21"]) updateData["form21"] = files["form21"][0].path;
  if (files["form22"]) updateData["form22"] = files["form22"][0].path;
  if (files["tempRegCert"])
    updateData["tempRegCert"] = files["tempRegCert"][0].path;
  if (files["bvCertificate"])
    updateData["bvCertificate"] = files["bvCertificate"][0].path;
  if (files["dealerInvoice"])
    updateData["dealerInvoice"] = files["dealerInvoice"][0].path;

  const newDocs = { ...booking.documents, ...updateData };
  const isCRTMComplete = !!(
    newDocs.form20 &&
    newDocs.form21 &&
    newDocs.form22 &&
    newDocs.tempRegCert
  );
  const isBVComplete = !!newDocs.bvCertificate;
  const isDealerInvoiceComplete = !!newDocs.dealerInvoice;

  booking.documents = newDocs;
  booking.isCRTMUploaded = isCRTMComplete;
  booking.isBVUploaded = isBVComplete;
  booking.isDealerInvoiceUploaded = isDealerInvoiceComplete;

  return await booking.save();
};

/**
 * Get a document file path for a booking
 */
export const getBookingFile = async (bookingId: string, field: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const filePath = (booking.documents as any)[field];
  if (!filePath) throw new Error("File not found");

  return filePath;
};

/**
 * Get all vehicle bookings across all orders with filters & pagination
 */
export const getAllVehicleBookingsService = async (query: any) => {
  const { search, status, page = 1, limit = 10 } = query;

  const match: any = {};

  if (status && status !== "All") {
    match.status = status;
  }

  if (search) {
    match.$or = [
      { "orderId.vehicleSnapshot.brandName": { $regex: search, $options: "i" } },
      { "orderId.vehicleSnapshot.modelName": { $regex: search, $options: "i" } },
      { "orderId.vehicleSnapshot.variant": { $regex: search, $options: "i" } },
      { "orderId.orderNumber": { $regex: search, $options: "i" } },
      { engineNumber: { $regex: search, $options: "i" } },
      { chassisNumber: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const pipeline: any[] = [
    {
      $lookup: {
        from: "vehicleorders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },
    {
      $addFields: {
        orderId: "$order",
      },
    },
  ];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await VehicleBooking.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  );

  const data = await VehicleBooking.aggregate(pipeline);

  return {
    data,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};
export const getReminderDueBookings = async (
  orderId: string,
  intervalHours: number,
) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  const hours = Number.isFinite(intervalHours) && intervalHours > 0 ? intervalHours : 2;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const due = await VehicleBooking.find({
    orderId,
    status: "payment_done",
    $and: [
      { $or: [{ engineNumber: "" }, { chassisNumber: "" }] },
      {
        $or: [
          { lastReminderAt: { $exists: false } },
          { lastReminderAt: { $lte: cutoff } },
        ],
      },
    ],
  }).sort({ vehicleIndex: 1 });

  if (due.length > 0) {
    await VehicleBooking.updateMany(
      { _id: { $in: due.map((item) => item._id) } },
      {
        $set: { lastReminderAt: new Date() },
        $inc: { reminderCount: 1 },
      },
    );
  }

  return due;
};
