import { Client } from "../models/Client.model";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";
import ProformaInvoice from "../models/ProformaInvoice.model";


// Create
export const createClientService = async (data: CreateClientDto) => {
  // Check duplicate
  const existing = await Client.findOne({ phone: data.phone });
  if (existing) {
    throw new Error("Client already exists with this phone");
  }

  // Count existing clients
  const count = await Client.countDocuments();

  // Generate client code
  const clientCode = `CL-${String(count + 1).padStart(3, "0")}`;

  const client = new Client({
    ...data,
    clientCode,
  });

  return await client.save();
};

// Get all
export const getClientsService = async (query: any) => {
  const { search, page = 1, limit = 5 } = query;

  let match: any = {};

  if (search) {
    match.$or = [
      { name: { $regex: search, $options: "i" } },
      { clientCode: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const clients = await Client.aggregate([
    { $match: match },

    {
      $lookup: {
        from: "proformainvoices", // Mongo collection name
        localField: "_id",
        foreignField: "client_id",
        as: "orders",
      },
    },

    {
      $addFields: {
        totalOrders: { $size: "$orders" },
        lastTransaction: { $max: "$orders.createdAt" },
      },
    },

    {
      $project: {
        orders: 0, // remove heavy data
      },
    },

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

// Get by ID
export const getClientByIdService = async (id: string) => {
  const client = await Client.findById(id);

  if (!client) {
    throw new Error("Client not found");
  }

  const orders = await ProformaInvoice.find({ client_id: id })
    .sort({ createdAt: -1 });

  return {
    client,
    orders,
    totalOrders: orders.length,
    lastTransaction:
      orders.length > 0 ? orders[0].createdAt : null,
  };
};

// Update
export const updateClientService = async (
  id: string,
  data: UpdateClientDto
) => {
  const updated = await Client.findByIdAndUpdate(id, data, {
    new: true,
  });

  return updated;
};

// Delete
export const deleteClientService = async (id: string) => {
  await Client.findByIdAndDelete(id);
};