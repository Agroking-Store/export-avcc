import ProformaInvoice from "../models/ProformaInvoice.model";
import { Order } from "../models/Order.model";
import { Types, PipelineStage } from "mongoose";

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convert(n % 100) : "")
      );
    if (n < 1000000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 1000000000)
      return (
        convert(Math.floor(n / 1000000)) +
        " Million" +
        (n % 1000000 !== 0 ? " " + convert(n % 1000000) : "")
      );
    return "";
  };
  const mainPart = convert(Math.floor(num));
  const cents = Math.round((num - Math.floor(num)) * 100);
  const centsPart = cents > 0 ? " and " + convert(cents) + " Cents" : "";
  return `USD ${mainPart}${centsPart} Only`;
};

// CREATE PI
export const createPIService = async (data: any) => {
  const count = await ProformaInvoice.countDocuments();
  const piNumber = data.piNumber || `PI-${String(count + 1).padStart(3, "0")}`;

  const totalAmount = data.vehicleDetails.reduce(
    (sum: number, v: any) =>
      sum + v.quantity * ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
    0
  );

  const amountInWords = numberToWords(totalAmount);

  const pi = new ProformaInvoice({
    ...data,
    piNumber,
    totalAmount,
    amountInWords,
  });

  return await pi.save();
};

// GET ORDERS WITH PI STATUS
export const getOrdersWithPIStatusService = async (query: any) => {
  const { search, page = 1, limit = 5, sortBy, sortOrder } = query;

  let match: any = {};

  if (search) {
    // Search can apply to orderId, voucherNo, client name, dealer name
    match.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { voucherNo: { $regex: search, $options: "i" } },
      { "client.name": { $regex: search, $options: "i" } },
      { "dealer.name": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit); // For data pipeline
  const limitNum = Number(limit);
  const sortDir = sortOrder === "desc" ? -1 : 1;

  const basePipeline: PipelineStage[] = [
    // Renamed 'pipeline' to 'basePipeline'
    // 1. Get all orders
    {
      $lookup: {
        from: "clients", // Ensure this matches your actual MongoDB collection name for clients
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "dealers", // Ensure this matches your actual MongoDB collection name for dealers
        localField: "dealerId",
        foreignField: "_id",
        as: "dealer",
      },
    },
    { $unwind: { path: "$dealer", preserveNullAndEmptyArrays: true } },
    // 2. Lookup ProformaInvoices for each order
    {
      $lookup: {
        from: "proformainvoices", // Ensure this matches your actual MongoDB collection name for proforma invoices
        localField: "_id", // Order's _id
        foreignField: "order_id", // New order_id field in ProformaInvoice
        as: "proformaInvoices",
      },
    },
    // 3. Add fields for PI status calculation
    {
      $addFields: {
        totalVehiclesInOrder: { $sum: "$vehicles.quantity" },
        totalVehiclesPIed: {
          $sum: "$proformaInvoices.vehicleDetails.quantity",
        },
        piStatuses: "$proformaInvoices.status", // Array of all PI statuses for this order
      },
    },
    { $addFields: { createdAt: "$createdAt", updatedAt: "$updatedAt" } }, // Explicitly add createdAt and updatedAt

    // 4. Calculate pending vehicles
    {
      $addFields: {
        pendingVehicles: {
          $subtract: ["$totalVehiclesInOrder", "$totalVehiclesPIed"],
        },
      },
    },
    // 5. Determine overall PI status for the order
    {
      $addFields: {
        overallPIStatus: {
          $cond: {
            if: { $eq: ["$totalVehiclesInOrder", 0] },
            then: "No Vehicles in Order",
            else: {
              $cond: {
                if: { $eq: ["$totalVehiclesPIed", 0] },
                then: "Not Started",
                else: {
                  $cond: {
                    if: {
                      $eq: ["$totalVehiclesInOrder", "$totalVehiclesPIed"],
                    },
                    then: "Fully PI'd",
                    else: "Partially PI'd",
                  },
                },
              },
            },
          },
        },
      },
    },
    // 6. Apply search filter
    { $match: match }, // Apply search filter here
  ];

  // Main pipeline for fetching data
  const dataPipeline: PipelineStage[] = [
    // Using basePipeline
    ...basePipeline, // Use the base pipeline defined above
    // 7. Sorting
    { $sort: { [sortBy || "createdAt"]: sortDir } },
    // 8. Pagination
    { $skip: skip },
    { $limit: limitNum },
  ];

  // Pipeline for total count (mirrors data pipeline up to $match, then counts)
  const countPipeline: PipelineStage[] = [
    // Using basePipeline
    ...basePipeline, // Use the base pipeline defined above
    { $count: "total" },
  ];

  const [orders, totalResult] = await Promise.all([
    Order.aggregate(dataPipeline),
    Order.aggregate(countPipeline),
  ]);
  const total = totalResult.length > 0 ? totalResult[0].total : 0;

  return {
    data: orders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limitNum),
  };
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
      (sum: number, v: any) =>
        // Ensure fob and freight are treated as numbers
        sum + v.quantity * ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
      0
    );

    data.amountInWords = numberToWords(data.totalAmount);
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

// GET ORDER DETAILS WITH VEHICLE PI STATUS
export const getOrderDetailsWithVehiclePIStatusService = async (
  orderId: string
) => {
  const orderObjectId = new Types.ObjectId(orderId);

  const pipeline: PipelineStage[] = [
    // 1. Match the specific order
    { $match: { _id: orderObjectId } },
    // 2. Lookup client and dealer details
    {
      $lookup: {
        from: "clients",
        localField: "clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "dealers",
        localField: "dealerId",
        foreignField: "_id",
        as: "dealer",
      },
    },
    { $unwind: { path: "$dealer", preserveNullAndEmptyArrays: true } },
    // 3. Lookup all ProformaInvoices associated with this order
    {
      $lookup: {
        from: "proformainvoices",
        localField: "_id",
        foreignField: "order_id",
        as: "proformaInvoices",
      },
    },
    // 4. Process each vehicle in the order to determine its PI status
    {
      $addFields: {
        vehicleTracking: {
          $map: {
            input: "$vehicles",
            as: "orderVehicle",
            in: {
              _id: "$$orderVehicle._id",
              make: "", // 'make' is not present in Order.vehicles, using empty string as placeholder
              model: "$$orderVehicle.vehicleName", // Map 'vehicleName' from order to 'model'
              chassisNumber: "$$orderVehicle.chassisNumber",
              engineNumber: "$$orderVehicle.engineNumber",
              quantity: "$$orderVehicle.quantity",
              piStatus: {
                $cond: {
                  if: {
                    $in: [
                      // Check if the order vehicle's chassis number exists in any PI's vehicle details
                      "$$orderVehicle.chassisNumber",
                      {
                        $reduce: {
                          // Flatten all chassis numbers from all PIs into a single array
                          input: "$proformaInvoices",
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: "$$this.vehicleDetails",
                                  as: "piVehicle",
                                  in: "$$piVehicle.chassisNumber",
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  then: "PI'd",
                  else: "Pending",
                },
              },
              associatedPIs: {
                $filter: {
                  // Filter PIs that contain the current order vehicle's chassis number
                  input: "$proformaInvoices",
                  as: "pi",
                  cond: {
                    $in: [
                      "$$orderVehicle.chassisNumber",
                      {
                        $map: {
                          input: "$$pi.vehicleDetails",
                          as: "piVehicle",
                          in: "$$piVehicle.chassisNumber",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        totalVehiclesInOrder: { $sum: "$vehicles.quantity" },
        totalVehiclesPIed: {
          $sum: {
            // Sum the quantities of all vehicles across all PIs for this order
            $map: {
              input: "$proformaInvoices",
              as: "pi",
              in: {
                $sum: {
                  $map: {
                    input: "$$pi.vehicleDetails",
                    as: "piVehicle",
                    in: "$$piVehicle.quantity",
                  },
                },
              },
            },
          },
        },
      },
    },
    // 5. Calculate pending vehicles and overall PI status (similar to getOrdersWithPIStatusService)
    {
      $addFields: {
        pendingVehicles: {
          $subtract: ["$totalVehiclesInOrder", "$totalVehiclesPIed"],
        },
        overallPIStatus: {
          $cond: {
            if: { $eq: ["$totalVehiclesInOrder", 0] },
            then: "No Vehicles in Order",
            else: {
              $cond: {
                if: { $eq: ["$totalVehiclesPIed", 0] },
                then: "Not Started",
                else: {
                  $cond: {
                    if: {
                      $eq: ["$totalVehiclesInOrder", "$totalVehiclesPIed"],
                    },
                    then: "Fully PI'd",
                    else: "Partially PI'd",
                  },
                },
              },
            },
          },
        },
      },
    },
    // 6. Project the final output
    {
      $project: {
        _id: 1,
        orderId: 1,
        voucherNo: 1,
        createdAt: 1,
        client: { name: "$client.name", clientCode: "$client.clientCode" },
        dealer: { name: "$dealer.name" },
        totalVehiclesInOrder: 1,
        totalVehiclesPIed: 1,
        pendingVehicles: 1,
        overallPIStatus: 1,
        vehicleTracking: {
          $map: {
            input: "$vehicleTracking",
            as: "vt",
            in: {
              _id: "$$vt._id",
              make: "$$vt.make",
              model: "$$vt.model",
              chassisNumber: "$$vt.chassisNumber",
              engineNumber: "$$vt.engineNumber",
              quantity: "$$vt.quantity",
              piStatus: "$$vt.piStatus",
              associatedPIs: {
                $map: {
                  input: "$$vt.associatedPIs",
                  as: "api",
                  in: {
                    piId: "$$api._id",
                    piNumber: "$$api.piNumber",
                    createdAt: "$$api.createdAt",
                  },
                },
              },
            },
          },
        },
      },
    },
  ];

  const [order] = await Order.aggregate(pipeline);

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};
