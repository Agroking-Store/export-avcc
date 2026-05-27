import { Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import ProformaInvoice from "../models/ProformaInvoice.model";
import Invoice, { InvoiceDocumentType } from "../models/Invoice.model";
import LetterOfCredit from "../models/LetterOfCredit.model";
import { renderInvoicePDF } from "../services/invoicePdf.service";
import { numberToWordsINR, numberToWordsUSD } from "../utils/numberToWords";

const EXPORTER = {
  companyName: "ANANYATA TRADELINK LLP",
  addressLines: [
    "Flat No 50, S No 27/4-27/5, Building No 7,",
    "Hingane Khurd, Parvati, Pune - 411009, Maharashtra, India",
  ],
  gstin: "27ACEFA0695F1ZH",
  iecNo: "ACEFA0695F",
  adCode: "2010216",
  pan: "ACEFA0695F",
  bankName: "IDFC First Bank",
  accountNo: "10247939579",
  ifsc: "IDFB0041359",
  swift: "IDFBINBBMUM",
  stateCode: "Maharashtra - 27",
  districtOfOrigin: "Pune - 411009",
};

const STATIC_TEXT = {
  DBK001:
    "I declare that no input tax credit of the Central Goods and Services Tax or of the Integrated Goods and Services Tax has been availed for any of the inputs or input services used in the manufacture of the export goods.",
  DBK003:
    "I declare that CENVAT credit on the inputs or input services used in the manufacture of the export goods has not been carried forward in terms of the Central Goods and Services Tax Act, 2017.",
  MEIS: "We intend to claim rewards under Merchandise Exports From India Scheme (MEIS) RoDTEP Scheme",
  GSP_ORIGIN:
    "The Exporter ANANYATA TRADELINK LLP, Flat No 50, S No 27/4-27/5, Building No 7, Hingane Khurd, Parvati, Pune - 411009, Maharashtra, India declares that, except where otherwise clearly indicated, these products are of Indian preferential origin according to rules of origin of the generalized system of preferences of the European Union and that the origin criterion met is 'P'.",
  DECLARATION:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  ACCESSORIES:
    "WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE HAVE THE FOLLOWING ACCESSORIES INSTALLED: A) AUTOMATIC TRANSMISSION B) ANTI-LOCK BRAKING SYSTEM C) DRIVER & FRONT PASSENGER HAVE STANDARD AIRBAGS D) DRIVER & FRONT PASSENGER HAVE THREE POINT SEAT BELT & OTHER PASSENGERS HAVE MINIMUM TWO POINT SEAT BELT WHERE APPLICABLE.",
  AGE_CERT:
    "WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE ARE NOT MORE THAN 3 YEARS OLD AT THE TIME OF SHIPMENT.",
};

const isValidObjectId = (value: string) =>
  mongoose.Types.ObjectId.isValid(value);

const pad = (value: number) => String(value).padStart(2, "0");

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day}/${month}/${year}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatMonthYearRegistration = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && value.includes("/")) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const month = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ][date.getMonth()];

  return `${date.getFullYear()}/${month}/${pad(date.getDate())}`;
};

const formatAddress = (address: any) => {
  if (!address) {
    return "";
  }

  if (typeof address === "string") {
    return address;
  }

  return [
    address.houseBuilding,
    address.streetArea,
    address.cityTown,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatCurrency = (value: number, currency: "USD" | "INR") => {
  if (!Number.isFinite(value)) {
    return currency === "USD" ? "0.00" : "0.00";
  }

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const roundCurrency = (value: number) => Number(value.toFixed(2));

const deriveExchangeRate = (
  vehicle: any,
  manualFields: Record<string, any>,
) => {
  const manualExchangeRate = Number(manualFields.customExchangeRate || 0);

  if (manualExchangeRate > 0) {
    return manualExchangeRate;
  }

  const totalUSD = Number(vehicle.totalUSD || 0);
  const exShowroomINR = Number(vehicle.exShowroomINR || 0);

  if (totalUSD > 0 && exShowroomINR > 0) {
    return roundCurrency(exShowroomINR / totalUSD);
  }

  return 0;
};

const calculateInrInvoiceAmounts = ({
  totalUSD,
  exchangeRate,
  igstRate,
}: {
  totalUSD: number;
  exchangeRate: number;
  igstRate: number;
}) => {
  const exShowroomINR = roundCurrency(totalUSD * exchangeRate);
  const igstAmountINR = roundCurrency((exShowroomINR * igstRate) / 100);
  const totalINR = roundCurrency(exShowroomINR + igstAmountINR);

  return {
    exShowroomINR,
    igstAmountINR,
    totalINR,
  };
};

const sanitizeFileName = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const getFirstFilled = (...values: Array<unknown>) => {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      if (value.trim()) {
        return value.trim();
      }
      continue;
    }

    return value;
  }

  return "";
};

const splitModelAndVariant = (modelLabel: string, variantLabel: string) => {
  const normalizedModel = normalizeWhitespace(modelLabel || "");
  const normalizedVariant = normalizeWhitespace(variantLabel || "");

  if (!normalizedVariant || !normalizedModel) {
    return {
      model: normalizedModel,
      variant: normalizedVariant,
    };
  }

  if (normalizedModel.toLowerCase().endsWith(normalizedVariant.toLowerCase())) {
    return {
      model: normalizedModel
        .slice(0, normalizedModel.length - normalizedVariant.length)
        .trim(),
      variant: normalizedVariant,
    };
  }

  return {
    model: normalizedModel,
    variant: normalizedVariant,
  };
};

const deriveVariantFromLine = ({
  make,
  modelName,
  lineModel,
}: {
  make: string;
  modelName: string;
  lineModel: string;
}) => {
  const source = normalizeWhitespace(lineModel || "");
  if (!source) {
    return "";
  }

  const candidates = [
    normalizeWhitespace(`${make} ${modelName}`),
    normalizeWhitespace(modelName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (source.toLowerCase().startsWith(candidate.toLowerCase())) {
      return source.slice(candidate.length).trim();
    }
  }

  return "";
};

const getFinancialYear = (value = new Date()) => {
  const year = value.getFullYear();
  const month = value.getMonth();

  if (month >= 3) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  }

  return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
};

const buildInvoiceNumber = async () => {
  const prefix = `AN/EX/${getFinancialYear()}/`;
  const invoices = await Invoice.find({
    invoiceNumber: { $regex: `^${prefix.replace(/\//g, "\\/")}\\d+$` },
  }).select("invoiceNumber");

  let maxSequence = 0;

  for (const invoice of invoices) {
    const sequence = Number(invoice.invoiceNumber.split("/").pop());
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `${prefix}${maxSequence + 1}`;
};

const getSharedVehicleInvoiceNumber = (vehicle: any) => {
  const invoices = vehicle?.invoices || {};
  const invoiceTypes: InvoiceDocumentType[] = [
    "INR",
    "USD",
    "COMMERCIAL",
    "PACKING_LIST",
  ];

  for (const invoiceType of invoiceTypes) {
    const invoiceNumber = invoices[invoiceType]?.invoiceNumber;
    if (invoiceNumber && String(invoiceNumber).trim()) {
      return String(invoiceNumber).trim();
    }
  }

  return "";
};

const resolveInvoiceNumber = ({
  manualFields,
  vehicles,
  fallbackInvoiceNumber,
}: {
  manualFields: Record<string, any>;
  vehicles: any[];
  fallbackInvoiceNumber?: string;
}) => {
  const sharedInvoiceNumber =
    vehicles.map(getSharedVehicleInvoiceNumber).find(Boolean) || "";
  const manualInvoiceNumber = String(manualFields.invoiceNumber || "").trim();

  return (
    sharedInvoiceNumber ||
    manualInvoiceNumber ||
    String(fallbackInvoiceNumber || "").trim()
  );
};

const getLatestLC = async (piId: string) =>
  LetterOfCredit.findOne({ pi_id: piId }).sort({ uploadedAt: -1 }).lean();

const getSharedLCFromInvoices = (invoices: any[]) => {
  for (const invoice of invoices) {
    const manual = invoice.manualFields || {};
    const lcNumber = String(manual.lcNumber || "").trim();
    const lcDate = manual.lcDate;

    if (lcNumber || lcDate) {
      return { lcNumber, lcDate };
    }
  }

  return { lcNumber: "", lcDate: "" };
};

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const populatePI = async (piId: string) => {
  const pi = await ProformaInvoice.findById(piId)
    .populate({
      path: "vehicleBookingIds",
      populate: [
        {
          path: "vehicleId",
          select:
            "brandName modelName variant color commercialHsnCode exportHsnCode hsnCode fobAmount freight",
        },
        {
          path: "orderId",
          select: "vehicleSnapshot",
        },
      ],
    })
    .populate(
      "client_id",
      "name companyName clientCode email phone country address",
    )
    .populate("company_id", "name email phone address gstNumber bankDetails");

  if (!pi) {
    return null;
  }

  return pi;
};

const normalizeVehicle = (pi: any, line: any, index: number) => {
  const booking = pi.vehicleBookingIds?.[index] as any;
  const vehicleRef = booking?.vehicleId as any;
  const orderRef = booking?.orderId as any;
  const orderVehicle = orderRef?.vehicleSnapshot || {};

  const make = vehicleRef?.brandName || orderVehicle?.brandName || "";
  const rawModelName =
    vehicleRef?.modelName || orderVehicle?.modelName || line.model || "";
  const rawVariant =
    vehicleRef?.variant ||
    orderVehicle?.variant ||
    line.variant ||
    deriveVariantFromLine({
      make,
      modelName: rawModelName,
      lineModel: line.model || "",
    });
  const splitLine =
    vehicleRef?.modelName || orderVehicle?.modelName
      ? { model: rawModelName, variant: rawVariant }
      : splitModelAndVariant(rawModelName, rawVariant);
  const modelName = splitLine.model || rawModelName;
  const variant = splitLine.variant || rawVariant;
  const colour = line.color || vehicleRef?.color || orderVehicle?.color || "";
  const commercialHsnCode = String(
    getFirstFilled(
      line.commercialHsn,
      line.hsn,
      booking?.commercialHsnCode,
      booking?.hsnCode,
      vehicleRef?.commercialHsnCode,
      vehicleRef?.hsnCode,
      orderVehicle?.commercialHsnCode,
      orderVehicle?.hsnCode,
    ),
  );
  const exportHsnCode = String(
    getFirstFilled(
      line.exportHsn,
      booking?.exportHsnCode,
      booking?.hsnCode,
      vehicleRef?.exportHsnCode,
      vehicleRef?.hsnCode,
      orderVehicle?.exportHsnCode,
      orderVehicle?.hsnCode,
      commercialHsnCode,
    ),
  );
  const fobUSD = Number(line.fob || vehicleRef?.fobAmount || 0);
  const freightUSD = Number(line.freight || vehicleRef?.freight || 0);
  const exShowroomINR = Number(line.exShowroomINR || 0);
  const igstRate = Number(line.igstRate || 18);
  const igstAmountINR = Number(((exShowroomINR * igstRate) / 100).toFixed(2));
  const totalINR = Number((exShowroomINR + igstAmountINR).toFixed(2));
  const vehicleId =
    booking?._id?.toString() ||
    `${line.vehicle_id?.toString?.() || "vehicle"}:${index}`;

  return {
    vehicleId,
    vehicleBookingId: booking?._id?.toString?.() || "",
    vehicleLineIndex: index,
    srNo: index + 1,
    sourceVehicleId:
      line.vehicle_id?.toString?.() || vehicleRef?._id?.toString?.() || "",
    make,
    model: modelName,
    variant,
    colour,
    chassisNo: line.chassisNo || booking?.chassisNumber || "",
    engineNo: line.engineNo || booking?.engineNumber || "",
    engineCapacity: booking?.engineCapacity || line.engineCapacity || "",
    fuelType: booking?.fuelType || line.fuelType || "",
    yearOfManufacture: line.yom || booking?.yom || "",
    monthYearFirstReg: formatMonthYearRegistration(
      line.monthYearFirstReg || booking?.deliveryDate || "",
    ),
    commercialHsnCode,
    exportHsnCode,
    hsnCode: exportHsnCode || commercialHsnCode,
    dbkSrNo: line.dbkSrNo || "",
    exportInspCertNo: line.exportInspCertNo || "",
    exportInspCertDate: formatDisplayDate(line.exportInspCertDate || ""),
    fobUSD,
    freightUSD,
    totalUSD: Number((fobUSD + freightUSD).toFixed(2)),
    exShowroomINR,
    igstRate,
    igstAmountINR,
    totalINR,
    netWeightKg: line.netWeightKg || "",
    grossWeightKg: line.grossWeightKg || "",
    dimensionsCm: line.dimensionsCm || "",
    quantity: Number(line.quantity || 1),
    displayModel:
      [modelName, variant].filter(Boolean).join(" ").trim() || line.model || "",
  };
};

const buildPIInvoiceContext = async (piId: string) => {
  const pi = await populatePI(piId);

  if (!pi) {
    return null;
  }

  const latestLC = await getLatestLC(piId);
  const buyer: any = (pi.clientSnapshot || pi.client_id || {}) as any;
  const invoices = await Invoice.find({ piId, active: true })
    .sort({ generatedAt: -1 })
    .select(
      "_id vehicleId type invoiceNumber generatedAt manualFields packingListPdf dataSnapshot",
    )
    .lean();
  const sharedLC = getSharedLCFromInvoices(invoices);

  const vehicles = (pi.vehicleDetails || []).map((line: any, index: number) =>
    normalizeVehicle(pi, line, index),
  );

  const invoiceLookup = invoices.reduce<Record<string, Record<string, any>>>(
    (acc, invoice: any) => {
      const invoiceSummary = {
        _id: invoice._id,
        vehicleId: invoice.vehicleId,
        type: invoice.type,
        invoiceNumber: invoice.invoiceNumber,
        generatedAt: invoice.generatedAt,
        manualFields: invoice.manualFields || {},
        hasPackingList: !!invoice.packingListPdf,
      };

      if (invoice.type === "PACKING_LIST") {
        const selectedVehicleIds = Array.isArray(invoice.dataSnapshot?.vehicles)
          ? invoice.dataSnapshot.vehicles
              .map((vehicle: any) => vehicle?.vehicleId)
              .filter(Boolean)
          : [];

        for (const selectedVehicleId of selectedVehicleIds) {
          if (!acc[selectedVehicleId]) {
            acc[selectedVehicleId] = {};
          }

          acc[selectedVehicleId].PACKING_LIST = {
            ...invoiceSummary,
            vehicleId: selectedVehicleId,
          };
        }
      } else {
        if (!acc[invoice.vehicleId]) {
          acc[invoice.vehicleId] = {};
        }

        acc[invoice.vehicleId][invoice.type] = invoiceSummary;
      }

      return acc;
    },
    {},
  );

  return {
    _id: pi._id,
    piNumber: pi.piNumber,
    piDate: formatDisplayDate(pi.createdAt),
    buyerName: buyer.companyName || buyer.name || "",
    buyerAddress: formatAddress(buyer.address) || buyer.country || "",
    buyerCity: buyer.address?.cityTown || "",
    buyerCountry: buyer.address?.country || buyer.country || "",
    buyerGstin: buyer.gstNumber || buyer.gstin || buyer.gstNo || "",
    lcNumber:
      sharedLC.lcNumber ||
      latestLC?.lcNumber ||
      latestLC?.extractedData?.lcNumber ||
      "",
    lcDate: sharedLC.lcDate || formatDisplayDate(latestLC?.uploadedAt),
    portOfLoading: pi.portOfLoading || "JNPT / Nhava Sheva",
    portOfDischarge: pi.portOfDischarge || "",
    placeOfDelivery:
      pi.destination || buyer.address?.country || buyer.country || "",
    placeOfReceipt: "Narhe, Pune",
    termsOfDelivery: pi.termsOfDelivery || "",
    vehicles: vehicles.map((vehicle) => ({
      ...vehicle,
      invoices: invoiceLookup[vehicle.vehicleId] || {},
    })),
    existingInvoices: invoices.map((invoice: any) => ({
      _id: invoice._id,
      vehicleId: invoice.vehicleId,
      type: invoice.type,
      invoiceNumber: invoice.invoiceNumber,
      generatedAt: invoice.generatedAt,
      manualFields: invoice.manualFields || {},
      hasPackingList: !!invoice.packingListPdf,
    })),
    suggestedInvoiceNumber: await buildInvoiceNumber(),
  };
};

const jsonError = (
  res: Response,
  status: number,
  payload: Record<string, any>,
) => res.status(status).json(payload);

const getMissingFields = (
  type: Exclude<InvoiceDocumentType, "PACKING_LIST">,
  manualFields: Record<string, any>,
) => {
  const common = ["invoiceNumber", "invoiceDate", "lcNumber", "lcDate"];
  const requiredByType: Record<
    Exclude<InvoiceDocumentType, "PACKING_LIST">,
    string[]
  > = {
    INR: ["placeOfSupply", "termsOfPayment", "customExchangeRate"],
    USD: [
      "termsOfDelivery",
      "termsOfPayment",
      "drawbackScheme",
      "rodtepSchemeCode",
      "endUseCode",
    ],
    COMMERCIAL: ["termsOfDelivery", "termsOfPayment"],
  };

  return [...common, ...requiredByType[type]].filter((field) => {
    const value = manualFields?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
};

const buildVehicleDescription = (
  vehicle: any,
  type: InvoiceDocumentType | "PACKING_LIST",
  manualFields?: Record<string, any>,
) => {
  if (type === "COMMERCIAL") {
    const prefix = manualFields?.vehicleDescriptionPrefix?.trim() || "";
    const firstLine = prefix
      ? `01 UNIT OF USED ${prefix}`
      : `01 UNIT OF USED ${[vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ").trim()}`;

    return [
      // `01 UNIT OF USED ${vehicle.make} ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ").trim()}`.trim(),
      firstLine,
      `CHASSIS NO: ${vehicle.chassisNo || "-"}`,
      `ENGINE NO: ${vehicle.engineNo || "-"}`,
      `YEAR OF MANUFACTURE: ${vehicle.yearOfManufacture || "-"}`,
      `MONTH/YEAR OF FIRST REGISTRATION: ${vehicle.monthYearFirstReg || "-"}`,
      `MAKE: ${vehicle.make || "-"}`,
      `MODEL: ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ").trim() || "-"}`,
      "TYPE OF VEHICLE: SUV",
      "COUNTRY OF ORIGIN : INDIA",
      `EXPORT INSPECTION CERTIFICATE NO: ${vehicle.exportInspCertNo || "-"}`,
      `EXPORT INSPECTION CERTIFICATE DATE: ${vehicle.exportInspCertDate || "-"}`,
    ];
  }

  return [
    `${vehicle.model || ""} ${vehicle.variant || ""}`.trim(),
    `EXTERIOR COLOUR: ${vehicle.colour || "-"}`,
    `CHASSIS NO: ${vehicle.chassisNo || "-"}`,
    `ENGINE NO: ${vehicle.engineNo || "-"}`,
    `ENGINE CAPACITY: ${vehicle.engineCapacity || "-"}`,
    `FUEL TYPE: ${vehicle.fuelType || "-"}`,
    "COUNTRY OF ORIGIN: INDIA",
    `HSN CODE: ${vehicle.hsnCode || "-"}`,
    `DBK SR.NO - ${vehicle.dbkSrNo || "-"}`,
  ];
};

const buildTemplateData = ({
  pi,
  vehicle,
  type,
  manualFields,
}: {
  pi: any;
  vehicle: any;
  type: InvoiceDocumentType;
  manualFields: Record<string, any>;
}) => {
  const invoiceDate = formatDisplayDate(manualFields.invoiceDate);
  const totalUSD = Number(vehicle.totalUSD || 0);
  const igstRate = Number(vehicle.igstRate || manualFields.igstRate || 18);
  const exchangeRate = deriveExchangeRate(vehicle, manualFields);
  const { exShowroomINR, igstAmountINR, totalINR } = calculateInrInvoiceAmounts(
    {
      totalUSD,
      exchangeRate,
      igstRate,
    },
  );
  const resolvedHsnCode =
    type === "COMMERCIAL"
      ? vehicle.commercialHsnCode || vehicle.hsnCode || ""
      : vehicle.exportHsnCode || vehicle.hsnCode || "";
  const amountWordsUSD = numberToWordsUSD(totalUSD);
  const amountWordsINR = numberToWordsINR(totalINR);
  const descriptionLines = buildVehicleDescription(
    { ...vehicle, hsnCode: resolvedHsnCode },
    type,
    manualFields,
  );

  const base = {
    exporter: EXPORTER,
    staticText: STATIC_TEXT,
    invoiceNumber: manualFields.invoiceNumber,
    invoiceDate,
    buyerOrderDate: manualFields.buyerOrderDate || "",
    otherReference: manualFields.otherReference || pi.piNumber,
    piNumber: pi.piNumber,
    piDate: pi.piDate,
    buyerName: pi.buyerName,
    buyerAddress: pi.buyerAddress,
    buyerCity: (pi.buyerCity || "").toUpperCase(),
    buyerCountry: pi.buyerCountry,
    lcNumber: manualFields.lcNumber || pi.lcNumber,
    lcDate: formatDisplayDate(manualFields.lcDate || pi.lcDate),
    portOfLoading: pi.portOfLoading || "JNPT / Nhava Sheva",
    portOfDischarge: pi.portOfDischarge,
    placeOfDelivery: pi.placeOfDelivery,
    placeOfReceipt: pi.placeOfReceipt || "Narhe, Pune",
    preCarriage: "Road",
    vesselFlight: "SEA",
    containerNo: manualFields.containerNo || "",
    stateOfOrigin: EXPORTER.stateCode,
    districtOfOrigin: EXPORTER.districtOfOrigin,
    vehicle: { ...vehicle, hsnCode: resolvedHsnCode },
    descriptionLines,
    totalQty: vehicle.quantity || 1,
    remarksUSD: manualFields.termsOfDelivery || "",
    amountWordsUSD,
    amountWordsINR,
    values: {
      totalUSD: formatCurrency(totalUSD, "USD"),
      fobUSD: formatCurrency(Number(vehicle.fobUSD || 0), "USD"),
      freightUSD: formatCurrency(Number(vehicle.freightUSD || 0), "USD"),
      exShowroomINR: formatCurrency(exShowroomINR, "INR"),
      igstAmountINR: formatCurrency(igstAmountINR, "INR"),
      totalINR: formatCurrency(totalINR, "INR"),
      customExchangeRate: exchangeRate ? exchangeRate.toFixed(2) : "",
    },
    scheme: {
      drawbackScheme: manualFields.drawbackScheme || "RODTEP",
      rodtepSchemeCode: manualFields.rodtepSchemeCode || "",
      endUseCode: manualFields.endUseCode || "",
      igstPaymentStatus: "YES",
      shipmentExportUnderIgstPaid: "SHIPMENT EXPORT UNDER IGST PAID",
      placeOfSupply: manualFields.placeOfSupply || EXPORTER.stateCode,
      termsOfDelivery: manualFields.termsOfDelivery || pi.termsOfDelivery || "",
      termsOfPayment: manualFields.termsOfPayment || "",
      typeOfVehicle: manualFields.typeOfVehicle || "SUV",
    },
  };

  const computedFields = {
    totalUSD,
    exShowroomINR,
    igstRate,
    igstAmountINR,
    totalINR,
    amountWordsUSD,
    amountWordsINR,
  };

  return { templateData: base, computedFields };
};

const applyVehicleOverrides = (
  vehicle: Record<string, any>,
  manualFields: Record<string, any>,
) => {
  const merged = { ...vehicle };
  const textFields = [
    "make",
    "model",
    "variant",
    "colour",
    "yearOfManufacture",
    "monthYearFirstReg",
    "hsnCode",
    "commercialHsnCode",
    "exportHsnCode",
    "dbkSrNo",
    "exportInspCertNo",
    "exportInspCertDate",
    "netWeightKg",
    "grossWeightKg",
    "dimensionsCm",
    "typeOfVehicle",
  ];

  for (const field of textFields) {
    if (
      manualFields[field] !== undefined &&
      manualFields[field] !== null &&
      String(manualFields[field]).trim() !== ""
    ) {
      merged[field] = manualFields[field];
    }
  }

  if (
    manualFields.igstRate !== undefined &&
    String(manualFields.igstRate).trim() !== ""
  ) {
    merged.igstRate = Number(manualFields.igstRate || 0);
  }

  return merged;
};

const getTemplateNameForInvoiceType = (
  type: InvoiceDocumentType,
): "inrInvoice" | "usdInvoice" | "commercialInvoice" => {
  switch (type) {
    case "INR":
      return "inrInvoice";
    case "USD":
      return "usdInvoice";
    case "COMMERCIAL":
      return "commercialInvoice";
    default:
      throw new Error(`Unsupported invoice type: ${type}`);
  }
};

const restoreMissingPdfBuffers = async (invoice: any) => {
  const templateData = invoice?.dataSnapshot?.templateData;

  if (!templateData) {
    return invoice;
  }

  let changed = false;

  if (
    invoice.type !== "PACKING_LIST" &&
    (!invoice.invoicePdf || invoice.invoicePdf.length === 0)
  ) {
    invoice.invoicePdf = await renderInvoicePDF({
      templateName: getTemplateNameForInvoiceType(invoice.type),
      data: templateData,
      invoiceNumber: invoice.invoiceNumber,
    });
    changed = true;
  }

  if (
    invoice.type === "PACKING_LIST" &&
    (!invoice.packingListPdf || invoice.packingListPdf.length === 0)
  ) {
    invoice.packingListPdf = await renderInvoicePDF({
      templateName: "packingList",
      data: templateData,
      invoiceNumber: invoice.invoiceNumber,
    });
    changed = true;
  }

  if (changed) {
    await invoice.save();
  }

  return invoice;
};

export const getPIInvoiceContext = async (req: Request, res: Response) => {
  try {
    const piId = asParamString(req.params.piId);

    if (!isValidObjectId(piId)) {
      return jsonError(res, 404, {
        error: "PI_NOT_FOUND",
        message: "PI not found",
      });
    }

    const context = await buildPIInvoiceContext(piId);

    if (!context) {
      return jsonError(res, 404, {
        error: "PI_NOT_FOUND",
        message: "PI not found",
      });
    }

    return res.json(context);
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "INVOICE_CONTEXT_FAILED",
      message: "Failed to load invoice context",
      detail: error.message,
    });
  }
};

export const getInvoicesByPI = async (req: Request, res: Response) => {
  try {
    const piId = asParamString(req.params.piId);

    if (!isValidObjectId(piId)) {
      return jsonError(res, 404, {
        error: "PI_NOT_FOUND",
        message: "PI not found",
      });
    }

    const invoices = await Invoice.find({ piId, active: true })
      .sort({ generatedAt: -1 })
      .select("_id vehicleId type invoiceNumber generatedAt packingListPdf")
      .lean();

    return res.json(
      invoices.map((invoice: any) => ({
        _id: invoice._id,
        vehicleId: invoice.vehicleId,
        type: invoice.type,
        invoiceNumber: invoice.invoiceNumber,
        generatedAt: invoice.generatedAt,
        hasPackingList: !!invoice.packingListPdf,
      })),
    );
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "INVOICE_LIST_FAILED",
      message: "Failed to load invoices",
      detail: error.message,
    });
  }
};

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const {
      piId,
      vehicleId,
      type,
      manualFields = {},
      replaceExisting = false,
    }: {
      piId: string;
      vehicleId: string;
      type: Exclude<InvoiceDocumentType, "PACKING_LIST">;
      manualFields: Record<string, any>;
      replaceExisting?: boolean;
    } = req.body || {};

    if (!piId || !vehicleId || !type) {
      return jsonError(res, 400, {
        error: "MISSING_FIELDS",
        fields: ["piId", "vehicleId", "type"].filter(
          (field) => !req.body?.[field],
        ),
      });
    }

    if (!["INR", "USD", "COMMERCIAL"].includes(type)) {
      return jsonError(res, 400, {
        error: "INVALID_INVOICE_TYPE",
        message: "Invoice type is invalid",
      });
    }

    const context = await buildPIInvoiceContext(piId);

    if (!context) {
      return jsonError(res, 404, {
        error: "PI_NOT_FOUND",
        message: "PI not found",
      });
    }

    const vehicle = context.vehicles.find(
      (item: any) => item.vehicleId === vehicleId,
    );

    if (!vehicle) {
      return jsonError(res, 400, {
        error: "VEHICLE_NOT_IN_PI",
        message: "Selected vehicle does not belong to this PI",
      });
    }

    const resolvedInvoiceNumber = resolveInvoiceNumber({
      manualFields,
      vehicles: [vehicle],
      fallbackInvoiceNumber: context.suggestedInvoiceNumber,
    });
    const resolvedManualFields: Record<string, any> = {
      ...manualFields,
      invoiceNumber: resolvedInvoiceNumber,
    };

    if (
      resolvedManualFields.lcSharedConfirmed !== true &&
      resolvedManualFields.lcSharedConfirmed !== "true"
    ) {
      return jsonError(res, 400, {
        error: "LC_CONFIRMATION_REQUIRED",
        message:
          "Confirm that the LC number and date are same for all invoices before generating PDF",
        fields: ["lcSharedConfirmed"],
      });
    }

    const missingFields = getMissingFields(type, resolvedManualFields);

    if (missingFields.length > 0) {
      return jsonError(res, 400, {
        error: "MISSING_FIELDS",
        fields: missingFields,
      });
    }

    const existingInvoice = await Invoice.findOne({
      piId,
      vehicleId,
      type,
      active: true,
    });

    if (existingInvoice && !replaceExisting) {
      return jsonError(res, 409, {
        error: "INVOICE_EXISTS",
        existingInvoiceId: existingInvoice._id,
        message: "Invoice already exists for this vehicle and type",
      });
    }

    const resolvedVehicle = applyVehicleOverrides(vehicle, resolvedManualFields);

    const { templateData, computedFields } = buildTemplateData({
      pi: context,
      vehicle: resolvedVehicle,
      type,
      manualFields: resolvedManualFields,
    });

    const sanitizedInvoiceNumber = sanitizeFileName(
      resolvedManualFields.invoiceNumber,
    );

    let invoicePdfBuffer: Buffer;

    if (type === "INR") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "inrInvoice",
        data: templateData,
        invoiceNumber: resolvedManualFields.invoiceNumber,
      });
    } else if (type === "USD") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "usdInvoice",
        data: templateData,
        invoiceNumber: resolvedManualFields.invoiceNumber,
      });
    } else if (type === "COMMERCIAL") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "commercialInvoice",
        data: templateData,
        invoiceNumber: resolvedManualFields.invoiceNumber,
      });
    } else {
      throw new Error("Invalid invoice type");
    }

    const payload = {
      piId,
      vehicleId,
      vehicleLineIndex: resolvedVehicle.vehicleLineIndex,
      vehicleBookingId: resolvedVehicle.vehicleBookingId || null,
      type,
      invoiceNumber: resolvedManualFields.invoiceNumber,
      invoiceDate: new Date(resolvedManualFields.invoiceDate),
      containerNo: resolvedManualFields.containerNo || "",
      manualFields: resolvedManualFields,
      computedFields,
      invoicePdf: invoicePdfBuffer,
      packingListPdf: null,
      generatedAt: new Date(),
      active: true,
      dataSnapshot: {
        pi: context,
        vehicle: resolvedVehicle,
        templateData,
      },
    };

    let invoiceRecord: any;

    if (existingInvoice) {
      existingInvoice.set(payload);
      invoiceRecord = await existingInvoice.save();
    } else {
      invoiceRecord = await Invoice.create(payload);
    }

    return res.json({
      success: true,
      invoiceId: invoiceRecord._id,
      invoiceNumber: invoiceRecord.invoiceNumber,
      downloadUrl: `/api/v1/invoices/${invoiceRecord._id}/download`,
    });
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "PDF_GENERATION_FAILED",
      message: "Failed to generate invoice PDF",
      detail: error.message,
    });
  }
};

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return jsonError(res, 404, {
        error: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
      });
    }

    await restoreMissingPdfBuffers(invoice);

    if (!invoice.invoicePdf || invoice.invoicePdf.length === 0) {
      return jsonError(res, 404, {
        error: "PDF_NOT_FOUND",
        message: "Invoice PDF not found and could not be restored",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader(
      "Content-Disposition",
      `${req.query.download === "true" ? "attachment" : "inline"}; filename="${sanitizeFileName(invoice.invoiceNumber)}.pdf"`,
    );

    return res.send(invoice.invoicePdf);
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "DOWNLOAD_FAILED",
      message: "Failed to stream invoice",
      detail: error.message,
    });
  }
};

export const downloadPackingList = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return jsonError(res, 404, {
        error: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
      });
    }

    await restoreMissingPdfBuffers(invoice);

    if (!invoice.packingListPdf || invoice.packingListPdf.length === 0) {
      return jsonError(res, 404, {
        error: "PACKING_LIST_NOT_FOUND",
        message:
          "Packing list is not available for this invoice and could not be restored",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader(
      "Content-Disposition",
      `${req.query.download === "true" ? "attachment" : "inline"}; filename="${sanitizeFileName(invoice.invoiceNumber)}-packing.pdf"`,
    );

    return res.send(invoice.packingListPdf);
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "DOWNLOAD_FAILED",
      message: "Failed to stream packing list",
      detail: error.message,
    });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return jsonError(res, 404, {
        error: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
      });
    }

    invoice.active = false;
    await invoice.save();

    return res.json({ success: true });
  } catch (error: any) {
    return jsonError(res, 500, {
      error: "DELETE_FAILED",
      message: "Failed to delete invoice",
      detail: error.message,
    });
  }
};

export const generatePackingList = async (req: Request, res: Response) => {
  try {
    const {
      piId,
      vehicleIds = [],
      manualFields = {},
      replaceExisting = false,
    } = req.body;

    if (!piId || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return jsonError(res, 400, {
        error: "MISSING_FIELDS",
        message: "piId and at least one vehicleId are required",
      });
    }

    const context = await buildPIInvoiceContext(piId);
    if (!context) {
      return jsonError(res, 404, { message: "PI not found" });
    }

    const selectedVehicles = context.vehicles.filter((v: any) =>
      vehicleIds.includes(v.vehicleId),
    );

    if (selectedVehicles.length === 0) {
      return jsonError(res, 400, { message: "No valid vehicles selected" });
    }

    const baseVehicle = selectedVehicles[0];
    const invoiceNumber = resolveInvoiceNumber({
      manualFields,
      vehicles: selectedVehicles,
      fallbackInvoiceNumber: context.suggestedInvoiceNumber,
    });
    const resolvedManualFields: Record<string, any> = {
      ...manualFields,
      invoiceNumber,
    };

    const { templateData } = buildTemplateData({
      pi: context,
      vehicle: baseVehicle,
      type: "USD",
      manualFields: resolvedManualFields,
    });

    (templateData as any).selectedVehicles = selectedVehicles;
    (templateData as any).totalVehicles = selectedVehicles.length;

    const packingListPdfBuffer = await renderInvoicePDF({
      templateName: "packingList",
      data: templateData,
      invoiceNumber,
    });

    const payload = {
      piId,
      vehicleId: "MULTI",
      vehicleLineIndex: -1,
      type: "PACKING_LIST",
      invoiceNumber,
      invoiceDate: new Date(resolvedManualFields.invoiceDate || Date.now()),
      manualFields: resolvedManualFields,
      invoicePdf: Buffer.from([]), // Empty buffer is now allowed
      packingListPdf: packingListPdfBuffer,
      generatedAt: new Date(),
      active: true,
      dataSnapshot: {
        pi: context,
        vehicles: selectedVehicles,
      },
    };

    let record: any;

    if (replaceExisting) {
      record = await Invoice.findOneAndUpdate(
        { piId, type: "PACKING_LIST", active: true },
        payload,
        { new: true, upsert: true },
      );
    } else {
      record = await Invoice.create(payload);
    }

    return res.json({
      success: true,
      invoiceId: record._id,
      invoiceNumber: record.invoiceNumber,
      packingListUrl: `/api/v1/invoices/${record._id}/download-packing`,
    });
  } catch (error: any) {
    console.error("Packing List Error:", error);
    return jsonError(res, 500, {
      error: "PACKING_LIST_FAILED",
      message: "Failed to generate packing list",
      detail: error.message,
    });
  }
};
