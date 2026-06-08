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

export const getInvoiceReadinessByBookingIds = async (bookingIds: string[]) => {
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
    { vehicleId: { $in: uniqueBookingIds } },
  ];

  if (chassisList.length > 0) {
    queryConditions.push({
      "dataSnapshot.vehicle.chassisNo": { $in: chassisList },
    });
    queryConditions.push({ "manualFields.chassisNo": { $in: chassisList } });
    queryConditions.push({
      "dataSnapshot.vehicles.chassisNo": { $in: chassisList },
    });
  }
  if (engineList.length > 0) {
    queryConditions.push({
      "dataSnapshot.vehicle.engineNo": { $in: engineList },
    });
    queryConditions.push({ "manualFields.engineNo": { $in: engineList } });
    queryConditions.push({
      "dataSnapshot.vehicles.engineNo": { $in: engineList },
    });
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

    if (
      invoice.vehicleBookingId &&
      uniqueBookingIds.includes(String(invoice.vehicleBookingId))
    ) {
      associatedBookingIds.add(String(invoice.vehicleBookingId));
    }
    if (
      invoice.vehicleId &&
      uniqueBookingIds.includes(String(invoice.vehicleId))
    ) {
      associatedBookingIds.add(String(invoice.vehicleId));
    }

    if (invoice.type === "PACKING_LIST") {
      const selectedVehicles = Array.isArray(invoice.dataSnapshot?.vehicles)
        ? invoice.dataSnapshot.vehicles
        : [];

      for (const vehicle of selectedVehicles) {
        const vChassis = (vehicle?.chassisNo || vehicle?.chassisNumber || "")
          ?.trim()
          .toUpperCase();
        const vEngine = (vehicle?.engineNo || vehicle?.engineNumber || "")
          ?.trim()
          .toUpperCase();

        const bookingIdFromChassis = vChassis
          ? chassisToBookingId.get(vChassis)
          : null;
        const bookingIdFromEngine = vEngine
          ? engineToBookingId.get(vEngine)
          : null;
        const bookingIdFromId =
          (vehicle?.vehicleBookingId || vehicle?.vehicleId) &&
          uniqueBookingIds.includes(
            String(vehicle.vehicleBookingId || vehicle.vehicleId),
          )
            ? String(vehicle.vehicleBookingId || vehicle.vehicleId)
            : null;

        const targetBookingId =
          bookingIdFromChassis || bookingIdFromEngine || bookingIdFromId;
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
      )
        ?.trim()
        .toUpperCase();

      const engine = (
        invoice.dataSnapshot?.vehicle?.engineNo ||
        invoice.dataSnapshot?.vehicle?.engineNumber ||
        invoice.manualFields?.engineNo ||
        invoice.manualFields?.engineNumber ||
        ""
      )
        ?.trim()
        .toUpperCase();

      const bookingIdFromChassis = chassis
        ? chassisToBookingId.get(chassis)
        : null;
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

const hasReadyToShipInvoices = (readiness?: InvoiceReadiness) =>
  !!readiness?.INR && !!readiness?.USD && !!readiness?.COMMERCIAL;

const BOOKING_STATUS_ORDER: VehicleBookingStatus[] = [
  "pending",
  "quotation_details_pending",
  "quotation_uploaded",
  "approved",
  "payment_done",
  "chassis_received",
  "shipped",
  "delivered",
];

export const attachShipmentReadiness = async <T extends any>(bookings: T[]) => {
  const plainBookings = bookings.map((booking: any) =>
    typeof booking.toObject === "function" ? booking.toObject() : booking,
  );
  const bookingIds = plainBookings.map((booking: any) => String(booking._id));
  const bookingObjectIds = bookingIds.map(
    (id) => new mongoose.Types.ObjectId(id),
  );
  const readinessByBookingId =
    await getInvoiceReadinessByBookingIds(bookingIds);

  // Build chassis/engine maps for fallback matching
  const chassisToBookingId = new Map<string, string>();
  const engineToBookingId = new Map<string, string>();
  for (const b of plainBookings) {
    const chassis = (b.chassisNumber || "")?.trim().toUpperCase();
    const engine = (b.engineNumber || "")?.trim().toUpperCase();
    if (chassis) chassisToBookingId.set(chassis, String(b._id));
    if (engine) engineToBookingId.set(engine, String(b._id));
  }
  const chassisList = Array.from(chassisToBookingId.keys());
  const engineList = Array.from(engineToBookingId.keys());

  // Fetch associated PIs - match by vehicleBookingIds OR chassis/engine in vehicleDetails
  const ProformaInvoice = mongoose.model("ProformaInvoice");
  const piQueryConditions: any[] = [
    { vehicleBookingIds: { $in: bookingObjectIds } },
    { vehicleBookingIds: { $in: bookingIds } },
  ];
  if (chassisList.length > 0) {
    piQueryConditions.push({
      "vehicleDetails.chassisNo": { $in: chassisList },
    });
  }
  if (engineList.length > 0) {
    piQueryConditions.push({ "vehicleDetails.engineNo": { $in: engineList } });
  }

  const pis = await ProformaInvoice.find({
    $or: piQueryConditions,
  }).select(
    "_id piNumber status hblPath pdfPath vehicleBookingIds vehicleDetails",
  );

  const piMapByBookingId: Record<string, any[]> = {};
  const addPiForBooking = (bIdStr: string, pi: any) => {
    if (!bookingIds.includes(bIdStr)) return;
    if (!piMapByBookingId[bIdStr]) piMapByBookingId[bIdStr] = [];
    // Avoid duplicates
    if (
      piMapByBookingId[bIdStr].some(
        (p: any) => String(p._id) === String(pi._id),
      )
    )
      return;
    piMapByBookingId[bIdStr].push({
      _id: pi._id,
      piNumber: pi.piNumber,
      status: pi.status,
      hblPath: pi.hblPath,
      pdfPath: pi.pdfPath,
    });
  };

  for (const pi of pis) {
    // Match by vehicleBookingIds
    if (pi.vehicleBookingIds) {
      for (const vbId of pi.vehicleBookingIds) {
        addPiForBooking(String(vbId), pi);
      }
    }
    // Fallback: match by chassis/engine in vehicleDetails
    if (pi.vehicleDetails && Array.isArray(pi.vehicleDetails)) {
      for (const vd of pi.vehicleDetails) {
        const vdChassis = (vd.chassisNo || "")?.trim().toUpperCase();
        const vdEngine = (vd.engineNo || "")?.trim().toUpperCase();
        const matchedByChassis = vdChassis
          ? chassisToBookingId.get(vdChassis)
          : null;
        const matchedByEngine = vdEngine
          ? engineToBookingId.get(vdEngine)
          : null;
        if (matchedByChassis) addPiForBooking(matchedByChassis, pi);
        if (matchedByEngine) addPiForBooking(matchedByEngine, pi);
      }
    }
  }

  // Fetch associated commercial invoices - match by vehicleBookingId, vehicleId, OR chassis/engine
  const InvoiceModel = mongoose.model("Invoice");
  const invoiceQueryConditions: any[] = [
    { vehicleBookingId: { $in: bookingObjectIds } },
    { vehicleId: { $in: bookingIds } },
  ];
  if (chassisList.length > 0) {
    invoiceQueryConditions.push({
      "dataSnapshot.vehicle.chassisNo": { $in: chassisList },
    });
    invoiceQueryConditions.push({
      "manualFields.chassisNo": { $in: chassisList },
    });
  }
  if (engineList.length > 0) {
    invoiceQueryConditions.push({
      "dataSnapshot.vehicle.engineNo": { $in: engineList },
    });
    invoiceQueryConditions.push({
      "manualFields.engineNo": { $in: engineList },
    });
  }

  const invoices = await InvoiceModel.find({
    $or: invoiceQueryConditions,
    type: "COMMERCIAL",
    active: true,
  }).select(
    "_id invoiceNumber type vehicleBookingId vehicleId dataSnapshot.vehicle.chassisNo dataSnapshot.vehicle.engineNo manualFields.chassisNo manualFields.engineNo",
  );

  const invoiceMapByBookingId: Record<string, any[]> = {};
  const addInvoiceForBooking = (bIdStr: string, invoice: any) => {
    if (!bookingIds.includes(bIdStr)) return;
    if (!invoiceMapByBookingId[bIdStr]) invoiceMapByBookingId[bIdStr] = [];
    if (
      invoiceMapByBookingId[bIdStr].some(
        (inv: any) => String(inv._id) === String(invoice._id),
      )
    )
      return;
    invoiceMapByBookingId[bIdStr].push({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
    });
  };

  for (const invoice of invoices) {
    // Match by vehicleBookingId or vehicleId
    const directId = invoice.vehicleBookingId || invoice.vehicleId;
    if (directId && bookingIds.includes(String(directId))) {
      addInvoiceForBooking(String(directId), invoice);
    }
    // Fallback: match by chassis/engine
    const invChassis = (
      invoice.dataSnapshot?.vehicle?.chassisNo ||
      invoice.manualFields?.chassisNo ||
      ""
    )
      ?.trim()
      .toUpperCase();
    const invEngine = (
      invoice.dataSnapshot?.vehicle?.engineNo ||
      invoice.manualFields?.engineNo ||
      ""
    )
      ?.trim()
      .toUpperCase();
    const matchedByChassis = invChassis
      ? chassisToBookingId.get(invChassis)
      : null;
    const matchedByEngine = invEngine ? engineToBookingId.get(invEngine) : null;
    if (matchedByChassis) addInvoiceForBooking(matchedByChassis, invoice);
    if (matchedByEngine) addInvoiceForBooking(matchedByEngine, invoice);
  }

  return plainBookings.map((booking: any) => {
    const bookingIdStr = String(booking._id);
    const invoiceReadiness =
      readinessByBookingId[bookingIdStr] || emptyInvoiceReadiness();
    const associatedPIs = piMapByBookingId[bookingIdStr] || [];
    const commercialInvoices = invoiceMapByBookingId[bookingIdStr] || [];
    return {
      ...booking,
      invoiceReadiness,
      associatedPIs,
      commercialInvoices,
      piGenerated: associatedPIs.length > 0,
      canShip:
        booking.status === "chassis_received" &&
        hasEngineAndChassis(booking) &&
        hasReadyToShipInvoices(invoiceReadiness),
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
        engineCapacity: order.vehicleSnapshot?.engineCapacity || "",
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
      engineCapacity: order.vehicleSnapshot?.engineCapacity || "",
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
    throw new Error("Quotation can only be uploaded before approval starts");
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

  booking.bookingAmount =
    data.bookingAmount !== undefined
      ? toCleanNumber(data.bookingAmount)
      : booking.bookingAmount;

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
  paymentData: {
    amount: number;
    date?: string | Date;
    reference?: string;
    remarks?: string;
  },
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
    reference: paymentData.reference
      ? String(paymentData.reference).trim()
      : "",
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
    const trimmedChassis = data.chassisNumber.trim();

    // Only check for duplicates if a chassis number is actually provided
    if (trimmedChassis) {
      // Check if another booking already has this chassis number (case-insensitive to be safe)
      const existingBooking = await VehicleBooking.findOne({
        chassisNumber: { $regex: new RegExp(`^${trimmedChassis}$`, "i") },
        _id: { $ne: bookingId }, // Exclude the current booking from the check
      });

      if (existingBooking) {
        throw new Error(
          "This chassis number is already assigned to another vehicle.",
        );
      }
    }

    // Optionally normalize to uppercase to prevent case-sensitive duplicates
    booking.chassisNumber = trimmedChassis.toUpperCase() || undefined;
  }

  if (data.engineNumber !== undefined) {
    const trimmedEngine = data.engineNumber.trim();
    // Optionally normalize engine number as well
    booking.engineNumber = trimmedEngine.toUpperCase() || undefined;
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

// ... existing code ...

/**
 * Update status manually (e.g. mark as delivered)
 */

/**
 * Update status manually (e.g. mark as shipped, delivered)
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: VehicleBookingStatus,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!BOOKING_STATUS_ORDER.includes(status)) {
    throw new Error("Invalid booking status");
  }

  const currentIndex = BOOKING_STATUS_ORDER.indexOf(booking.status);
  const targetIndex = BOOKING_STATUS_ORDER.indexOf(status);
  const isForwardMove = targetIndex > currentIndex;

  if (isForwardMove && status === "shipped") {
    // Chassis is mandatory for shipping
    if (!String(booking.chassisNumber || "").trim()) {
      throw new Error("Chassis not received");
    }

    // PI is mandatory for shipping
    const ProformaInvoice = mongoose.model("ProformaInvoice");
    const piMatch: any[] = [
      { vehicleBookingIds: booking._id },
      { vehicleBookingIds: String(booking._id) },
    ];
    const chassis = String(booking.chassisNumber || "")
      .trim()
      .toUpperCase();
    const engine = String(booking.engineNumber || "")
      .trim()
      .toUpperCase();

    if (chassis) {
      piMatch.push({ "vehicleDetails.chassisNo": chassis });
    }
    if (engine) {
      piMatch.push({ "vehicleDetails.engineNo": engine });
    }

    const existingPI = await ProformaInvoice.findOne({
      $or: piMatch,
    }).select("_id");
    if (!existingPI) {
      throw new Error("PI must be created before shipping");
    }
  }

  if (isForwardMove && status === "delivered" && booking.status !== "shipped") {
    throw new Error("Not shipped yet");
  }

  if (status === "delivered") {
    const ProformaInvoice = mongoose.model("ProformaInvoice");
    const piMatch: any[] = [
      { vehicleBookingIds: booking._id },
      { vehicleBookingIds: String(booking._id) },
    ];
    const chassis = String(booking.chassisNumber || "")
      .trim()
      .toUpperCase();
    const engine = String(booking.engineNumber || "")
      .trim()
      .toUpperCase();

    if (chassis) {
      piMatch.push({ "vehicleDetails.chassisNo": chassis });
    }
    if (engine) {
      piMatch.push({ "vehicleDetails.engineNo": engine });
    }

    const existingPI = await ProformaInvoice.findOne({
      $or: piMatch,
    }).select("_id");
    if (!existingPI) {
      throw new Error("PI not created");
    }
  }

  if (status === "delivered" && !booking.assignedClientId) {
    throw new Error(
      "Please allot a client before marking this vehicle as delivered.",
    );
  }

  booking.status = status;
  const saved = await booking.save();
  return getPopulatedBookingWithReadiness(saved._id);
};

export const deleteVehicleBooking = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const lockedStatuses: VehicleBookingStatus[] = [
    "quotation_details_pending",
    "quotation_uploaded",
    "approved",
    "payment_done",
    "chassis_received",
    "shipped",
    "delivered",
  ];

  if (booking.quotationFile || lockedStatuses.includes(booking.status)) {
    throw new Error(
      "Cannot delete this entry after quotation is uploaded or approved.",
    );
  }

  await VehicleBooking.findByIdAndDelete(bookingId);
  return booking;
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
  if (files["hblDocument"])
    updateData["hblDocument"] = files["hblDocument"][0].path;
  if (files["shippingBill"])
    updateData["shippingBill"] = files["shippingBill"][0].path;

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

export const uploadClientCorrectionDocument = async (
  bookingId: string,
  file: Express.Multer.File,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.clientCorrections = booking.clientCorrections || [];
  booking.clientCorrections.push({
    filePath: file.path,
    originalName: file.originalname,
    uploadedAt: new Date(),
  });

  const saved = await booking.save();
  return getPopulatedBookingWithReadiness(saved._id);
};

export const getClientCorrectionFile = async (
  bookingId: string,
  correctionId: string,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const correction = (booking.clientCorrections as any).id(correctionId);
  if (!correction?.filePath) throw new Error("Correction file not found");

  return {
    filePath: correction.filePath,
    originalName: correction.originalName || "client-correction.pdf",
  };
};

/**
 * Get a document file path for a booking
 */
export const getBookingFile = async (bookingId: string, field: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (field === "quotation" || field === "quotationFile") {
    const filePath = booking.quotationFile;
    if (!filePath) throw new Error("File not found");
    return filePath;
  }

  const filePath = (booking.documents as any)[field];
  if (!filePath) throw new Error("File not found");

  return filePath;
};

/**
 * Get all vehicle bookings across all orders with filters & pagination
 */

/**
 * Get all vehicle bookings across all orders with filters & pagination
 */
export const getAllVehicleBookingsService = async (query: any) => {
  const {
    search,
    status,
    page = 1,
    limit = 10,
    vehicleId,
    vehicle,
    color,
    engineNumber,
    chassisNumber,
    dealer,
    client,
  } = query;

  const match: any = {};
  const isMakePIFilter = status === "makePI";
  const isApprovalFilter = status === "approvalPending";
  const isAwaitingNumbersFilter = status === "awaitingNumbers";

  if (
    status &&
    status !== "All" &&
    !isMakePIFilter &&
    !isApprovalFilter &&
    !isAwaitingNumbersFilter
  ) {
    match.status = status;
  }

  // ─── Expression Helpers ─────────────────────────────────────────
  const filledTextExpr = (field: string) => ({
    $gt: [
      {
        $strLenCP: {
          $trim: {
            input: { $ifNull: [`$${field}`, ""] },
          },
        },
      },
      0,
    ],
  });

  const missingEngineOrChassisExpr = {
    $or: [
      { $not: [filledTextExpr("engineNumber")] },
      { $not: [filledTextExpr("chassisNumber")] },
    ],
  };

  // Awaiting Numbers: post-booking or shipped, AND missing chassis or engine
  const awaitingNumbersExpr = {
    $and: [
      { $in: ["$status", ["payment_done", "chassis_received", "shipped"]] },
      missingEngineOrChassisExpr,
    ],
  };

  // Make PI: has chassis + no PI + status is payment_done or chassis_received
  const makePIExpr = {
    $and: [
      { $in: ["$status", ["payment_done", "chassis_received"]] },
      filledTextExpr("chassisNumber"),
      { $eq: ["$piGenerated", false] },
    ],
  };

  // ─── Search ─────────────────────────────────────────────────────
  const trimmedSearch = String(search || "").trim();

  if (trimmedSearch) {
    const normalizedSearch = trimmedSearch.toLowerCase();
    const matchingStatuses: VehicleBookingStatus[] = [];
    const searchRegex = { $regex: trimmedSearch, $options: "i" };

    if ("pending".includes(normalizedSearch)) {
      matchingStatuses.push("pending");
    }
    if (
      "waiting for approval".includes(normalizedSearch) ||
      "approval".includes(normalizedSearch)
    ) {
      matchingStatuses.push("quotation_details_pending", "quotation_uploaded");
    }
    if ("approved".includes(normalizedSearch)) {
      matchingStatuses.push("approved");
    }
    if (
      "awaiting engine chassis number".includes(normalizedSearch) ||
      "engine".includes(normalizedSearch) ||
      "chassis".includes(normalizedSearch)
    ) {
      matchingStatuses.push("payment_done");
    }
    if (
      "ready to ship".includes(normalizedSearch) ||
      "shipped in transit".includes(normalizedSearch) ||
      "in transit".includes(normalizedSearch) ||
      "ship".includes(normalizedSearch)
    ) {
      matchingStatuses.push("chassis_received", "shipped");
    }
    if ("delivered".includes(normalizedSearch)) {
      matchingStatuses.push("delivered");
    }

    match.$or = [
      {
        "orderId.vehicleSnapshot.brandName": searchRegex,
      },
      {
        "orderId.vehicleSnapshot.modelName": searchRegex,
      },
      { "orderId.vehicleSnapshot.variant": searchRegex },
      { "orderId.vehicleSnapshot.color": searchRegex },
      { "orderId.orderNumber": searchRegex },
      { engineNumber: searchRegex },
      { chassisNumber: searchRegex },
      { "assignedDealerSnapshot.name": searchRegex },
      { "assignedClientSnapshot.name": searchRegex },
      { "assignedClientSnapshot.companyName": searchRegex },
      { "assignedClientSnapshot.clientCode": searchRegex },
      { paymentReference: searchRegex },
      { status: searchRegex },
    ];

    if (matchingStatuses.length > 0) {
      match.$or.push({ status: { $in: [...new Set(matchingStatuses)] } });
    }
    if (
      "make pi".includes(normalizedSearch) ||
      "pi pending".includes(normalizedSearch)
    ) {
      match.$or.push({ $expr: makePIExpr });
    }
  }

  // ─── Extra Field Filters ────────────────────────────────────────
  const addRegexFilter = (field: string, value?: string) => {
    if (value && String(value).trim()) {
      match[field] = { $regex: String(value).trim(), $options: "i" };
    }
  };

  addRegexFilter("orderId.orderNumber", vehicleId);
  addRegexFilter("orderId.vehicleSnapshot.color", color);
  addRegexFilter("engineNumber", engineNumber);
  addRegexFilter("chassisNumber", chassisNumber);
  addRegexFilter("assignedDealerSnapshot.name", dealer);
  addRegexFilter("assignedClientSnapshot.name", client);

  if (vehicle && String(vehicle).trim()) {
    const value = String(vehicle).trim();
    match.$and = [
      ...(match.$and || []),
      {
        $or: [
          {
            "orderId.vehicleSnapshot.brandName": {
              $regex: value,
              $options: "i",
            },
          },
          {
            "orderId.vehicleSnapshot.modelName": {
              $regex: value,
              $options: "i",
            },
          },
          {
            "orderId.vehicleSnapshot.variant": {
              $regex: value,
              $options: "i",
            },
          },
        ],
      },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  // ─── Pipeline (shared base) ─────────────────────────────────────
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
    // ─── PI LOOKUP: match by vehicleBookingIds OR chassis/engine ───
    {
      $lookup: {
        from: "proformainvoices",
        let: {
          bookingId: "$_id",
          bookingChassis: {
            $trim: { input: { $ifNull: ["$chassisNumber", ""] } },
          },
          bookingEngine: {
            $trim: { input: { $ifNull: ["$engineNumber", ""] } },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // Match by vehicleBookingIds
                  {
                    $in: [
                      "$$bookingId",
                      { $ifNull: ["$vehicleBookingIds", []] },
                    ],
                  },
                  // Match by chassis in vehicleDetails
                  {
                    $and: [
                      {
                        $gt: [
                          {
                            $strLenCP: {
                              $ifNull: ["$$bookingChassis", ""],
                            },
                          },
                          0,
                        ],
                      },
                      {
                        $anyElementTrue: {
                          $map: {
                            input: { $ifNull: ["$vehicleDetails", []] },
                            as: "vd",
                            in: {
                              $eq: [
                                "$$bookingChassis",
                                {
                                  $trim: {
                                    input: {
                                      $ifNull: ["$$vd.chassisNo", ""],
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  // Match by engine in vehicleDetails
                  {
                    $and: [
                      {
                        $gt: [
                          {
                            $strLenCP: {
                              $ifNull: ["$$bookingEngine", ""],
                            },
                          },
                          0,
                        ],
                      },
                      {
                        $anyElementTrue: {
                          $map: {
                            input: { $ifNull: ["$vehicleDetails", []] },
                            as: "vd",
                            in: {
                              $eq: [
                                "$$bookingEngine",
                                {
                                  $trim: {
                                    input: {
                                      $ifNull: ["$$vd.engineNo", ""],
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          { $project: { _id: 1, piNumber: 1, status: 1 } },
        ],
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

  // ─── Stats Pipeline ─────────────────────────────────────────────
  const statsPipeline = [
    ...pipeline,
    {
      $group: {
        _id: null,
        pendingTotal: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        approvalTotal: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  ["quotation_details_pending", "quotation_uploaded"],
                ],
              },
              1,
              0,
            ],
          },
        },
        approvedTotal: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        awaitingNumbersTotal: {
          $sum: {
            $cond: [awaitingNumbersExpr, 1, 0],
          },
        },
        makePiTotal: {
          $sum: {
            $cond: [makePIExpr, 1, 0],
          },
        },
        shippedTotal: {
          $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] },
        },
        deliveredTotal: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        totalAll: { $sum: 1 },
      },
    },
  ];

  // ─── Special Filter Stages ──────────────────────────────────────
  if (isMakePIFilter) {
    pipeline.push({
      $match: { $expr: makePIExpr },
    });
  }

  if (isApprovalFilter) {
    pipeline.push({
      $match: {
        status: { $in: ["quotation_details_pending", "quotation_uploaded"] },
      },
    });
  }

  if (isAwaitingNumbersFilter) {
    pipeline.push({
      $match: { $expr: awaitingNumbersExpr },
    });
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // ─── Execute ────────────────────────────────────────────────────
  const countPipeline = [...pipeline, { $count: "total" }];
  const [countResult, statsResult] = await Promise.all([
    VehicleBooking.aggregate(countPipeline),
    VehicleBooking.aggregate(statsPipeline),
  ]);
  const total = countResult[0]?.total || 0;
  const stats = statsResult[0] || {};

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
    stats: {
      pendingTotal: stats.pendingTotal || 0,
      approvalTotal: stats.approvalTotal || 0,
      approvedTotal: stats.approvedTotal || 0,
      awaitingNumbersTotal: stats.awaitingNumbersTotal || 0,
      makePiTotal: stats.makePiTotal || 0,
      shippedTotal: stats.shippedTotal || 0,
      deliveredTotal: stats.deliveredTotal || 0,
      totalAll: stats.totalAll || 0,
    },
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
