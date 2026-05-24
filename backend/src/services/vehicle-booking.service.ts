import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  VehicleBooking,
  VehicleBookingStatus,
} from "../models/VehicleBooking.model";
import { Client } from "../models/Client.model";
import { VehicleOrder } from "../models/VehicleOrder.model";
import Invoice from "../models/Invoice.model";

type InvoiceReadiness = {
  INR: boolean;
  USD: boolean;
  COMMERCIAL: boolean;
  PACKING_LIST: boolean;
  isComplete: boolean;
};

const emptyInvoiceReadiness = (): InvoiceReadiness => ({
  INR: false,
  USD: false,
  COMMERCIAL: false,
  PACKING_LIST: false,
  isComplete: false,
});

export const getInvoiceReadinessByBookingIds = async (
  bookingIds: string[],
) => {
  const uniqueBookingIds = [...new Set(bookingIds.filter(Boolean))];
  const readiness = uniqueBookingIds.reduce<Record<string, InvoiceReadiness>>(
    (acc, bookingId) => {
      acc[bookingId] = emptyInvoiceReadiness();
      return acc;
    },
    {},
  );

  if (uniqueBookingIds.length === 0) {
    return readiness;
  }

  // Retrieve chassis and engine numbers for these bookings to support matching by chassis/engine
  const bookings = await VehicleBooking.find({
    _id: { $in: uniqueBookingIds },
  })
    .select("_id chassisNumber engineNumber")
    .lean();

  const chassisToBookingId = new Map<string, string>();
  const engineToBookingId = new Map<string, string>();

  for (const b of bookings) {
    const chassis = b.chassisNumber?.trim().toUpperCase();
    const engine = b.engineNumber?.trim().toUpperCase();
    if (chassis) {
      chassisToBookingId.set(chassis, String(b._id));
    }
    if (engine) {
      engineToBookingId.set(engine, String(b._id));
    }
  }

  const chassisList = Array.from(chassisToBookingId.keys());
  const engineList = Array.from(engineToBookingId.keys());

  const queryConditions: any[] = [
    { vehicleBookingId: { $in: uniqueBookingIds } },
    { vehicleId: { $in: uniqueBookingIds } }
  ];

  if (chassisList.length > 0) {
    queryConditions.push({ "dataSnapshot.vehicle.chassisNo": { $in: chassisList } });
    queryConditions.push({ "manualFields.chassisNo": { $in: chassisList } });
    queryConditions.push({ "dataSnapshot.vehicles.chassisNo": { $in: chassisList } });
  }
  if (engineList.length > 0) {
    queryConditions.push({ "dataSnapshot.vehicle.engineNo": { $in: engineList } });
    queryConditions.push({ "manualFields.engineNo": { $in: engineList } });
    queryConditions.push({ "dataSnapshot.vehicles.engineNo": { $in: engineList } });
  }

  const invoices = await Invoice.find({
    active: true,
    $or: queryConditions,
  })
    .select("vehicleBookingId vehicleId type dataSnapshot manualFields")
    .lean();

  for (const invoice of invoices as any[]) {
    // Determine which booking IDs this invoice is associated with
    const associatedBookingIds = new Set<string>();

    if (invoice.vehicleBookingId && uniqueBookingIds.includes(String(invoice.vehicleBookingId))) {
      associatedBookingIds.add(String(invoice.vehicleBookingId));
    }
    if (invoice.vehicleId && uniqueBookingIds.includes(String(invoice.vehicleId))) {
      associatedBookingIds.add(String(invoice.vehicleId));
    }

    if (invoice.type === "PACKING_LIST") {
      const selectedVehicles = Array.isArray(invoice.dataSnapshot?.vehicles)
        ? invoice.dataSnapshot.vehicles
        : [];

      for (const vehicle of selectedVehicles) {
        const vChassis = (vehicle?.chassisNo || vehicle?.chassisNumber || "")?.trim().toUpperCase();
        const vEngine = (vehicle?.engineNo || vehicle?.engineNumber || "")?.trim().toUpperCase();
        
        const bookingIdFromChassis = vChassis ? chassisToBookingId.get(vChassis) : null;
        const bookingIdFromEngine = vEngine ? engineToBookingId.get(vEngine) : null;
        const bookingIdFromId = (vehicle?.vehicleBookingId || vehicle?.vehicleId) && 
          uniqueBookingIds.includes(String(vehicle.vehicleBookingId || vehicle.vehicleId))
          ? String(vehicle.vehicleBookingId || vehicle.vehicleId)
          : null;

        const targetBookingId = bookingIdFromChassis || bookingIdFromEngine || bookingIdFromId;
        if (targetBookingId) {
          associatedBookingIds.add(targetBookingId);
        }
      }
    } else {
      const chassis = (
        invoice.dataSnapshot?.vehicle?.chassisNo ||
        invoice.dataSnapshot?.vehicle?.chassisNumber ||
        invoice.manualFields?.chassisNo ||
        invoice.manualFields?.chassisNumber ||
        ""
      )?.trim().toUpperCase();

      const engine = (
        invoice.dataSnapshot?.vehicle?.engineNo ||
        invoice.dataSnapshot?.vehicle?.engineNumber ||
        invoice.manualFields?.engineNo ||
        invoice.manualFields?.engineNumber ||
        ""
      )?.trim().toUpperCase();

      const bookingIdFromChassis = chassis ? chassisToBookingId.get(chassis) : null;
      const bookingIdFromEngine = engine ? engineToBookingId.get(engine) : null;

      if (bookingIdFromChassis) {
        associatedBookingIds.add(bookingIdFromChassis);
      }
      if (bookingIdFromEngine) {
        associatedBookingIds.add(bookingIdFromEngine);
      }
    }

    // Apply the readiness to the matched booking IDs
    for (const bId of associatedBookingIds) {
      if (readiness[bId]) {
        if (invoice.type === "PACKING_LIST") {
          readiness[bId].PACKING_LIST = true;
        } else if (["INR", "USD", "COMMERCIAL"].includes(invoice.type)) {
          readiness[bId][invoice.type as "INR" | "USD" | "COMMERCIAL"] = true;
        }
      }
    }
  }

  for (const item of Object.values(readiness)) {
    item.isComplete =
      item.INR && item.USD && item.COMMERCIAL && item.PACKING_LIST;
  }

  return readiness;
};

const hasEngineAndChassis = (booking: any) =>
  !!String(booking.engineNumber || "").trim() &&
  !!String(booking.chassisNumber || "").trim();

export const attachShipmentReadiness = async <T extends any>(bookings: T[]) => {
  const plainBookings = bookings.map((booking: any) =>
    typeof booking.toObject === "function" ? booking.toObject() : booking,
  );
  const readinessByBookingId = await getInvoiceReadinessByBookingIds(
    plainBookings.map((booking: any) => String(booking._id)),
  );

  return plainBookings.map((booking: any) => {
    const invoiceReadiness =
      readinessByBookingId[String(booking._id)] || emptyInvoiceReadiness();
    return {
      ...booking,
      invoiceReadiness,
      canShip:
        booking.status === "chassis_received" &&
        hasEngineAndChassis(booking) &&
        invoiceReadiness.isComplete,
    };
  });
};

const getPopulatedBookingWithReadiness = async (bookingId: any) => {
  const populatedBooking = await VehicleBooking.findById(bookingId)
    .populate("vehicleId")
    .populate("orderId");
  const [bookingWithReadiness] = await attachShipmentReadiness(
    populatedBooking ? [populatedBooking] : [],
  );
  return bookingWithReadiness;
};

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

  const bookings = await VehicleBooking.find({ orderId })
    .populate("vehicleId")
    .populate("orderId")
    .sort({ vehicleIndex: 1 });
  return attachShipmentReadiness(bookings);
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

  const populatedBooking = await VehicleBooking.findById(booking._id)
    .populate("vehicleId")
    .populate("orderId");
  const [bookingWithReadiness] = await attachShipmentReadiness(
    populatedBooking ? [populatedBooking] : [],
  );
  return bookingWithReadiness;
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

  const populatedBooking = await VehicleBooking.findById(updatedBooking._id)
    .populate("vehicleId")
    .populate("orderId");
  const [bookingWithReadiness] = await attachShipmentReadiness(
    populatedBooking ? [populatedBooking] : [],
  );
  return bookingWithReadiness;
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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

  if (status === "shipped") {
    if (booking.status !== "chassis_received") {
      throw new Error("Vehicle can only be shipped after chassis/engine numbers are received.");
    }

    const readinessByBookingId = await getInvoiceReadinessByBookingIds([
      String(booking._id),
    ]);
    const readiness = readinessByBookingId[String(booking._id)];

    if (!readiness?.isComplete) {
      throw new Error(
        "Generate INR, USD, commercial invoice and packing list before shipping this vehicle.",
      );
    }
  }

  if (status === "delivered" && booking.status !== "shipped") {
    throw new Error("Vehicle must be shipped before marking it as delivered.");
  }

  booking.status = status;
  const saved = await booking.save();
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  return getPopulatedBookingWithReadiness(saved._id);
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId)
    .populate("vehicleId")
    .populate("orderId");
  if (!booking) throw new Error("Booking not found");
  const [bookingWithReadiness] = await attachShipmentReadiness([booking]);
  return bookingWithReadiness;
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
  return getPopulatedBookingWithReadiness(saved._id);
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
  const isPiPendingFilter = status === "piPending";

  if (status && status !== "All" && !isPiPendingFilter) {
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
      { "orderId.vehicleSnapshot.color": { $regex: search, $options: "i" } },
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
    {
      $lookup: {
        from: "proformainvoices",
        localField: "_id",
        foreignField: "vehicleBookingIds",
        as: "proformaInvoices",
      },
    },
    {
      $addFields: {
        piGenerated: { $gt: [{ $size: "$proformaInvoices" }, 0] },
        associatedPIs: {
          $map: {
            input: "$proformaInvoices",
            as: "pi",
            in: {
              _id: "$$pi._id",
              piNumber: "$$pi.piNumber",
              status: "$$pi.status",
            },
          },
        },
      },
    },
  ];

  if (isPiPendingFilter) {
    pipeline.push({
      $match: {
        piGenerated: false,
        engineNumber: { $exists: true, $nin: ["", null] },
        chassisNumber: { $exists: true, $nin: ["", null] },
      },
    });
  }

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
    { $project: { proformaInvoices: 0 } },
  );

  const data = await VehicleBooking.aggregate(pipeline);
  const dataWithReadiness = await attachShipmentReadiness(data);

  return {
    data: dataWithReadiness,
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
