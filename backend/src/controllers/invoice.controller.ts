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
  MEIS:
    "We intend to claim rewards under Merchandise Exports From India Scheme (MEIS) RoDTEP Scheme",
  GSP_ORIGIN:
    "The Exporter ANANYATA TRADELINK LLP, Flat No 50, S No 27/4-27/5, Building No 7, Hingane Khurd, Parvati, Pune - 411009, Maharashtra, India declares that, except where otherwise clearly indicated, these products are of Indian preferential origin according to rules of origin of the generalized system of preferences of the European Union and that the origin criterion met is 'P'.",
  DECLARATION:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  ACCESSORIES:
    "WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE HAVE THE FOLLOWING ACCESSORIES INSTALLED: A) AUTOMATIC TRANSMISSION B) ANTI-LOCK BRAKING SYSTEM C) DRIVER & FRONT PASSENGER HAVE STANDARD AIRBAGS D) DRIVER & FRONT PASSENGER HAVE THREE POINT SEAT BELT & OTHER PASSENGERS HAVE MINIMUM TWO POINT SEAT BELT WHERE APPLICABLE.",
  AGE_CERT:
    "WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE ARE NOT MORE THAN 3 YEARS OLD AT THE TIME OF SHIPMENT.",
};



const isValidObjectId = (value: string) => mongoose.Types.ObjectId.isValid(value);

const pad = (value: number) => String(value).padStart(2, "0");

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) {
    return "";
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
    address.country,
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

const sanitizeFileName = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

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

const getLatestLC = async (piId: string) =>
  LetterOfCredit.findOne({ pi_id: piId }).sort({ uploadedAt: -1 }).lean();

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const populatePI = async (piId: string) => {
  const pi = await ProformaInvoice.findById(piId)
    .populate({
      path: "vehicleBookingIds",
      populate: [
        {
          path: "vehicleId",
          select: "brandName modelName variant color hsnCode fobAmount freight",
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
  const modelName = vehicleRef?.modelName || orderVehicle?.modelName || line.model || "";
  const variant =
    vehicleRef?.variant ||
    orderVehicle?.variant ||
    line.variant ||
    deriveVariantFromLine({
      make,
      modelName,
      lineModel: line.model || "",
    });
  const colour = line.color || vehicleRef?.color || orderVehicle?.color || "";
  const hsnCode = line.hsn || booking?.hsnCode || vehicleRef?.hsnCode || orderVehicle?.hsnCode || "";
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
    vehicleLineIndex: index,
    vehicleBookingId: booking?._id?.toString?.() || "",
    sourceVehicleId: line.vehicle_id?.toString?.() || vehicleRef?._id?.toString?.() || "",
    make,
    model: modelName,
    variant,
    colour,
    chassisNo: line.chassisNo || booking?.chassisNumber || "",
    engineNo: line.engineNo || booking?.engineNumber || "",
    engineCapacity: line.engineCapacity || booking?.engineCapacity || "",
    fuelType: line.fuelType || booking?.fuelType || "",
    yearOfManufacture: line.yom || booking?.yom || "",
    monthYearFirstReg: formatMonthYearRegistration(
      line.monthYearFirstReg || booking?.deliveryDate || "",
    ),
    hsnCode,
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
    displayModel: [modelName, variant].filter(Boolean).join(" ").trim() || line.model || "",
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
    .lean();

  const vehicles = (pi.vehicleDetails || []).map((line: any, index: number) =>
    normalizeVehicle(pi, line, index),
  );

  const invoiceLookup = invoices.reduce<Record<string, Record<string, any>>>(
    (acc, invoice: any) => {
      if (!acc[invoice.vehicleId]) {
        acc[invoice.vehicleId] = {};
      }

      acc[invoice.vehicleId][invoice.type] = invoice;

      if (invoice.packingListPdf) {
        acc[invoice.vehicleId].PACKING_LIST = {
          ...invoice,
          type: "PACKING_LIST",
        };
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
    buyerCountry: buyer.address?.country || buyer.country || "",
    lcNumber: latestLC?.lcNumber || latestLC?.extractedData?.lcNumber || "",
    lcDate: formatDisplayDate(latestLC?.uploadedAt),
    portOfLoading: pi.portOfLoading || "JNPT / Nhava Sheva",
    portOfDischarge: pi.portOfDischarge || "",
    placeOfDelivery: pi.destination || buyer.address?.country || buyer.country || "",
    placeOfReceipt: "Narhe, Pune",
    termsOfDelivery: pi.termsOfDelivery || "",
    vehicles: vehicles.map((vehicle) => ({
      ...vehicle,
      invoices: invoiceLookup[vehicle.vehicleId] || {},
    })),
    existingInvoices: invoices,
    suggestedInvoiceNumber: await buildInvoiceNumber(),
  };
};

const jsonError = (
  res: Response,
  status: number,
  payload: Record<string, any>,
) => res.status(status).json(payload);

const getMissingFields = (
  type: InvoiceDocumentType,
  manualFields: Record<string, any>,
) => {
  const common = ["invoiceNumber", "invoiceDate"];
  const requiredByType: Record<InvoiceDocumentType, string[]> = {
    INR: ["placeOfSupply", "termsOfPayment", "customExchangeRate"],
    USD: ["termsOfDelivery", "termsOfPayment", "drawbackScheme", "rodtepSchemeCode", "endUseCode"],
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
) => {
  if (type === "COMMERCIAL") {
    return [
      `01 UNIT OF USED ${vehicle.make} ${[vehicle.model, vehicle.variant].filter(Boolean).join(" ").trim()}`.trim(),
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
  const exShowroomINR = Number(vehicle.exShowroomINR || manualFields.exShowroomINR || 0);
  const igstRate = Number(vehicle.igstRate || manualFields.igstRate || 18);
  const igstAmountINR = Number(((exShowroomINR * igstRate) / 100).toFixed(2));
  const totalINR = Number((exShowroomINR + igstAmountINR).toFixed(2));
  const amountWordsUSD = numberToWordsUSD(totalUSD);
  const amountWordsINR = numberToWordsINR(totalINR);
  const descriptionLines = buildVehicleDescription(vehicle, type);

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
    buyerCountry: pi.buyerCountry,
    lcNumber: pi.lcNumber,
    lcDate: pi.lcDate,
    portOfLoading: pi.portOfLoading || "JNPT / Nhava Sheva",
    portOfDischarge: pi.portOfDischarge,
    placeOfDelivery: pi.placeOfDelivery,
    placeOfReceipt: pi.placeOfReceipt || "Narhe, Pune",
    preCarriage: "Road",
    vesselFlight: "SEA",
    containerNo: manualFields.containerNo || "",
    stateOfOrigin: EXPORTER.stateCode,
    districtOfOrigin: EXPORTER.districtOfOrigin,
    vehicle,
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
      customExchangeRate: manualFields.customExchangeRate || "92.55",
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
    "engineCapacity",
    "fuelType",
    "yearOfManufacture",
    "monthYearFirstReg",
    "hsnCode",
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
    manualFields.exShowroomINR !== undefined &&
    String(manualFields.exShowroomINR).trim() !== ""
  ) {
    merged.exShowroomINR = Number(manualFields.exShowroomINR || 0);
  }

  if (
    manualFields.igstRate !== undefined &&
    String(manualFields.igstRate).trim() !== ""
  ) {
    merged.igstRate = Number(manualFields.igstRate || 0);
  }

  return merged;
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
      type: InvoiceDocumentType;
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

    const missingFields = getMissingFields(type, manualFields);

    if (missingFields.length > 0) {
      return jsonError(res, 400, {
        error: "MISSING_FIELDS",
        fields: missingFields,
      });
    }

    const context = await buildPIInvoiceContext(piId);

    if (!context) {
      return jsonError(res, 404, {
        error: "PI_NOT_FOUND",
        message: "PI not found",
      });
    }

    const vehicle = context.vehicles.find((item: any) => item.vehicleId === vehicleId);

    if (!vehicle) {
      return jsonError(res, 400, {
        error: "VEHICLE_NOT_IN_PI",
        message: "Selected vehicle does not belong to this PI",
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

    const resolvedVehicle = applyVehicleOverrides(vehicle, manualFields);

    const { templateData, computedFields } = buildTemplateData({
      pi: context,
      vehicle: resolvedVehicle,
      type,
      manualFields,
    });

    const sanitizedInvoiceNumber = sanitizeFileName(manualFields.invoiceNumber);

    let invoicePdfBuffer: Buffer;
    let packingListPdfBuffer: Buffer | undefined;

    if (type === "INR") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "inrInvoice",
        data: templateData,
        invoiceNumber: manualFields.invoiceNumber,
      });
    } else if (type === "USD") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "usdInvoice",
        data: templateData,
        invoiceNumber: manualFields.invoiceNumber,
      });
      packingListPdfBuffer = await renderInvoicePDF({
        templateName: "packingList",
        data: templateData,
        invoiceNumber: manualFields.invoiceNumber,
      });
    } else if (type === "COMMERCIAL") {
      invoicePdfBuffer = await renderInvoicePDF({
        templateName: "commercialInvoice",
        data: templateData,
        invoiceNumber: manualFields.invoiceNumber,
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
      invoiceNumber: manualFields.invoiceNumber,
      invoiceDate: new Date(manualFields.invoiceDate),
      containerNo: manualFields.containerNo || "",
      manualFields,
      computedFields,
      invoicePdf: invoicePdfBuffer,
      packingListPdf: packingListPdfBuffer,
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
      downloadUrl: `/api/v1/invoices/${invoiceRecord._id}/download`,
      packingListUrl:
        type === "USD"
          ? `/api/v1/invoices/${invoiceRecord._id}/download-packing`
          : undefined,
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
    const invoice = await Invoice.findById(req.params.invoiceId).lean();

    if (!invoice) {
      return jsonError(res, 404, {
        error: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
      });
    }

    if (!invoice.invoicePdf || invoice.invoicePdf.length === 0) {
      return jsonError(res, 404, {
        error: "PDF_NOT_FOUND",
        message: "Invoice PDF not found",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFileName(invoice.invoiceNumber)}.pdf"`,
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
    const invoice = await Invoice.findById(req.params.invoiceId).lean();

    if (!invoice) {
      return jsonError(res, 404, {
        error: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
      });
    }

    if (!invoice.packingListPdf || invoice.packingListPdf.length === 0) {
      return jsonError(res, 404, {
        error: "PACKING_LIST_NOT_FOUND",
        message: "Packing list is not available for this invoice",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFileName(invoice.invoiceNumber)}-packing.pdf"`,
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
