import ProformaInvoice from "../models/ProformaInvoice.model";
import { VehicleBooking } from "../models/VehicleBooking.model";
import { Types, PipelineStage } from "mongoose";
import { Company } from "../models/Company.model"; // Import Company model
import { IBookingVehicle, IBooking } from "../models/Booking.model"; // Import Booking model interfaces
import Dealer from "../models/Dealer.model";
import { Booking } from "../models/Booking.model"; // Import Booking model
import { VehicleOrder } from "../models/VehicleOrder.model";
import LetterOfCredit from "../models/LetterOfCredit.model";
import { savePIPdfToDisk } from "./pdf.service";
import { preparePIDataForService } from "../utils/pi-pdf-helper";

const cleanString = (value: unknown) => String(value || "").trim();

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
    throw new Error("Company is required.");
  }

  const company = await Company.findById(companyId);

  if (!company) {
    throw new Error("Company not found.");
  }

  const initials = getCompanyShortCode(company.name);

  const fy = getFinancialYear(new Date());

  const prefix = `${initials}/PI/${fy}/`;
  const legacyPrefix = `${initials}/EX/PI/${fy}/`;

  const invoices = await ProformaInvoice.find({
    company_id: companyId,
    piNumber: {
      $in: [new RegExp(`^${prefix}\\d+$`), new RegExp(`^${legacyPrefix}\\d+$`)],
    },
  });

  let maxSeq = 0;

  invoices.forEach((pi) => {
    if (!pi.piNumber) return;

    const parts = pi.piNumber.split("/");

    const num = Number(parts[parts.length - 1]);

    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  });

  const nextSeq = maxSeq + 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
};

// New service to get the suggested next PI number
export const getSuggestedNextPiNumberService = async (companyId: string) => {
  return await generateNextPiNumber(companyId);
};

export const getBookedVehicleOrdersService = async (
  clientId: string,
  search: string = "",
) => {
  if (!clientId) {
    throw new Error("Client ID required");
  }

  const usedBookings = await ProformaInvoice.find({
    $or: [
      { vehicleBookingIds: { $exists: true, $ne: [] } },
      { vehicleDetails: { $exists: true, $ne: [] } },
    ],
  }).select("vehicleBookingIds vehicleDetails.chassisNo vehicleDetails.engineNo");

  const usedIds = usedBookings.flatMap(
    (pi: any) => pi.vehicleBookingIds?.map((id: any) => id.toString()) || [],
  );
  const usedChassis = new Set(
    usedBookings.flatMap((pi: any) =>
      (pi.vehicleDetails || [])
        .map((vehicle: any) => cleanString(vehicle.chassisNo).toLowerCase())
        .filter(Boolean),
    ),
  );
  const usedEngines = new Set(
    usedBookings.flatMap((pi: any) =>
      (pi.vehicleDetails || [])
        .map((vehicle: any) => cleanString(vehicle.engineNo).toLowerCase())
        .filter(Boolean),
    ),
  );

  const bookings = await VehicleBooking.find({
    assignedClientId: clientId,
    chassisNumber: { $exists: true, $nin: ["", null] },
    status: {
      $in: ["approved", "payment_done", "chassis_received", "delivered"],
    },
    _id: { $nin: usedIds },
  })
    .populate("vehicleId")
    .populate("orderId")
    .sort({ createdAt: -1 })
    .lean();

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

  const unusedBookings = bookings.filter((booking: any) => {
    const chassis = cleanString(booking.chassisNumber).toLowerCase();
    const engine = cleanString(booking.engineNumber).toLowerCase();
    return !usedChassis.has(chassis) && !usedEngines.has(engine);
  });

  const bookingsWithDisplayId = unusedBookings.map((booking: any) => {
    const vehicle = booking.vehicleId || {};
    const order = booking.orderId || {};
    const vehicleSnapshot = order.vehicleSnapshot || {};

    return {
      ...booking,
      vehicleDisplayId:
        bookingDisplayIdMap.get(booking._id.toString()) ||
        `VEH-${String(booking.vehicleIndex || 0).padStart(3, "0")}`,
      vehicleName: [
        vehicle.brandName || vehicleSnapshot.brandName,
        vehicle.modelName || vehicleSnapshot.modelName,
        vehicle.variant || vehicleSnapshot.variant,
      ]
        .filter(Boolean)
        .join(" "),
      color: vehicleSnapshot.color || vehicle.color || "",
    };
  });

  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return bookingsWithDisplayId;
  }

  return bookingsWithDisplayId.filter((booking) =>
    [
      booking.vehicleDisplayId,
      booking.vehicleName,
      booking.chassisNumber,
      booking.color,
      booking.status,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      ),
  );
};

// Helper to get financial year from a date
const getFinancialYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 3) {
    const start = String(year).slice(2);
    const end = String(year + 1).slice(2);
    return `${start}-${end}`;
  } else {
    const start = String(year - 1).slice(2);
    const end = String(year).slice(2);
    return `${start}-${end}`;
  }
};

// Helper to derive company short code
const getCompanyShortCode = (companyName: string): string => {
  if (!companyName) return "XX";

  const words = companyName.trim().split(" ").filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return companyName.substring(0, 2).toUpperCase();
};

// CREATE PI
export const createPIService = async (data: any) => {
  const vehicleBookingIds = (data.vehicleBookingIds || []).filter(Boolean);
  const selectedChassisNumbers = (data.vehicleDetails || [])
    .map((vehicle: any) => cleanString(vehicle.chassisNo))
    .filter(Boolean);
  const selectedEngineNumbers = (data.vehicleDetails || [])
    .map((vehicle: any) => cleanString(vehicle.engineNo))
    .filter(Boolean);

  if (vehicleBookingIds.length > 0) {
    const existingPI = await ProformaInvoice.findOne({
      $or: [
        { vehicleBookingIds: { $in: vehicleBookingIds } },
        ...(selectedChassisNumbers.length
          ? [{ "vehicleDetails.chassisNo": { $in: selectedChassisNumbers } }]
          : []),
        ...(selectedEngineNumbers.length
          ? [{ "vehicleDetails.engineNo": { $in: selectedEngineNumbers } }]
          : []),
      ],
    }).select("piNumber");

    if (existingPI) {
      throw new Error(
        `PI already generated for one or more selected vehicles (${existingPI.piNumber}).`,
      );
    }

  const incompleteVehicleCount = await VehicleBooking.countDocuments({
    _id: { $in: vehicleBookingIds },
    $or: [
      { chassisNumber: { $exists: false } },
      { chassisNumber: "" },
      { chassisNumber: null },
    ],
  });

  if (incompleteVehicleCount > 0) {
    throw new Error(
      "PI can only be generated for vehicles with a chassis number.",
    );
  } else if (selectedChassisNumbers.length || selectedEngineNumbers.length) {
    const existingPI = await ProformaInvoice.findOne({
      $or: [
        ...(selectedChassisNumbers.length
          ? [{ "vehicleDetails.chassisNo": { $in: selectedChassisNumbers } }]
          : []),
        ...(selectedEngineNumbers.length
          ? [{ "vehicleDetails.engineNo": { $in: selectedEngineNumbers } }]
          : []),
      ],
    }).select("piNumber");

    if (existingPI) {
      throw new Error(
        `PI already generated for this vehicle (${existingPI.piNumber}).`,
      );
    }
  }
  }

  const totalAmount = (data.vehicleDetails || []).reduce(
    (sum: number, v: any) =>
      sum +
      (Number(v.quantity) || 1) *
      ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
    0,
  );

  data.totalAmount = totalAmount;
  data.amountInWords = numberToWords(totalAmount);

  const finalPiNumber = await generateNextPiNumber(data.company_id);

  const pi = new ProformaInvoice({ ...data, piNumber: finalPiNumber });
  const savedPI = await pi.save();

  try {
    // Populate to get full names for the PDF
    const fullPI = await ProformaInvoice.findById(savedPI._id)
      .populate("client_id company_id")
      .populate({
        path: "vehicleDetails.vehicle_id",
        select:
          "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
      })
      .populate({
        path: "vehicleBookingIds",
        populate: [
          {
            path: "vehicleId",
            select:
              "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
          },
          {
            path: "orderId",
            select: "vehicleSnapshot",
          },
        ],
      });
    const pdfData = preparePIDataForService(fullPI);
    const relativePath = await savePIPdfToDisk(pdfData);

    // Update the record with the file path
    await ProformaInvoice.findByIdAndUpdate(savedPI._id, {
      pdfPath: relativePath,
    });
  } catch (err) {
    console.error("Auto PDF Generation failed", err);
  }
  return savedPI;
};

// Helper types for the service function's return value, mirroring frontend's VehicleTracking and AssociatedPI
interface AssociatedPI {
  piId: string;
  piNumber: string;
  companyName: string;
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
  dealerName: string;
  fob: number;
  freight: number;
  quantity: number;
  bookingStatus: "Booked" | "Draft";
  piStatus: "PI'd" | "Pending";
  associatedPIs: AssociatedPI[];
}

// New service to get detailed order tracking with PI and Booking status
export const getOrderDetailWithTrackingService = async (orderId: string) => {
  const order = await VehicleOrder.findById(orderId).populate(
    "clientId",
    "name clientCode email phone companyName address country",
  );

  if (!order) {
    throw new Error("Order not found");
  }

  // Fetch all relevant bookings for this order
  // We need to find bookings that contain vehicles linked to this order
  const bookings = await Booking.find({
    orderId: new Types.ObjectId(orderId),
    status: "Booked",
  }).populate("dealerId", "name");

  // Collect all unique dealer names for the summary
  const uniqueDealers = new Set<string>();
  bookings.forEach((b) => {
    if ((b.dealerId as any)?.name) uniqueDealers.add((b.dealerId as any).name);
  });
  const summaryDealerDisplay =
    uniqueDealers.size > 1
      ? `${uniqueDealers.size} Dealers Involved`
      : uniqueDealers.values().next().value || "N/A";

  // Fetch all relevant Proforma Invoices for this order
  const proformaInvoices = await ProformaInvoice.find({
    order_id: new Types.ObjectId(orderId),
  }).populate("company_id", "name");

  const vehicleTracking: VehicleTracking[] = [];
  let totalVehiclesInOrder = 0;
  let totalVehiclesPIed = 0;
  let globalIndex = 0;

  const qty = order.quantity || 1;
  totalVehiclesInOrder = qty;

  for (let qIdx = 0; qIdx < qty; qIdx++) {
    const currentSrNo = String(globalIndex + 1);
    globalIndex++;

    // 1. Find the individual booking for this specific unit using srNo
    let foundBookingVehicle: any = null;
    let unitDealerName = "N/A";
    for (const b of bookings) {
      const bv = b.vehicles.find((v) => String(v.srNo) === currentSrNo);
      if (bv) {
        foundBookingVehicle = bv;
        unitDealerName = (b.dealerId as any)?.name || "N/A";
        break;
      }
    }

    const unitChassis = foundBookingVehicle?.chassisNo || "N/A";
    const unitEngine = foundBookingVehicle?.engineNo || "N/A";
    const bookingStatus = foundBookingVehicle ? "Booked" : "Draft";

    // 2. Determine PI Status using the Chassis Number from the Booking
    let piStatus: "PI'd" | "Pending" = "Pending";
    const associatedPIs: AssociatedPI[] = [];

    if (unitChassis && unitChassis !== "N/A") {
      const normalizedChassis = unitChassis.trim().toLowerCase();

      for (const pi of proformaInvoices) {
        const piVehicle = pi.vehicleDetails.find(
          (vd) =>
            vd.chassisNo &&
            vd.chassisNo.trim().toLowerCase() === normalizedChassis,
        );
        if (piVehicle) {
          piStatus = "PI'd";
          totalVehiclesPIed += 1;
          associatedPIs.push({
            piId: pi._id.toString(),
            piNumber: pi.piNumber,
            companyName: (pi.company_id as any)?.name || "N/A",
            createdAt: pi.createdAt.toISOString(),
          });
          break; // Stop looking for this vehicle once found in a PI
        }
      }
    }

    vehicleTracking.push({
      _id: new Types.ObjectId().toString(),
      make: order.vehicleSnapshot?.brandName || "N/A",
      model: order.vehicleSnapshot?.modelName || "N/A",
      chassisNo: unitChassis,
      engineNo: unitEngine,
      color:
        foundBookingVehicle?.color || order.vehicleSnapshot?.color || "N/A",
      hsn:
        foundBookingVehicle?.commercialHsnCode ||
        foundBookingVehicle?.hsnCode ||
        order.vehicleSnapshot?.commercialHsnCode ||
        order.vehicleSnapshot?.hsnCode ||
        "N/A",
      yom: foundBookingVehicle?.yom ? String(foundBookingVehicle.yom) : "N/A",
      fuelType: foundBookingVehicle?.fuelType || "N/A",
      countryOfOrigin: foundBookingVehicle?.countryOfOrigin || "N/A",
      dealerName: unitDealerName,
      engineCapacity: foundBookingVehicle?.engineCapacity || "N/A",
      fob: foundBookingVehicle?.fobAmount || 0,
      freight: foundBookingVehicle?.freight || 0,
      quantity: 1,
      bookingStatus,
      piStatus,
      associatedPIs,
    });
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
    orderId: order.orderNumber,
    voucherNo: "-",
    client: {
      _id: (order.clientId as any)?._id?.toString() || "N/A", // Add client _id
      name: (order.clientId as any)?.name || "N/A",
      clientCode: (order.clientId as any)?.clientCode || "N/A",
      email: (order.clientId as any)?.email,
      phone: (order.clientId as any)?.phone,
      companyName: (order.clientId as any)?.companyName,
      address: (order.clientId as any)?.address,
      country: (order.clientId as any)?.country,
    },
    dealer: { name: "-" },
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
        now.getDate() - 1,
      );
      prevEndDate = startDate;
      break;
    case "thisWeek":
      const dayOfWeek = now.getDay(); // Sunday is 0, Saturday is 6
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - dayOfWeek,
      ); // Start of Sunday
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (6 - dayOfWeek) + 1,
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

const getLatestLCByPIMap = async (piIds: Array<Types.ObjectId | string>) => {
  if (piIds.length === 0) {
    return new Map<string, any>();
  }

  const normalizedIds = piIds.map((id) =>
    typeof id === "string" ? new Types.ObjectId(id) : id,
  );

  const latestLCs = await LetterOfCredit.aggregate([
    {
      $match: {
        pi_id: { $in: normalizedIds },
      },
    },
    { $sort: { uploadedAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$pi_id",
        latest: { $first: "$$ROOT" },
      },
    },
  ]);

  return new Map<string, any>(
    latestLCs.map((entry) => [String(entry._id), entry.latest]),
  );
};

const getClientDisplayName = (pi: any) =>
  pi.clientSnapshot?.name ||
  pi.clientSnapshot?.companyName ||
  pi.client_id?.name ||
  pi.client_id?.companyName ||
  "Unknown Buyer";

const getLCStageLabel = (pi: any, latestLC: any) => {
  if (latestLC?.status === "verified") {
    return "Verified LC";
  }

  if (latestLC?.status === "rejected") {
    return "Amendment Needed";
  }

  if (latestLC) {
    return "Received LC";
  }

  if (pi.status === "approved" || pi.status === "sent_to_buyer") {
    return "Awaiting LC";
  }

  return "In Preparation";
};

const getTimelineBucket = (dateValue: Date, timeRange: string) => {
  const date = new Date(dateValue);

  switch (timeRange) {
    case "today":
      return {
        key: `${date.getHours()}`.padStart(2, "0"),
        label: `${`${date.getHours()}`.padStart(2, "0")}:00`,
        sortValue: date.getHours(),
      };
    case "thisWeek":
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        sortValue: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).getTime(),
      };
    case "thisMonth":
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        label: date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        }),
        sortValue: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).getTime(),
      };
    case "thisYear":
    case "allTime":
    default:
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        sortValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      };
  }
};

const buildTimeline = (pis: any[], timeRange: string) => {
  const grouped = new Map<
    string,
    {
      label: string;
      sortValue: number;
      totalAmount: number;
      totalPI: number;
    }
  >();

  pis.forEach((pi) => {
    const createdAt = pi.createdAt ? new Date(pi.createdAt) : null;
    if (!createdAt) {
      return;
    }

    const bucket = getTimelineBucket(createdAt, timeRange);
    const current = grouped.get(bucket.key) || {
      label: bucket.label,
      sortValue: bucket.sortValue,
      totalAmount: 0,
      totalPI: 0,
    };

    current.totalAmount += Number(pi.totalAmount || 0);
    current.totalPI += 1;
    grouped.set(bucket.key, current);
  });

  return Array.from(grouped.values()).sort(
    (left, right) => left.sortValue - right.sortValue,
  );
};

const buildTopClients = (pis: any[]) => {
  const grouped = new Map<
    string,
    {
      clientName: string;
      totalAmount: number;
      totalPI: number;
    }
  >();

  pis.forEach((pi) => {
    const clientName = getClientDisplayName(pi);
    const current = grouped.get(clientName) || {
      clientName,
      totalAmount: 0,
      totalPI: 0,
    };

    current.totalAmount += Number(pi.totalAmount || 0);
    current.totalPI += 1;
    grouped.set(clientName, current);
  });

  return Array.from(grouped.values())
    .sort((left, right) => right.totalAmount - left.totalAmount)
    .slice(0, 5);
};

const getDashboardMetricSet = (pis: any[], latestLCMap: Map<string, any>) => {
  const totalPI = pis.length;
  const totalPIAmount = pis.reduce(
    (sum, pi) => sum + Number(pi.totalAmount || 0),
    0,
  );
  // Awaiting LC = PIs with status "draft"
  const awaitingLC = pis.filter((pi) => pi.status === "draft").length;
  // Received LC = PIs with status "lc_received"
  const receivedLC = pis.filter((pi) => pi.status === "lc_received").length;
  const verifiedLC = Array.from(latestLCMap.values()).filter(
    (lc) => lc.status === "verified",
  ).length;
  const amendmentLC = Array.from(latestLCMap.values()).filter(
    (lc) => lc.status === "rejected",
  ).length;

  return {
    totalPI,
    totalPIAmount,
    awaitingLC,
    receivedLC,
    verifiedLC,
    amendmentLC,
  };
};

export const getPIDashboardOverviewService = async (timeRange: string) => {
  const normalizedTimeRange = timeRange || "thisMonth";
  const { createdAtMatch, prevCreatedAtMatch } =
    getDateRange(normalizedTimeRange);
  const canCompare = normalizedTimeRange !== "allTime";

  const [currentPIs, previousPIs] = await Promise.all([
    ProformaInvoice.find(createdAtMatch)
      .select(
        "piNumber status totalAmount validityDate createdAt clientSnapshot client_id",
      )
      .populate("client_id", "name companyName")
      .sort({ createdAt: -1 })
      .lean(),
    ProformaInvoice.find(prevCreatedAtMatch)
      .select("status totalAmount createdAt clientSnapshot client_id")
      .populate("client_id", "name companyName")
      .lean(),
  ]);

  const [currentLCMap, previousLCMap] = await Promise.all([
    getLatestLCByPIMap(currentPIs.map((pi: any) => pi._id)),
    getLatestLCByPIMap(previousPIs.map((pi: any) => pi._id)),
  ]);

  const currentMetrics = getDashboardMetricSet(currentPIs, currentLCMap);
  const previousMetrics = getDashboardMetricSet(previousPIs, previousLCMap);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringSoon = currentPIs.filter((pi: any) => {
    if (!pi.validityDate) {
      return false;
    }

    const validityDate = new Date(pi.validityDate);
    return (
      validityDate >= now &&
      validityDate <= sevenDaysFromNow &&
      !["lc_received", "expired"].includes(pi.status)
    );
  }).length;

  const draftOrApproval = currentPIs.filter((pi: any) =>
    ["draft", "pending_approval"].includes(pi.status),
  ).length;
  const buyersWithActivity = new Set(
    currentPIs.map((pi: any) => getClientDisplayName(pi)),
  ).size;
  const verificationRate =
    currentMetrics.receivedLC > 0
      ? Math.round(
        (currentMetrics.verifiedLC / currentMetrics.receivedLC) * 100,
      )
      : 0;
  const amendmentRate =
    currentMetrics.receivedLC > 0
      ? Math.round(
        (currentMetrics.amendmentLC / currentMetrics.receivedLC) * 100,
      )
      : 0;

  const lcStageDistribution = [
    {
      key: "awaiting_lc",
      label: "Awaiting LC",
      value: currentMetrics.awaitingLC,
    },
    {
      key: "received_lc",
      label: "Received LC",
      value: currentMetrics.receivedLC,
    },
    {
      key: "verified_lc",
      label: "Verified LC",
      value: currentMetrics.verifiedLC,
    },
    {
      key: "amendment_lc",
      label: "Amendment LC",
      value: currentMetrics.amendmentLC,
    },
  ];

  const piStatusCounts = {
    draft: 0,
    pending_approval: 0,
    approved: 0,
    sent_to_buyer: 0,
    lc_received: 0,
    expired: 0,
  };

  currentPIs.forEach((pi: any) => {
    if (pi.status in piStatusCounts) {
      piStatusCounts[pi.status as keyof typeof piStatusCounts] += 1;
    }
  });

  const piStatusDistribution = [
    { key: "draft", label: "Draft", value: piStatusCounts.draft },
    {
      key: "pending_approval",
      label: "Pending Approval",
      value: piStatusCounts.pending_approval,
    },
    { key: "approved", label: "Approved", value: piStatusCounts.approved },
    {
      key: "sent_to_buyer",
      label: "Sent to Buyer",
      value: piStatusCounts.sent_to_buyer,
    },
    {
      key: "lc_received",
      label: "LC Received",
      value: piStatusCounts.lc_received,
    },
    { key: "expired", label: "Expired", value: piStatusCounts.expired },
  ];

  const recentActivity = currentPIs.slice(0, 6).map((pi: any) => {
    const latestLC = currentLCMap.get(String(pi._id));

    return {
      id: String(pi._id),
      piNumber: pi.piNumber,
      clientName: getClientDisplayName(pi),
      totalAmount: Number(pi.totalAmount || 0),
      status: pi.status,
      lcStage: getLCStageLabel(pi, latestLC),
      validityDate: pi.validityDate,
      createdAt: pi.createdAt,
    };
  });

  return {
    summary: {
      totalPI: {
        value: currentMetrics.totalPI,
        trend: canCompare
          ? calculateTrend(currentMetrics.totalPI, previousMetrics.totalPI)
          : null,
      },
      totalPIAmount: {
        value: currentMetrics.totalPIAmount,
        trend: canCompare
          ? calculateTrend(
            currentMetrics.totalPIAmount,
            previousMetrics.totalPIAmount,
          )
          : null,
      },
      awaitingLC: {
        value: currentMetrics.awaitingLC,
        trend: canCompare
          ? calculateTrend(
            currentMetrics.awaitingLC,
            previousMetrics.awaitingLC,
          )
          : null,
      },
      receivedLC: {
        value: currentMetrics.receivedLC,
        trend: canCompare
          ? calculateTrend(
            currentMetrics.receivedLC,
            previousMetrics.receivedLC,
          )
          : null,
      },
      verifiedLC: {
        value: currentMetrics.verifiedLC,
        trend: canCompare
          ? calculateTrend(
            currentMetrics.verifiedLC,
            previousMetrics.verifiedLC,
          )
          : null,
      },
      amendmentLC: {
        value: currentMetrics.amendmentLC,
        trend: canCompare
          ? calculateTrend(
            currentMetrics.amendmentLC,
            previousMetrics.amendmentLC,
          )
          : null,
      },
    },
    health: {
      expiringSoon,
      draftOrApproval,
      buyersWithActivity,
      verificationRate,
      amendmentRate,
    },
    lcStageDistribution,
    piStatusDistribution,
    timeline: buildTimeline(currentPIs, normalizedTimeRange),
    topClients: buildTopClients(currentPIs),
    recentActivity,
  };
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
    prevActivePipelineValueResult.length > 0
      ? prevActivePipelineValueResult[0].totalAmount
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
    pendingApprovalsResult.length > 0 ? prevPendingApprovalsResult[0].count : 0;

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
  const overallOrderPICompletionResult = await VehicleOrder.aggregate([
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
        totalVehiclesInOrder: "$quantity",
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

  const prevOverallOrderPICompletionResult = await VehicleOrder.aggregate([
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
        totalVehiclesInOrder: "$quantity",
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
        prevOverallOrderPICompletionPercentage,
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
  limit: number = 5,
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
      { orderNumber: { $regex: search, $options: "i" } },
      { "client.name": { $regex: search, $options: "i" } },
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
        totalVehiclesInOrder: "$quantity",
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
    VehicleOrder.aggregate(dataPipeline),
    VehicleOrder.aggregate(countPipeline),
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
            { "vehicleDetails.chassisNo": { $regex: search, $options: "i" } },
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
            { "vehicleDetails.chassisNo": { $regex: search, $options: "i" } },
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
    .populate("order_id", "orderNumber")
    .populate({
      path: "vehicleDetails.vehicle_id",
      select:
        "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
    })
    .populate({
      path: "vehicleBookingIds",
      populate: [
        {
          path: "vehicleId",
          select:
            "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
        },
        {
          path: "orderId",
          select: "vehicleSnapshot",
        },
      ],
    }) // Order model se orderId field fetch karne ke liye
    .populate(
      "client_id", // Populate client_id to get original details if no snapshot
      "name clientCode email phone country address companyName", // Select fields to populate
    )
    .populate(
      "company_id", // Populate company_id to get original details if no snapshot
      "name email phone address gstNumber bankDetails",
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
// export const updatePIService = async (id: string, data: any) => {
//   if (data.vehicleDetails) {
//     data.totalAmount = data.vehicleDetails.reduce(
//       (sum: number, v: any) =>
//         // Ensure fob and freight are treated as numbers
//         sum + v.quantity * ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
//       0,
//     );

//     data.amountInWords = numberToWords(data.totalAmount);
//   }

//   const updated = await ProformaInvoice.findByIdAndUpdate(id, data, {
//     new: true,
//   });

//   // Booking status update removed — "PI Created" status no longer exists in the system

//   return updated;
// };

export const updatePIService = async (id: string, data: any) => {
  if (data.vehicleDetails) {
    data.totalAmount = data.vehicleDetails.reduce(
      (sum: number, v: any) =>
        sum +
        v.quantity * ((Number(v.fob) || 0) + (Number(v.freight) || 0)),
      0,
    );

    data.amountInWords = numberToWords(data.totalAmount);
  }

  // Update PI
  const updated = await ProformaInvoice.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updated) {
    throw new Error("PI not found");
  }

  try {
    // Refetch populated data
    const fullPI = await ProformaInvoice.findById(updated._id)
      .populate("client_id company_id")
      .populate({
        path: "vehicleDetails.vehicle_id",
        select:
          "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
      })
      .populate({
        path: "vehicleBookingIds",
        populate: [
          {
            path: "vehicleId",
            select:
              "brandName modelName variant color engineCapacity commercialHsnCode exportHsnCode hsnCode fobAmount freight igstRate",
          },
          {
            path: "orderId",
            select: "vehicleSnapshot",
          },
        ],
      });

    const pdfData = preparePIDataForService(fullPI);

    // Generate NEW PDF
    const relativePath = await savePIPdfToDisk(pdfData);

    // Save latest PDF path
    await ProformaInvoice.findByIdAndUpdate(updated._id, {
      pdfPath: relativePath,
    });

  } catch (err) {
    console.error("Auto PDF Generation failed", err);
  }

  // RETURN latest updated document
  const finalUpdatedPI = await ProformaInvoice.findById(id)
    .populate("client_id company_id");

  return finalUpdatedPI;
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
    { new: true },
  );

  return updated;
};