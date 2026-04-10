import ProformaInvoice from "../models/ProformaInvoice.model";
import { Order } from "../models/Order.model";
import { Types, PipelineStage } from "mongoose";
import { Company } from "../models/Company.model"; // Import Company model
import { IBookingVehicle, IBooking } from "../models/Booking.model"; // Import Booking model interfaces
import { Booking } from "../models/Booking.model"; // Import Booking model

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

// Helper to generate the next PI number based on company/year/sequential
const generateNextPiNumber = async (companyId: string): Promise<string> => {
  if (!companyId) {
    throw new Error("Company (Exporter) is required to generate PI number.");
  }
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error("Company (Exporter) not found.");
  }

  const companyShortCode = getCompanyShortCode(company.name);
  const financialYear = getFinancialYear(new Date()); // Use current date for PI generation

  const piNumberPrefix = `${companyShortCode}/${financialYear}/`;

  const lastPI = await ProformaInvoice.findOne({
    company_id: companyId, // Filter by specific company
    piNumber: { $regex: `^${piNumberPrefix}\\d+$` }, // Match PI numbers starting with the prefix and ending with digits
  }).sort({ piNumber: -1 }); // Sort by piNumber descending to get the highest sequential number

  let nextSequentialNumber = 1;
  if (lastPI && lastPI.piNumber) {
    const lastPart = lastPI.piNumber.split("/").pop(); // Get the last part (e.g., "10")
    if (lastPart && !isNaN(Number(lastPart))) {
      nextSequentialNumber = Number(lastPart) + 1;
    }
  }

  return `${piNumberPrefix}${String(nextSequentialNumber).padStart(2, "0")}`; // Pad with leading zero if needed, e.g., 01, 02, ..., 10
};

// New service to get the suggested next PI number
export const getSuggestedNextPiNumberService = async (companyId: string) => {
  return await generateNextPiNumber(companyId);
};

// Helper to get financial year from a date
const getFinancialYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 for Jan, 11 for Dec)

  if (month >= 3) {
    // April (3) to December (11)
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    // January (0) to March (2)
    return `${year - 1}-${String(year).slice(2)}`;
  }
};

// Helper to derive company short code
const getCompanyShortCode = (companyName: string): string => {
  if (!companyName) return "XX";
  const words = companyName.split(" ");
  if (words.length > 0 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return companyName.substring(0, 2).toUpperCase(); // Fallback for single-word names less than 2 chars
};

// CREATE PI
export const createPIService = async (data: any) => {
  const totalAmount = data.vehicleDetails.reduce(
    (sum: number, v: any) =>
      sum + v.quantity * ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
    0
  );
  const amountInWords = numberToWords(totalAmount);

  let finalPiNumber = data.piNumber; // Use provided piNumber if available

  if (!finalPiNumber || finalPiNumber.trim() === "") {
    // If piNumber is not provided or empty, generate it
    finalPiNumber = await generateNextPiNumber(data.company_id);
  } else {
    // If a piNumber is provided, check for uniqueness if it's not an update operation
    // This check is important to prevent duplicate PI numbers if the user manually enters one.
    const existingPi = await ProformaInvoice.findOne({
      piNumber: finalPiNumber,
    });
    if (existingPi && existingPi._id.toString() !== data._id?.toString()) {
      // Allow update of same PI with same number
      throw new Error(
        `Proforma Invoice with number ${finalPiNumber} already exists.`
      );
    }
  }

  const pi = new ProformaInvoice({
    ...data,
    piNumber: finalPiNumber, // Use the final PI number
    totalAmount,
    amountInWords,
  });

  return await pi.save();
};

// Helper types for the service function's return value, mirroring frontend's VehicleTracking and AssociatedPI
interface AssociatedPI {
  piId: string;
  piNumber: string;
  createdAt: string;
}

interface VehicleTracking {
  _id: string;
  make: string;
  model: string;
  chassisNo: string;
  engineNo: string;
  color: string;
  hsn: string;
  yom: string;
  fuelType: string;
  countryOfOrigin: string;
  engineCapacity: string;
  fob: number;
  freight: number;
  quantity: number;
  bookingStatus: "Booked" | "Draft";
  piStatus: "PI'd" | "Pending";
  associatedPIs: AssociatedPI[];
}

// New service to get detailed order tracking with PI and Booking status
export const getOrderDetailWithTrackingService = async (orderId: string) => {
  const order = await Order.findById(orderId).populate(
    "clientId",
    "name clientCode"
  );

  if (!order) {
    throw new Error("Order not found");
  }

  // Fetch all relevant bookings for this order
  // We need to find bookings that contain vehicles linked to this order
  const bookings = await Booking.find({
    orderId: new Types.ObjectId(orderId),
    status: "Booked",
  });

  // Fetch all relevant Proforma Invoices for this order
  const proformaInvoices = await ProformaInvoice.find({
    order_id: new Types.ObjectId(orderId),
  });

  const vehicleTracking: VehicleTracking[] = [];
  let totalVehiclesInOrder = 0;
  let totalVehiclesPIed = 0;
  let globalIndex = 0;

  for (const vehicleItem of order.vehicles) {
    const qty = vehicleItem.quantity || 1;
    totalVehiclesInOrder += qty;

    for (let qIdx = 0; qIdx < qty; qIdx++) {
      const currentSrNo = String(globalIndex + 1);
      globalIndex++;

      // 1. Find the individual booking for this specific unit using srNo
      let foundBookingVehicle = null;
      for (const b of bookings) {
        const bv = b.vehicles.find((v) => String(v.srNo) === currentSrNo);
        if (bv) {
          foundBookingVehicle = bv;
          break;
        }
      }

      const unitChassis = foundBookingVehicle?.chassisNo || "N/A";
      const unitEngine = foundBookingVehicle?.engineNo || "N/A";
      const bookingStatus = foundBookingVehicle ? "Booked" : "Draft";

      // 2. Determine PI Status using the Chassis Number from the Booking
      let piStatus: "PI'd" | "Pending" = "Pending";
      const associatedPIs: AssociatedPI[] = [];

      if (unitChassis !== "N/A") {
        for (const pi of proformaInvoices) {
          const piVehicle = pi.vehicleDetails.find(
            (vd) => vd.chassisNo === unitChassis
          );
          if (piVehicle) {
            piStatus = "PI'd";
            totalVehiclesPIed += 1;
            associatedPIs.push({
              piId: pi._id.toString(),
              piNumber: pi.piNumber,
              createdAt: pi.createdAt.toISOString(),
            });
          }
        }
      }

      vehicleTracking.push({
        _id: new Types.ObjectId().toString(),
        make:
          (vehicleItem as any).make ||
          vehicleItem.vehicleName ||
          vehicleItem.name ||
          "N/A",
        model: vehicleItem.vehicleName || vehicleItem.name || "N/A",
        chassisNo: unitChassis,
        engineNo: unitEngine,
        color: foundBookingVehicle?.color || vehicleItem.color || "N/A",
        hsn:
          foundBookingVehicle?.hsnCode || (vehicleItem as any).hsnCode || "N/A",
        yom: foundBookingVehicle?.yom
          ? String(foundBookingVehicle.yom)
          : (vehicleItem as any).yom || "N/A",
        fuelType:
          foundBookingVehicle?.fuelType ||
          (vehicleItem as any).fuelType ||
          "N/A",
        countryOfOrigin:
          foundBookingVehicle?.countryOfOrigin ||
          (vehicleItem as any).countryOfOrigin ||
          "N/A",
        engineCapacity:
          foundBookingVehicle?.engineCapacity ||
          (vehicleItem as any).engineCapacity ||
          "N/A",
        fob:
          foundBookingVehicle?.fobAmount || (vehicleItem as any).fobAmount || 0,
        freight:
          foundBookingVehicle?.freight || (vehicleItem as any).freight || 0,
        quantity: 1, // Individual unit
        bookingStatus,
        piStatus,
        associatedPIs,
      });
    }
  }

  const pendingVehicles = totalVehiclesInOrder - totalVehiclesPIed;
  let overallPIStatus: string;
  if (totalVehiclesInOrder === 0) {
    overallPIStatus = "No Vehicles in Order";
  } else if (totalVehiclesPIed === 0) {
    overallPIStatus = "Not Started";
  } else if (totalVehiclesPIed === totalVehiclesInOrder) {
    overallPIStatus = "Fully PI'd";
  } else {
    overallPIStatus = "Partially PI'd";
  }

  return {
    _id: order._id.toString(),
    orderId: order.orderId,
    voucherNo: order.voucherNo,
    client: {
      _id: (order.clientId as any)?._id?.toString() || "N/A", // Add client _id
      name: (order.clientId as any)?.name || "N/A",
      clientCode: (order.clientId as any)?.clientCode || "N/A",
    },
    dealer: {
      name: (order as any).dealerId?.name || "N/A",
    },
    createdAt: order.createdAt.toISOString(),
    totalVehiclesInOrder,
    totalVehiclesPIed,
    pendingVehicles,
    overallPIStatus,
    vehicleTracking,
  };
};

// Helper to get date ranges for filtering
const getDateRange = (timeRange: string) => {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let prevStartDate: Date | undefined;
  let prevEndDate: Date | undefined;

  switch (timeRange) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // End of today
      prevStartDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );
      prevEndDate = startDate;
      break;
    case "thisWeek":
      const dayOfWeek = now.getDay(); // Sunday is 0, Saturday is 6
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - dayOfWeek
      ); // Start of Sunday
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (6 - dayOfWeek) + 1
      ); // End of Saturday
      prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = startDate;
      break;
    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Start of next month
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = startDate;
      break;
    case "thisYear":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1); // Start of next year
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = startDate;
      break;
    case "allTime":
    default:
      return {
        createdAtMatch: {},
        validityDateMatch: {},
        prevCreatedAtMatch: {},
        prevValidityDateMatch: {},
      };
  }

  return {
    createdAtMatch: { createdAt: { $gte: startDate, $lt: endDate } },
    validityDateMatch: { validityDate: { $gte: startDate, $lt: endDate } },
    prevCreatedAtMatch: {
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    },
    prevValidityDateMatch: {
      validityDate: { $gte: prevStartDate, $lt: prevEndDate },
    },
  };
};
const calculateTrend = (currentValue: number, previousValue: number) => {
  if (previousValue === 0) return currentValue > 0 ? 1 : 0; // If previous was 0, any positive current is 100% growth
  return (currentValue - previousValue) / previousValue;
};

// GET DASHBOARD KPIS
export const getDashboardKPIsService = async (timeRange: string) => {
  const {
    createdAtMatch,
    prevCreatedAtMatch,
    validityDateMatch,
    prevValidityDateMatch,
  } = getDateRange(timeRange); // Destructure here

  const activePipelineValueResult = await ProformaInvoice.aggregate([
    {
      $match: {
        ...createdAtMatch,
        status: { $in: ["pending_approval", "approved", "sent_to_buyer"] },
      },
    },
    { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
  ]);
  const activePipelineValue =
    activePipelineValueResult.length > 0
      ? activePipelineValueResult[0].totalAmount
      : 0;

  const prevActivePipelineValueResult = await ProformaInvoice.aggregate([
    {
      $match: {
        ...prevCreatedAtMatch,
        status: { $in: ["pending_approval", "approved", "sent_to_buyer"] },
      },
    },
    { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
  ]);
  const prevActivePipelineValue =
    prevActivePipelineValueResult.length > 0 // Corrected: Use prevActivePipelineValueResult
      ? activePipelineValueResult[0].totalAmount
      : 0;

  // KPI 2: Pending PI Approvals
  const pendingApprovalsResult = await ProformaInvoice.aggregate([
    { $match: { ...createdAtMatch, status: "pending_approval" } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const pendingApprovals =
    pendingApprovalsResult.length > 0 ? pendingApprovalsResult[0].count : 0;

  const prevPendingApprovalsResult = await ProformaInvoice.aggregate([
    { $match: { ...prevCreatedAtMatch, status: "pending_approval" } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const prevPendingApprovals =
    pendingApprovalsResult.length > 0 ? pendingApprovalsResult[0].count : 0;

  // KPI 3: Expiring PIs (Next 7 Days) - This is a fixed window, not dependent on the timeRange selector for 'createdAt'
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringPIsResult = await ProformaInvoice.aggregate([
    {
      $match: {
        validityDate: { $gte: now, $lte: sevenDaysFromNow },
        status: { $nin: ["expired", "lc_received"] },
      },
    },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const expiringPIs =
    expiringPIsResult.length > 0 ? expiringPIsResult[0].count : 0;

  const prevExpiringPIsResult = await ProformaInvoice.aggregate([
    {
      $match: {
        validityDate: {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lte: now,
        }, // Previous 7 days
        status: { $nin: ["expired", "lc_received"] },
      },
    },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const prevExpiringPIs =
    prevExpiringPIsResult.length > 0 ? prevExpiringPIsResult[0].count : 0; // Corrected: Use prevExpiringPIsResult

  // KPI 4: Overall Order PI Completion
  // This requires aggregating from the Order model, then looking up PIs
  const overallOrderPICompletionResult = await Order.aggregate([
    {
      $match: {
        ...createdAtMatch, // Filter orders by creation date
      },
    },
    {
      $lookup: {
        from: "proformainvoices", // Ensure this matches your actual MongoDB collection name for proforma invoices
        localField: "_id", // Order's _id
        foreignField: "order_id", // New order_id field in ProformaInvoice
        as: "proformaInvoices",
      },
    },
    {
      $addFields: {
        totalVehiclesInOrder: { $sum: "$vehicles.quantity" },
        totalVehiclesPIed: {
          $sum: {
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
    {
      $group: {
        _id: null,
        totalVehiclesInAllOrders: { $sum: "$totalVehiclesInOrder" },
        totalVehiclesPIedInAllOrders: { $sum: "$totalVehiclesPIed" },
      },
    },
  ]);

  let overallOrderPICompletionPercentage = 0;
  if (overallOrderPICompletionResult.length > 0) {
    const { totalVehiclesInAllOrders, totalVehiclesPIedInAllOrders } =
      overallOrderPICompletionResult[0];
    if (totalVehiclesInAllOrders > 0) {
      overallOrderPICompletionPercentage =
        (totalVehiclesPIedInAllOrders / totalVehiclesInAllOrders) * 100;
    }
  }

  const prevOverallOrderPICompletionResult = await Order.aggregate([
    {
      $match: {
        ...prevCreatedAtMatch, // Filter orders by creation date for previous period
      },
    },
    {
      $lookup: {
        from: "proformainvoices",
        localField: "_id",
        foreignField: "order_id",
        as: "proformaInvoices",
      },
    },
    {
      $addFields: {
        totalVehiclesInOrder: { $sum: "$vehicles.quantity" },
        totalVehiclesPIed: {
          $sum: {
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
    {
      $group: {
        _id: null,
        totalVehiclesInAllOrders: { $sum: "$totalVehiclesInOrder" },
        totalVehiclesPIedInAllOrders: { $sum: "$totalVehiclesPIed" },
      },
    },
  ]);

  let prevOverallOrderPICompletionPercentage = 0;
  if (prevOverallOrderPICompletionResult.length > 0) {
    const { totalVehiclesInAllOrders, totalVehiclesPIedInAllOrders } =
      prevOverallOrderPICompletionResult[0];
    if (totalVehiclesInAllOrders > 0) {
      prevOverallOrderPICompletionPercentage =
        (totalVehiclesPIedInAllOrders / totalVehiclesInAllOrders) * 100;
    }
  }

  return {
    activePipelineValue: {
      value: activePipelineValue,
      trend: calculateTrend(activePipelineValue, prevActivePipelineValue),
    },
    pendingApprovals: {
      value: pendingApprovals,
      trend: calculateTrend(pendingApprovals, prevPendingApprovals),
    },
    expiringPIs: {
      value: expiringPIs,
      trend: calculateTrend(expiringPIs, prevExpiringPIs),
    },
    overallOrderPICompletion: {
      value: overallOrderPICompletionPercentage,
      trend: calculateTrend(
        overallOrderPICompletionPercentage,
        prevOverallOrderPICompletionPercentage
      ),
    },
  };
};

// GET PI STATUS DISTRIBUTION FOR CHARTS
export const getPIStatusDistributionService = async (timeRange: string) => {
  const { createdAtMatch } = getDateRange(timeRange);

  const statusDistribution = await ProformaInvoice.aggregate([
    {
      $match: {
        ...createdAtMatch,
      },
    },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);
  return statusDistribution;
};

// GET MONTHLY PI VALUE TREND FOR CHARTS
export const getMonthlyPIValueTrendService = async (timeRange: string) => {
  const { createdAtMatch } = getDateRange(timeRange);

  const monthlyTrend = await ProformaInvoice.aggregate([
    {
      $match: {
        ...createdAtMatch,
        status: { $in: ["approved", "sent_to_buyer", "lc_received"] },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        totalAmount: 1,
      },
    },
  ]);
  return monthlyTrend;
};

// GET TOP CLIENTS BY PI VALUE FOR CHARTS
export const getTopClientsByPIValueService = async (
  timeRange: string,
  limit: number = 5
) => {
  const { createdAtMatch } = getDateRange(timeRange);

  const topClients = await ProformaInvoice.aggregate([
    {
      $match: {
        ...createdAtMatch,
        status: { $in: ["approved", "sent_to_buyer", "lc_received"] },
      },
    },
    {
      $group: {
        _id: "$client_id",
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    {
      $lookup: {
        from: "clients", // Assuming your clients collection is named 'clients'
        localField: "_id",
        foreignField: "_id",
        as: "clientInfo",
      },
    },
    { $unwind: "$clientInfo" },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
    { $project: { _id: 0, clientName: "$clientInfo.name", totalAmount: 1 } },
  ]);
  return topClients;
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

  let baseMatch: any = {};
  if (status && status !== "all") {
    baseMatch.status = status;
  }

  // Determine if we need aggregation for searching on populated fields or for sorting by them
  const needsAggregation =
    search || sortBy === "client" || sortBy === "companyName";

  if (needsAggregation) {
    const pipeline: PipelineStage[] = [
      { $match: baseMatch }, // Apply initial status filter
      {
        $lookup: {
          from: "clients", // Assuming 'clients' is the collection name for the Client model
          localField: "client_id",
          foreignField: "_id",
          as: "clientData",
        },
      },
      { $unwind: { path: "$clientData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "companies", // Assuming 'companies' is the collection name for the Company model
          localField: "company_id",
          foreignField: "_id",
          as: "companyData",
        },
      },
      { $unwind: { path: "$companyData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          // Add fields for search on populated fields
          "client_id.name": "$clientData.name",
          "client_id.clientCode": "$clientData.clientCode",
          "company_id.name": "$companyData.name",
        },
      },
      // Add the search match stage here
      {
        $match: {
          $or: [
            { piNumber: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "client_id.name": { $regex: search, $options: "i" } },
            { "client_id.clientCode": { $regex: search, $options: "i" } },
            { "company_id.name": { $regex: search, $options: "i" } },
          ],
        },
      },
      {
        // The sort stage should come after the match stage
        // to sort the filtered results.
        // If sortBy is not client or companyName, it will sort by default createdAt
        $sort: {
          [sortBy === "client" ? "client_id.name" : "company_id.name"]: sortDir,
        },
      },
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
            // Project client_id as an object with name and clientCode
            name: "$client_id.name",
            clientCode: "$client_id.clientCode",
          },
          company_id: {
            // Project company_id as an object with name
            name: "$company_id.name",
          },
          // Include other fields if needed in the projection
        },
      },
    ];

    const pis = await ProformaInvoice.aggregate(pipeline);

    // For total count with aggregation, we need a separate pipeline
    const countPipeline: PipelineStage[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "clients",
          localField: "client_id",
          foreignField: "_id",
          as: "clientData",
        },
      },
      { $unwind: { path: "$clientData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "companies",
          localField: "company_id",
          foreignField: "_id",
          as: "companyData",
        },
      },
      { $unwind: { path: "$companyData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "client_id.name": "$clientData.name",
          "company_id.name": "$companyData.name",
        },
      },
    ];
    if (search && search.trim() !== "") {
      countPipeline.push({
        $match: {
          $or: [
            { piNumber: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "client_id.name": { $regex: search, $options: "i" } },
            { "company_id.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }
    countPipeline.push({ $count: "total" });

    const totalResult = await ProformaInvoice.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
      data: pis,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limitNum),
    };
  } else {
    // Default Mongoose Find for standard fields (piNumber, status, totalAmount, etc.)
    // This path is taken when no search is active and sorting is not on populated fields.
    let sortOption: any = { createdAt: -1 };
    if (sortBy) {
      sortOption = { [sortBy]: sortDir };
    }

    const pis = await ProformaInvoice.find(baseMatch) // Use baseMatch here
      .populate("client_id", "name clientCode") // Populate client info
      .populate("company_id", "name") // Populate company info
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await ProformaInvoice.countDocuments(baseMatch); // Use baseMatch here

    return {
      data: pis,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }
};

// GET PI BY ID
export const getPIByIdService = async (id: string) => {
  const pi = await ProformaInvoice.findById(id)
    .populate(
      "client_id", // Populate client_id to get original details if no snapshot
      "name clientCode email phone country address companyName" // Select fields to populate
    )
    .populate(
      "company_id", // Populate company_id to get original details if no snapshot
      "name email phone address gstNumber bankDetails"
    ); // Select fields to populate

  // If company_id is not populated, and dealer_id was previously used,
  // we might need a fallback or a migration strategy.
  // For now, assuming company_id will be correctly set.

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
