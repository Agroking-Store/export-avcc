import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  VehicleBooking,
  VehicleBookingStatus,
} from "../models/VehicleBooking.model";
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
        ...(order.clientId
          ? {
              assignedClientId: order.clientId,
              assignedClientSnapshot: {
                name: order.clientSnapshot?.name || "",
                companyName: order.clientSnapshot?.companyName || "",
              },
            }
          : {}),
      });
    }
  }

  if (createOps.length > 0) {
    await VehicleBooking.insertMany(createOps, { ordered: false });
  }

  if (order.clientId) {
    await VehicleBooking.updateMany(
      {
        orderId,
        $or: [
          { assignedClientId: { $exists: false } },
          { assignedClientId: null },
        ],
      },
      {
        $set: {
          assignedClientId: order.clientId,
          assignedClientSnapshot: {
            name: order.clientSnapshot?.name || "",
            companyName: order.clientSnapshot?.companyName || "",
          },
        },
      },
    );
  }

  return await VehicleBooking.find({ orderId })
    .populate("vehicleId")
    .populate("orderId")
    .sort({ vehicleIndex: 1 });
};

/**
 * Get or create a booking for a specific vehicle unit in an order
 */
export const getOrCreateBooking = async (
  orderId: string,
  vehicleIndex: number,
) => {
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
      ...(order.clientId
        ? {
            assignedClientId: order.clientId,
            assignedClientSnapshot: {
              name: order.clientSnapshot?.name || "",
              companyName: order.clientSnapshot?.companyName || "",
            },
          }
        : {}),
    });
    await booking.save();
  }

  return await VehicleBooking.findById(booking._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Upload quotation file and wait for costing details before approval
 */
export const uploadQuotation = async (bookingId: string, filePath: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (
    ![
      "pending",
      "rejected",
      "quotation_details_pending",
      "quotation_uploaded",
    ].includes(booking.status)
  ) {
    throw new Error(
      "Quotation can only be uploaded before approval starts",
    );
  }

  const previousQuotation = booking.quotationFile;
  booking.quotationFile = filePath;
  booking.status = "quotation_details_pending";
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

  return await VehicleBooking.findById(updatedBooking._id)
    .populate("vehicleId")
    .populate("orderId");
};

const toCleanNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Quotation costing amounts must be valid positive numbers");
  }
  return parsed;
};

const toCleanString = (value: unknown) => String(value || "").trim();

export const saveQuotationDetails = async (bookingId: string, data: any) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!booking.quotationFile) {
    throw new Error("Please upload quotation before saving costing details");
  }

  if (
    !["quotation_details_pending", "quotation_uploaded", "rejected"].includes(
      booking.status,
    )
  ) {
    throw new Error("Quotation details can only be saved before approval");
  }

  const requiredFields = [
    ["dealershipName", "Dealership name"],
    ["brand", "Brand"],
    ["carModelName", "Car model name"],
  ] as const;

  for (const [key, label] of requiredFields) {
    if (!toCleanString(data?.[key])) {
      throw new Error(`${label} is required`);
    }
  }

  const netCost = data?.netCost || {};
  const taxAmount = data?.taxAmount || {};

  booking.bookingAmount = data.bookingAmount !== undefined ? toCleanNumber(data.bookingAmount) : booking.bookingAmount;

  booking.quotationDetails = {
    dealershipName: toCleanString(data.dealershipName),
    brand: toCleanString(data.brand),
    carModelName: toCleanString(data.carModelName),
    // carColour replaces driveLink
    carColour: toCleanString(data.carColour),
    exShowroomPrice: toCleanNumber(data.exShowroomPrice),
    gstRate: toCleanNumber(data.gstRate),
    netCost: {
      basicValue: toCleanNumber(netCost.basicValue),
      handlingCharges: toCleanNumber(netCost.handlingCharges),
      crtm: toCleanNumber(netCost.crtm),
      insurance: toCleanNumber(netCost.insurance),
      registrationCost: toCleanNumber(netCost.registrationCost),
      cashComponent: toCleanNumber(netCost.cashComponent),
      bureauVeritas: toCleanNumber(netCost.bureauVeritas),
      shippingCost: toCleanNumber(netCost.shippingCost),
      total: toCleanNumber(netCost.total),
    },
    taxAmount: {
      carGst: toCleanNumber(taxAmount.carGst),
      bureauVeritasGst: toCleanNumber(taxAmount.bureauVeritasGst),
      shippingGst: toCleanNumber(taxAmount.shippingGst),
      insuranceGst: toCleanNumber(taxAmount.insuranceGst),
      tcs: toCleanNumber(taxAmount.tcs),
      total: toCleanNumber(taxAmount.total),
    },
    grandTotal: toCleanNumber(data?.grandTotal),
    savedAt: new Date(),
  };
  booking.status = "quotation_uploaded";
  booking.rejectionReason = "";

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Approve a booking (quotation must be uploaded)
 */
export const approveBooking = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only approve after quotation details are saved");
  }

  if (!booking.quotationDetails?.savedAt) {
    throw new Error("Please save quotation details before approval");
  }

  booking.status = "approved";
  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Reject a booking with a mandatory reason
 */
export const rejectBooking = async (bookingId: string, reason: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only reject after quotation details are saved");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Rejection reason is required");
  }

  booking.status = "rejected";
  booking.rejectionReason = reason.trim();
  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Confirm payment with amount only
 */
export const confirmPayment = async (bookingId: string, amount: number) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "approved") {
    throw new Error("Can only confirm payment when booking is approved");
  }

  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  booking.paymentAmount = amount;
  booking.status = "payment_done";
  
  // Push to payments array to track in the ledger
  booking.payments = booking.payments || [];
  booking.payments.push({
    amount,
    date: new Date(),
    reference: booking.paymentReference || "Initial Booking Payment",
    remarks: "Booking Amount Payment",
  });

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Record a generic payment for a booking
 */
export const addPayment = async (
  bookingId: string,
  paymentData: { amount: number; date?: string | Date; reference?: string; remarks?: string }
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const amount = Number(paymentData.amount);
  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  booking.payments = booking.payments || [];
  booking.payments.push({
    amount,
    date: paymentData.date ? new Date(paymentData.date) : new Date(),
    reference: paymentData.reference ? String(paymentData.reference).trim() : "",
    remarks: paymentData.remarks ? String(paymentData.remarks).trim() : "",
  });

  // Increment aggregate paymentAmount
  booking.paymentAmount = (booking.paymentAmount || 0) + amount;

  // Auto-advance status if booking is approved and this is the first payment
  if (booking.status === "approved") {
    booking.status = "payment_done";
  }

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

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
    commercialHsnCode?: string;
    exportHsnCode?: string;
  },
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (data.chassisNumber !== undefined) {
    booking.chassisNumber = data.chassisNumber.trim();
  }
  if (data.engineNumber !== undefined) {
    booking.engineNumber = data.engineNumber.trim() || undefined;
  }
  if (data.deliveryDate !== undefined) {
    booking.deliveryDate = data.deliveryDate
      ? new Date(data.deliveryDate)
      : undefined;
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
    const yom = data.yom.trim();
    const currentYear = new Date().getFullYear();
    if (yom) {
      const yomNumber = Number(yom);
      if (
        !Number.isInteger(yomNumber) ||
        yomNumber < 1900 ||
        yomNumber > currentYear
      ) {
        throw new Error(
          `Year of Manufacture must be between 1900 and ${currentYear}`,
        );
      }
    }
    booking.yom = yom;
  }
  if (data.commercialHsnCode !== undefined) {
    booking.commercialHsnCode = data.commercialHsnCode.trim();
  }
  if (data.exportHsnCode !== undefined) {
    booking.exportHsnCode = data.exportHsnCode.trim();
    booking.hsnCode = data.exportHsnCode.trim();
  }

  // Auto-advance status if both are filled and status is payment_done
  if (
    booking.chassisNumber &&
    booking.engineNumber &&
    booking.engineNumber.trim() !== "" &&
    booking.status === "payment_done"
  ) {
    booking.status = "chassis_received";
  }

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
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

  if (status === "delivered" && !booking.assignedClientId) {
    throw new Error(
      "Please allot a client before marking this vehicle as delivered.",
    );
  }

  booking.status = status;
  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
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

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
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

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId)
    .populate("vehicleId")
    .populate("orderId");
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

  const saved = await booking.save();
  return await VehicleBooking.findById(saved._id)
    .populate("vehicleId")
    .populate("orderId");
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
      {
        "orderId.vehicleSnapshot.brandName": { $regex: search, $options: "i" },
      },
      {
        "orderId.vehicleSnapshot.modelName": { $regex: search, $options: "i" },
      },
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

  const hours =
    Number.isFinite(intervalHours) && intervalHours > 0 ? intervalHours : 2;
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