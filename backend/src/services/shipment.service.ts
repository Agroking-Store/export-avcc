import mongoose from "mongoose";
import { Shipment } from "../models/Shipment.model";
import { VehicleBooking } from "../models/VehicleBooking.model";

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
