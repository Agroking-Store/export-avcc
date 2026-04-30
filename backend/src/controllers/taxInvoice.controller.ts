import { Request, Response } from "express";
import TaxInvoice from "../models/taxInvoice.model";
import ProformaInvoice from "../models/ProformaInvoice.model";
import { generateTaxInvoicePDF } from "../services/taxInvoicePdf.service";

const numberToWords = (
  num: number
): string => {
  if (num === 0)
    return "ZERO ONLY";

  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];

  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  const convert = (
    n: number
  ): string => {
    if (n < 20)
      return ones[n];

    if (n < 100)
      return (
        tens[
          Math.floor(n / 10)
        ] +
        (n % 10
          ? " " +
            ones[n % 10]
          : "")
      );

    if (n < 1000)
      return (
        ones[
          Math.floor(
            n / 100
          )
        ] +
        " HUNDRED " +
        (n % 100
          ? " " +
            convert(
              n % 100
            )
          : "")
      );

    if (n < 100000)
      return (
        convert(
          Math.floor(
            n / 1000
          )
        ) +
        " THOUSAND " +
        convert(
          n % 1000
        )
      );

    return "";
  };

  return (
    convert(
      Math.floor(num)
    ).trim() + " ONLY"
  );
};

/* ---------------- CREATE ---------------- */
export const createTaxInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const invoice = await TaxInvoice.create(
      req.body
    );

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create Tax Invoice",
    });
  }
};

/* ---------------- GET ---------------- */
export const getTaxInvoiceById = async (
  req: Request,
  res: Response
) => {
  try {
    const invoice =
      await TaxInvoice.findById(
        req.params.id
      );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message:
          "Tax Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

/* ---------------- PREPARE DATA ---------------- */
const prepareTaxData = (
  tax: any,
  pi: any
) => {
  const exporter =
    pi.companySnapshot ||
    pi.company_id;

  const buyer =
    pi.clientSnapshot ||
    pi.client_id;

  const items = (pi.vehicleDetails || []).map(
  (v: any, index: number) => {
    const rate =
      Number(v.fob || 0) +
      Number(v.freight || 0);

    const qty = Number(v.quantity || 0);

    return {
          sr: index + 1,
    
          model: v.model || "",
          make: v.make || "",
    
          chassisNo: v.chassisNo || "",
          engineNo: v.engineNo || "",
    
          year: v.year || v.yom || "",
          registrationDate: v.registrationDate || "",
    
          vehicleType: v.vehicleType || "",
          countryOrigin: v.countryOfOrigin || "INDIA",
    
          inspectionNo: v.inspectionNo || "",
          inspectionDate: v.inspectionDate || "",
    
          color: v.color || "",
          hsn: v.hsn || "87032291",
    
          fob: Number(v.fob || 0).toFixed(2),
          freight: Number(v.freight || 0).toFixed(2),
    
          per: "No",
          amount: (qty * rate).toFixed(2),
        };
      }
    );

  return {
    /* HEADER */
    invoiceNo:
      tax.taxInvoiceNo,
    invoiceDate:
      tax.invoiceDate,
    piNo:
      pi.piNumber,
    piDate:
      tax.piDate,

    buyerOrderDate:
      tax.buyerOrderDate,
    otherReference:
      tax.otherReference,

    /* PARTY */
    exporter,
    buyer,

    /* SHIPPING */
    preCarriage:
      tax.preCarriage,
    placeReceipt:
      tax.placeReceipt,
    vesselFlight:
      tax.vesselFlight,

    portOfLoading:
      tax.portOfLoading,
    portOfDischarge:
      tax.portOfDischarge,
    placeDelivery:
      tax.placeDelivery,

    countryOrigin:
      tax.countryOrigin ||
      "INDIA",

    countryDestination:
      tax.countryDestination,

    shipmentMode:
      tax.shipmentMode ||
      "BY SEA",

    totalCartons:
      tax.totalCartons || 1,

    termsOfDelivery:
      tax.termsOfDelivery,

    stateOfOrigin:
      tax.stateOfOrigin,

    districtOfOrigin:
      tax.districtOfOrigin,

    /* BENEFITS */
    drawbackShipment:
      tax.drawbackShipment,

    rodtepSchemeCode:
      tax.rodtepSchemeCode,

    endUseCode:
      tax.endUseCode,

    igstPaymentStatus:
      tax.igstPaymentStatus,

    shipmentExportUnderIgst:
      tax.shipmentExportUnderIgst,

    adCode:
      tax.adCode,

    /* GOODS */
    items,

    netWeight:
      tax.netWeight || "",
    grossWeight:
      tax.grossWeight || "",

    remarks:
      tax.remarks || "",

    /* TOTALS */
    subtotal:
      Number(
        tax.subtotal || 0
      ).toFixed(2),

    gstPercent:
      tax.gstPercent,

    gstAmount:
      Number(
        tax.gstAmount || 0
      ).toFixed(2),

    grandTotal:
      Number(
        tax.grandTotal || 0
      ).toFixed(2),

    amountWords:
      numberToWords(
        Number(
          tax.grandTotal || 0
        )
      ),

    /* BANK */
    bankName:
      tax.bankName,
    accountNo:
      tax.accountNo,
    ifsc:
      tax.ifsc,
    swiftCode:
      tax.swiftCode,
  };
};

/* ---------------- PDF ---------------- */
export const downloadTaxInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const tax =
      await TaxInvoice.findById(
        req.params.id
      );

    if (!tax) {
      return res.status(404).json({
        message:
          "Tax Invoice not found",
      });
    }

    const pi: any =
      await ProformaInvoice.findById(
        tax.piId
      )
        .populate(
          "client_id"
        )
        .populate(
          "company_id"
        );

    if (!pi) {
      return res.status(404).json({
        message:
          "Linked PI not found",
      });
    }

    const data =
      prepareTaxData(
        tax,
        pi
      );

    const pdf =
      await generateTaxInvoicePDF(
        data
      );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename=${tax.taxInvoiceNo}.pdf`
    );

    res.end(pdf);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate PDF",
    });
  }
};