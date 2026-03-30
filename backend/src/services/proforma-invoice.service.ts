import ProformaInvoice from "../models/ProformaInvoice.model";
import { Types, PipelineStage } from "mongoose";

// CREATE PI
export const createPIService = async (data: any) => {
  const count = await ProformaInvoice.countDocuments();
  const piNumber = `PI-${String(count + 1).padStart(3, "0")}`;

  const totalAmount = data.vehicleDetails.reduce(
    (sum: number, v: any) => sum + v.quantity * v.unitPrice,
    0
  );

  const pi = new ProformaInvoice({
    ...data,
    piNumber,
    totalAmount,
  });

  return await pi.save();
};

// GET ALL PIs
export const getPIsService = async (query: any) => {
  const { search, page = 1, limit = 5, sortBy, sortOrder, status } = query;

  let match: any = {};

  if (status && status !== "all") {
    match.status = status;
  }

  if (search) {
    match.$or = [
      { piNumber: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const limitNum = Number(limit);
  const sortDir: 1 | -1 = sortOrder === "desc" ? -1 : 1;

  // If sorting by client name, we MUST use aggregation to join the clients collection
  if (sortBy === "client") {
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "clients", // <-- Ensure this matches your actual MongoDB collection name for clients
          localField: "client_id",
          foreignField: "_id",
          as: "clientData",
        },
      },
      { $unwind: { path: "$clientData", preserveNullAndEmptyArrays: true } },
      { $sort: { "clientData.name": sortDir } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          piNumber: 1,
          totalAmount: 1,
          status: 1,
          validityDate: 1,
          createdAt: 1,
          updatedAt: 1,
          client_id: {
            name: "$clientData.name",
            clientCode: "$clientData.clientCode",
          },
        },
      },
    ];

    const pis = await ProformaInvoice.aggregate(pipeline);
    const total = await ProformaInvoice.countDocuments(match);

    return {
      data: pis,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Default Mongoose Find for standard fields (piNumber, status, totalAmount, etc.)
  let sortOption: any = { createdAt: -1 };
  if (sortBy) {
    sortOption = { [sortBy]: sortDir };
  }

  const pis = await ProformaInvoice.find(match)
    .populate("client_id", "name clientCode") // 🔥 show client info
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const total = await ProformaInvoice.countDocuments(match);

  return {
    data: pis,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// GET PI BY ID
export const getPIByIdService = async (id: string) => {
  const pi = await ProformaInvoice.findById(id)
    .populate(
      "client_id",
      "name clientCode email phone country address companyName"
    )
    .populate("dealer_id", "name contact email address gstNumber");

  if (!pi) {
    throw new Error("PI not found");
  }

  return pi;
};

// UPDATE PI
export const updatePIService = async (id: string, data: any) => {
  if (data.vehicleDetails) {
    data.totalAmount = data.vehicleDetails.reduce(
      (sum: number, v: any) => sum + v.quantity * v.unitPrice,
      0
    );
  }

  const updated = await ProformaInvoice.findByIdAndUpdate(id, data, {
    new: true,
  });

  return updated;
};

// UPDATE STATUS
export const updatePIStatusService = async (id: string, status: string) => {
  const validStatuses = [
    "draft",
    "pending_approval",
    "approved",
    "sent_to_buyer",
    "lc_received",
    "expired",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const updated = await ProformaInvoice.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  return updated;
};

export const deletePIService = async (id: string) => {
  const deleted = await ProformaInvoice.findByIdAndDelete(id);

  if (!deleted) {
    throw new Error("PI not found");
  }

  return deleted;
};
