import mongoose from "mongoose";
import { Shipment } from "../models/Shipment.model";
import { VehicleBooking } from "../models/VehicleBooking.model";
import ProformaInvoice from "../models/ProformaInvoice.model";
import LetterOfCredit from "../models/LetterOfCredit.model";
import Invoice from "../models/Invoice.model";
import { Client } from "../models/Client.model";


const shipmentPopulate = [
  {
    path: "vehicleBookingIds",
    populate: [
      {
        path: "vehicleId",
        select: "brandName modelName variant color",
      },
      {
        path: "orderId",
        select: "orderNumber vehicleSnapshot",
      },
    ],
  },
];

const cleanString = (value: unknown) => String(value || "").trim();

const cleanDate = (value: unknown) => {
  const trimmed = cleanString(value);
  return trimmed ? new Date(trimmed) : undefined;
};

export const listShipments = async (query: any) => {
  const { search, page = 1, limit = 10 } = query;
  const match: any = {};

  if (search) {
    match.$or = [
      { customerName: { $regex: search, $options: "i" } },
      { destinationCountry: { $regex: search, $options: "i" } },
      { shippingLine: { $regex: search, $options: "i" } },
      { vesselName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Shipment.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Shipment.countDocuments(match),
  ]);

  return {
    data,
    total,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(total / Number(limit))),
  };
};

export const getCustomerNamesService = async () => {
  const clients = await Client.find({ isActive: true })
    .select({ name: 1 })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return clients
    .map((c: any) => ({ id: String(c._id), name: cleanString(c.name) }))
    .filter((c: any) => c.name);
};

export const createShipment = async (payload: any) => {
  const customerName = cleanString(payload.customerName);
  const destinationCountry = cleanString(payload.destinationCountry);

  if (!customerName) {
    throw new Error("Customer name is required");
  }

  if (!destinationCountry) {
    throw new Error("Destination country is required");
  }

  return Shipment.create({
    customerName,
    destinationCountry,
    portOfLoading: cleanString(payload.portOfLoading),
    portOfDischarge: cleanString(payload.portOfDischarge),
    shippingLine: cleanString(payload.shippingLine),
    vesselName: cleanString(payload.vesselName),
    sailingDate: cleanDate(payload.sailingDate),
    arrivalDate: cleanDate(payload.arrivalDate),
  });
};

export const updateShipment = async ({
  shipmentId,
  payload,
}: {
  shipmentId: string;
  payload: any;
}) => {
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new Error("Shipment not found");
  }

  const customerName = cleanString(payload.customerName);
  const destinationCountry = cleanString(payload.destinationCountry);

  if (!customerName) {
    throw new Error("Customer name is required");
  }

  if (!destinationCountry) {
    throw new Error("Destination country is required");
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  shipment.customerName = customerName;
  shipment.destinationCountry = destinationCountry;
  shipment.portOfLoading = cleanString(payload.portOfLoading);
  shipment.portOfDischarge = cleanString(payload.portOfDischarge);
  shipment.shippingLine = cleanString(payload.shippingLine);
  shipment.vesselName = cleanString(payload.vesselName);
  shipment.sailingDate = cleanDate(payload.sailingDate);
  shipment.arrivalDate = cleanDate(payload.arrivalDate);

  await shipment.save();
  return getShipmentById(shipmentId);
};


export const getShipmentById = async (shipmentId: string) => {
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new Error("Shipment not found");
  }

  const shipment = await Shipment.findById(shipmentId).populate(shipmentPopulate);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return shipment;
};

export const getAvailableShipmentVehicles = async () => {
  const assignedVehicleIds = await Shipment.distinct("vehicleBookingIds");

  return VehicleBooking.find({
    status: "shipped",
    _id: { $nin: assignedVehicleIds },
  })
    .populate("vehicleId", "brandName modelName variant color")
    .populate("orderId", "orderNumber vehicleSnapshot")
    .sort({ updatedAt: -1 });
};

export const addVehicleToShipment = async ({
  shipmentId,
  vehicleBookingId,
}: {
  shipmentId: string;
  vehicleBookingId: string;
}) => {
  if (
    !mongoose.isValidObjectId(shipmentId) ||
    !mongoose.isValidObjectId(vehicleBookingId)
  ) {
    throw new Error("Invalid shipment or vehicle");
  }

  const booking = await VehicleBooking.findById(vehicleBookingId);
  if (!booking) {
    throw new Error("Vehicle not found");
  }

  if (booking.status !== "shipped") {
    throw new Error("Only shipped vehicles can be added to a shipment");
  }

  const alreadyAssigned = await Shipment.exists({
    vehicleBookingIds: vehicleBookingId,
  });
  if (alreadyAssigned) {
    throw new Error("This vehicle is already added to another shipment");
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  shipment.vehicleBookingIds.push(new mongoose.Types.ObjectId(vehicleBookingId));
  await shipment.save();

  return getShipmentById(shipmentId);
};

export const removeVehicleFromShipment = async ({
  shipmentId,
  vehicleBookingId,
}: {
  shipmentId: string;
  vehicleBookingId: string;
}) => {
  if (
    !mongoose.isValidObjectId(shipmentId) ||
    !mongoose.isValidObjectId(vehicleBookingId)
  ) {
    throw new Error("Invalid shipment or vehicle");
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const vehicleIndex = shipment.vehicleBookingIds.findIndex(
    (id) => String(id) === vehicleBookingId,
  );
  if (vehicleIndex === -1) {
    throw new Error("Vehicle not found in shipment");
  }

  shipment.vehicleBookingIds.splice(vehicleIndex, 1);
  await shipment.save();
  return getShipmentById(shipmentId);
};

export const getShippedVehicleDetailsForShipment = async (shipmentId: string) => {
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new Error("Shipment not found");
  }

  const shipment = await Shipment.findById(shipmentId).populate(shipmentPopulate);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const bookingIds: string[] = [];
  for (const booking of shipment.vehicleBookingIds || []) {
    if (booking._id) {
      bookingIds.push(String(booking._id));
    }
  }

  if (bookingIds.length === 0) {
    return {
      shipment: {
        _id: shipment._id,
        customerName: shipment.customerName,
        destinationCountry: shipment.destinationCountry,
        sailingDate: shipment.sailingDate,
        arrivalDate: shipment.arrivalDate,
        shippingLine: shipment.shippingLine,
        vesselName: shipment.vesselName,
        portOfLoading: shipment.portOfLoading,
        portOfDischarge: shipment.portOfDischarge,
      },
      vehicles: [],
    };
  }

  const bookings = await VehicleBooking.find({ _id: { $in: bookingIds } })
    .populate("vehicleId", "brandName modelName variant color")
    .populate("orderId", "orderNumber vehicleSnapshot")
    .lean();

  const bookingMap = new Map<string, any>(
    bookings.map((b) => [String(b._id), b])
  );

  const chassisList = bookings
    .map((b) => b.chassisNumber?.trim())
    .filter(Boolean);

  const pis = await ProformaInvoice.find({
    $or: [
      { vehicleBookingIds: { $in: bookingIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { "vehicleDetails.chassisNo": { $in: chassisList } },
    ],
  })
    .populate("company_id", "name")
    .lean();

  const piIds = pis.map((pi) => pi._id);
  const lcs = await LetterOfCredit.find({ pi_id: { $in: piIds } })
    .sort({ uploadedAt: -1 })
    .lean();

  const piIdToLC = new Map<string, any>();
  for (const lc of lcs) {
    if (!piIdToLC.has(String(lc.pi_id))) {
      piIdToLC.set(String(lc.pi_id), lc);
    }
  }

  const invoiceLCs = await Invoice.find({
    piId: { $in: piIds },
    active: true,
    $or: [
      { "manualFields.lcNumber": { $exists: true, $nin: ["", null] } },
      { "manualFields.lcDate": { $exists: true, $nin: ["", null] } },
    ],
  })
    .sort({ generatedAt: -1 })
    .select("piId manualFields generatedAt")
    .lean();

  const piIdToInvoiceLC = new Map<string, any>();
  for (const invoice of invoiceLCs) {
    const piKey = String(invoice.piId);
    if (piIdToInvoiceLC.has(piKey)) continue;

    const lcNumber = cleanString(invoice.manualFields?.lcNumber);
    const lcDate = cleanString(invoice.manualFields?.lcDate);
    if (lcNumber || lcDate) {
      piIdToInvoiceLC.set(piKey, { lcNumber, lcDate });
    }
  }

  const queryConditions: any[] = [
    { vehicleBookingId: { $in: bookingIds.map(id => new mongoose.Types.ObjectId(id)) }, type: "COMMERCIAL", active: true },
    { vehicleId: { $in: bookingIds }, type: "COMMERCIAL", active: true }
  ];
  if (chassisList.length > 0) {
    queryConditions.push({
      "dataSnapshot.vehicle.chassisNo": { $in: chassisList },
      type: "COMMERCIAL",
      active: true
    });
    queryConditions.push({
      "manualFields.chassisNo": { $in: chassisList },
      type: "COMMERCIAL",
      active: true
    });
  }

  const commercialInvoices = await Invoice.find({
    active: true,
    $or: queryConditions,
  }).lean();

  const resolveDetails = (bookingId: string, chassisNo?: string) => {
    const cleanChassis = chassisNo?.trim().toLowerCase();

    const invoice = commercialInvoices.find((inv) => {
      if (inv.vehicleBookingId && String(inv.vehicleBookingId) === bookingId) return true;
      if (inv.vehicleId && String(inv.vehicleId) === bookingId) return true;
      if (cleanChassis) {
        const invChassis = (
          inv.dataSnapshot?.vehicle?.chassisNo ||
          inv.dataSnapshot?.vehicle?.chassisNumber ||
          inv.manualFields?.chassisNo ||
          inv.manualFields?.chassisNumber ||
          ""
        ).trim().toLowerCase();
        if (invChassis === cleanChassis) return true;
      }
      return false;
    });

    const pi = pis.find((p) => {
      if (p.vehicleBookingIds?.map(String).includes(bookingId)) return true;
      if (cleanChassis && p.vehicleDetails) {
        return p.vehicleDetails.some(
          (vd: any) => vd.chassisNo?.trim().toLowerCase() === cleanChassis
        );
      }
      return false;
    });

    const invoiceLC = pi ? piIdToInvoiceLC.get(String(pi._id)) : null;
    const lc = pi ? piIdToLC.get(String(pi._id)) : null;

    let amount = 0;
    if (invoice) {
      amount = invoice.computedFields?.totalUSD || invoice.computedFields?.totalINR || 0;
      if (!amount && invoice.dataSnapshot?.vehicle) {
        const v = invoice.dataSnapshot.vehicle;
        amount = (Number(v.fobUSD || v.fob) || 0) + (Number(v.freightUSD || v.freight) || 0);
      }
    } else if (pi && cleanChassis) {
      const piVehicle = pi.vehicleDetails.find(
        (vd: any) => vd.chassisNo?.trim().toLowerCase() === cleanChassis
      );
      if (piVehicle) {
        amount = (Number(piVehicle.fob) || 0) + (Number(piVehicle.freight) || 0);
      }
    }

    return {
      piNo: pi?.piNumber || "-",
      commercialInvoiceNo: invoice?.invoiceNumber || "-",
      amount: amount || 0,
      lcNo:
        invoiceLC?.lcNumber ||
        lc?.lcNumber ||
        lc?.extractedData?.lcNumber ||
        "-",
      lcDate: invoiceLC?.lcDate || (lc?.uploadedAt ? lc.uploadedAt : "-"),
    };
  };

  const vehicles = shipment.vehicleBookingIds.map((v: any, index: number) => {
    const bId = String(v._id || v);
    const booking = bookingMap.get(bId);
    const vehicleSnapshot = booking?.vehicleId || booking?.orderId?.vehicleSnapshot || {};
    const carName = [
      vehicleSnapshot.brandName,
      vehicleSnapshot.modelName,
      vehicleSnapshot.variant,
    ]
      .filter(Boolean)
      .join(" ") || `Vehicle ${index + 1}`;

    const chassis = booking?.chassisNumber || "";
    const extra = resolveDetails(bId, chassis);

    return {
      _id: bId,
      vehicleIndex: booking?.vehicleIndex ?? index,
      carName,
      chassisNo: chassis || "-",
      referenceNo: booking?.referenceNo || "-",
      ...extra,
    };
  });

  return {
    shipment: {
      _id: shipment._id,
      customerName: shipment.customerName,
      destinationCountry: shipment.destinationCountry,
      sailingDate: shipment.sailingDate,
      arrivalDate: shipment.arrivalDate,
      shippingLine: shipment.shippingLine,
      vesselName: shipment.vesselName,
      portOfLoading: shipment.portOfLoading,
      portOfDischarge: shipment.portOfDischarge,
    },
    vehicles,
  };
};