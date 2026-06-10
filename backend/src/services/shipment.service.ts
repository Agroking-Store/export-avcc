import mongoose from "mongoose";
import { Shipment } from "../models/Shipment.model";
import { VehicleBooking } from "../models/VehicleBooking.model";
import ProformaInvoice from "../models/ProformaInvoice.model";
import LetterOfCredit from "../models/LetterOfCredit.model";
import Invoice from "../models/Invoice.model";
import { Client } from "../models/Client.model";


const shipmentPopulate = [
  {
    path: "containers.vehicleBookingIds",
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
  // Small, lightweight list for dropdown
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

export const addContainerToShipment = async (
  shipmentId: string,
  containerNumber: string,
) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const cleanedContainerNumber = cleanString(containerNumber);
  if (!cleanedContainerNumber) {
    throw new Error("Container name is required");
  }

  shipment.containers.push({
    _id: new mongoose.Types.ObjectId(),
    containerNumber: cleanedContainerNumber,
    vehicleBookingIds: [],
  });

  await shipment.save();
  return getShipmentById(shipmentId);
};

export const getAvailableShipmentVehicles = async () => {
  const assignedVehicleIds = await Shipment.distinct(
    "containers.vehicleBookingIds",
  );

  return VehicleBooking.find({
    status: "shipped",
    _id: { $nin: assignedVehicleIds },
  })
    .populate("vehicleId", "brandName modelName variant color")
    .populate("orderId", "orderNumber vehicleSnapshot")
    .sort({ updatedAt: -1 });
};

export const addVehicleToContainer = async ({
  shipmentId,
  containerId,
  vehicleBookingId,
}: {
  shipmentId: string;
  containerId: string;
  vehicleBookingId: string;
}) => {
  if (
    !mongoose.isValidObjectId(shipmentId) ||
    !mongoose.isValidObjectId(containerId) ||
    !mongoose.isValidObjectId(vehicleBookingId)
  ) {
    throw new Error("Invalid shipment, container or vehicle");
  }

  const booking = await VehicleBooking.findById(vehicleBookingId);
  if (!booking) {
    throw new Error("Vehicle not found");
  }

  if (booking.status !== "shipped") {
    throw new Error("Only shipped vehicles can be added to a container");
  }

  const alreadyAssigned = await Shipment.exists({
    "containers.vehicleBookingIds": vehicleBookingId,
  });
  if (alreadyAssigned) {
    throw new Error("This vehicle is already added to another container");
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const container = (shipment.containers as any).id(containerId);
  if (!container) {
    throw new Error("Container not found");
  }

  container.vehicleBookingIds.push(new mongoose.Types.ObjectId(vehicleBookingId));
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

  // Collect all vehicle booking IDs in this shipment
  const bookingIds: string[] = [];
  for (const container of shipment.containers || []) {
    for (const booking of container.vehicleBookingIds || []) {
      if (booking._id) {
        bookingIds.push(String(booking._id));
      }
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
      containers: [],
    };
  }

  // Fetch the booking details
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

  // Fetch Proforma Invoices that mention these bookings or chassis numbers
  const pis = await ProformaInvoice.find({
    $or: [
      { vehicleBookingIds: { $in: bookingIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { "vehicleDetails.chassisNo": { $in: chassisList } },
    ],
  })
    .populate("company_id", "name")
    .lean();

  // Fetch Letters of Credit for these PIs
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

  // Fetch Commercial Invoices for these bookings or chassis numbers
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

  // Map to group invoices and PIs by booking ID / chassis number
  const resolveDetails = (bookingId: string, chassisNo?: string) => {
    const cleanChassis = chassisNo?.trim().toLowerCase();
    
    // Find matching Commercial Invoice
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

    // Find matching PI
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
      // Fallback: check manualFields or totalAmount
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

  const populatedContainers = shipment.containers.map((container: any) => {
    const vehicles = container.vehicleBookingIds.map((v: any, index: number) => {
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
        ...extra,
      };
    });

    return {
      _id: container._id,
      containerNumber: container.containerNumber,
      vehicles,
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
    containers: populatedContainers,
  };
};
