import { Client } from "../models/Client.model";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";
import { VehicleBooking } from "../models/VehicleBooking.model";
import { ROLES } from "../config/constants";
import {
  createUserAccountForProfile,
  getNextClientCode,
  normalizePhone,
} from "./profile-sync.service";
import { attachShipmentReadiness } from "./vehicle-booking.service";
import ProformaInvoice from "../models/ProformaInvoice.model";

const getLCStatsForClient = async (clientId: any) => {
  const pis = await ProformaInvoice.find({ client_id: clientId })
    .select("status")
    .lean();

  const totalPIs = pis.length;
  const lcReceived = pis.filter((pi) => pi.status === "lc_received").length;
  const lcPending = totalPIs - lcReceived;

  const pendingPiIds = pis
    .filter((pi) => pi.status !== "lc_received")
    .map((pi) => pi._id.toString());

  let lcPendingBookingIds: string[] = [];

  if (pendingPiIds.length > 0) {
    const matchedByAssociated = await VehicleBooking.find({
      assignedClientId: clientId,
      "associatedPIs._id": { $in: pendingPiIds },
    })
      .select("_id")
      .lean();

    lcPendingBookingIds = matchedByAssociated.map((b) => b._id.toString());

    if (lcPendingBookingIds.length === 0) {
      const pisWithBookings = await ProformaInvoice.find({
        _id: { $in: pendingPiIds },
        vehicleBookingIds: { $exists: true, $ne: [] },
      })
        .select("vehicleBookingIds")
        .lean();

      const bookingIds = pisWithBookings.flatMap((pi) =>
        (pi.vehicleBookingIds || []).map((id: any) => id.toString()),
      );

      if (bookingIds.length > 0) {
        const matchedByBookingId = await VehicleBooking.find({
          assignedClientId: clientId,
          _id: { $in: bookingIds },
        })
          .select("_id")
          .lean();

        lcPendingBookingIds = matchedByBookingId.map((b) => b._id.toString());
      }
    }
  }

  return { totalPIs, lcReceived, lcPending, lcPendingBookingIds };
};

export const createClientService = async (data: CreateClientDto) => {
  const email = data.email.toLowerCase().trim();
  const phone = normalizePhone(data.phone);
  const existing = await Client.findOne({
    $or: [{ phone }, { email }],
  });
  if (existing) {
    throw new Error("Client already exists with this phone or email");
  }

  await createUserAccountForProfile({
    name: data.name,
    email,
    password: data.password,
    phone,
    role: ROLES.CLIENT,
  });

  const clientCode = await getNextClientCode();
  const { password, ...clientData } = data;

  const client = new Client({
    ...clientData,
    phone,
    email,
    clientCode,
  });

  return await client.save();
};

export const getClientsService = async (query: any) => {
  const { search, page = 1, limit = 5 } = query;

  let match: any = {};

  if (search) {
    match.$or = [
      { name: { $regex: search, $options: "i" } },
      { clientCode: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { "address.cityTown": { $regex: search, $options: "i" } },
      { "address.state": { $regex: search, $options: "i" } },
      { "address.country": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const clients = await Client.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "vehiclebookings",
        localField: "_id",
        foreignField: "assignedClientId",
        as: "orders",
      },
    },
    {
      $addFields: {
        totalVehicleOrders: { $size: "$orders" },
        lastBooking: { $max: "$orders.createdAt" },
      },
    },
    { $project: { orders: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const total = await Client.countDocuments(match);

  return {
    data: clients,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

export const getClientByIdService = async (id: string) => {
  const client = await Client.findById(id);

  if (!client) {
    throw new Error("Client not found");
  }

  const vehicleOrders = await VehicleBooking.find({
    assignedClientId: id,
  })
    .populate("orderId")
    .populate("vehicleId")
    .sort({ createdAt: -1 });

  const ordersWithReadiness = await attachShipmentReadiness(vehicleOrders);

  const allBookingIds = await VehicleBooking.find({}, { _id: 1 })
    .sort({ createdAt: -1 })
    .lean();
  const totalBookings = allBookingIds.length;
  const bookingDisplayIdMap = new Map<string, string>();

  allBookingIds.forEach((booking, index) => {
    bookingDisplayIdMap.set(
      booking._id.toString(),
      `VEH-${String(totalBookings - index).padStart(3, "0")}`,
    );
  });

  const vehicleOrdersWithDisplayId = ordersWithReadiness.map((order: any) => {
    return {
      ...order,
      vehicleDisplayId:
        bookingDisplayIdMap.get(order._id.toString()) ||
        `VEH-${String(order.vehicleIndex || 0).padStart(3, "0")}`,
    };
  });

  const lcStats = await getLCStatsForClient(client._id);

  return {
    client,
    vehicleOrders: vehicleOrdersWithDisplayId,
    totalVehicleOrders: vehicleOrdersWithDisplayId.length,
    lastBooking:
      vehicleOrdersWithDisplayId.length > 0
        ? vehicleOrdersWithDisplayId[0].createdAt
        : null,
    lcStats,
  };
};

export const getClientByEmailService = async (email: string) => {
  const client = await Client.findOne({ email: email.toLowerCase().trim() });

  if (!client) {
    throw new Error("Client not found");
  }

  const vehicleOrders = await VehicleBooking.find({
    assignedClientId: client._id,
  })
    .populate("orderId")
    .populate("vehicleId")
    .sort({ createdAt: -1 });

  const ordersWithReadiness = await attachShipmentReadiness(vehicleOrders);

  const allBookingIds = await VehicleBooking.find({}, { _id: 1 })
    .sort({ createdAt: -1 })
    .lean();
  const totalBookings = allBookingIds.length;
  const bookingDisplayIdMap = new Map<string, string>();

  allBookingIds.forEach((booking, index) => {
    bookingDisplayIdMap.set(
      booking._id.toString(),
      `VEH-${String(totalBookings - index).padStart(3, "0")}`,
    );
  });

  const vehicleOrdersWithDisplayId = ordersWithReadiness.map((order: any) => {
    return {
      ...order,
      vehicleDisplayId:
        bookingDisplayIdMap.get(order._id.toString()) ||
        `VEH-${String(order.vehicleIndex || 0).padStart(3, "0")}`,
    };
  });

  const lcStats = await getLCStatsForClient(client._id);

  return {
    client,
    vehicleOrders: vehicleOrdersWithDisplayId,
    totalVehicleOrders: vehicleOrdersWithDisplayId.length,
    lastBooking:
      vehicleOrdersWithDisplayId.length > 0
        ? vehicleOrdersWithDisplayId[0].createdAt
        : null,
    lcStats,
  };
};

export const updateClientService = async (
  id: string,
  data: UpdateClientDto,
) => {
  const updated = await Client.findByIdAndUpdate(id, data, { new: true });
  return updated;
};

export const getLatestClientsService = async () => {
  try {
    const latestClients = await Client.find().sort({ createdAt: -1 }).limit(5);
    return latestClients;
  } catch (error) {
    throw new Error("Client not recived from backend");
  }
};
