import { Request, Response } from "express";
import { generateProformaInvoicePDF } from "../services/pdf.service";
import { getPIByIdService } from "../services/proforma-invoice.service";

const formatDate = (dateString: string | Date) => {
  const d = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate().toString().padStart(2, "0")}-${
    months[d.getMonth()]
  }-${d.getFullYear()}`;
};

export const downloadProformaInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "PI ID is required" });
      return;
    }

    // 1. Fetch PI from database
    const pi = await getPIByIdService(id as string);
    const client: any = pi.client_id;
    const dealer: any = pi.dealer_id;

    // 2. Map vehicle items to HBS template format
    let totalQty = 0;
    const items = pi.vehicleDetails.map((v: any, index: number) => {
      totalQty += v.quantity;
      return {
        slNo: index + 1,
        description: v.model || "Vehicle",
        hsn: v.hsn || "-",
        qty: v.quantity,
        rate: v.unitPrice.toFixed(2),
        per: "Unit",
        amount: (v.quantity * v.unitPrice).toFixed(2),
        specs: {
          color: v.color,
          chassisNo: v.chassisNo,
          engineNo: v.engineNo,
          yom: v.yom,
          fob: v.fob,
          freight: v.freight,
        },
      };
    });

    // 3. Construct the payload matching proforma-invoice.hbs exactly
    const invoiceData = {
      invoiceNumber: pi.piNumber,
      date: pi.validityDate
        ? formatDate(pi.validityDate)
        : formatDate(pi.createdAt),
      modeOfPayment: pi.paymentTerms || "As agreed",
      buyersRef: "-",
      otherRef: "-",
      exporter: {
        name: pi.dealerDetails?.name || dealer?.name || "Your Company Name",
        address:
          pi.dealerDetails?.address ||
          dealer?.address ||
          "Your Company Address",
        gstin: pi.dealerDetails?.gstin || dealer?.gstNumber || "-",
        state: pi.dealerDetails?.state || "-",
        stateCode: pi.dealerDetails?.stateCode || "-",
      },
      buyer: {
        name:
          pi.clientDetails?.companyName ||
          pi.clientDetails?.name ||
          client?.companyName ||
          client?.name ||
          "-",
        address:
          pi.clientDetails?.address ||
          client?.address ||
          client?.country ||
          "-",
        state: pi.clientDetails?.state || "-",
      },
      consignee: {
        name:
          pi.clientDetails?.companyName ||
          pi.clientDetails?.name ||
          client?.companyName ||
          client?.name ||
          "-",
        address:
          pi.clientDetails?.address ||
          client?.address ||
          client?.country ||
          "-",
        state: pi.clientDetails?.state || "-",
      },
      dispatchedThrough: "-",
      destination: client?.country || "-",
      incoterm: "-",
      portOfLoading: "-",
      portOfDischarge: "-",
      items,
      totalQty,
      totalAmount: pi.totalAmount.toFixed(2),
      amountInWords: `USD ${pi.totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Only`,
      bankDetails: pi.bankDetails || {
        bankName: "-",
        accountNo: "-",
        branchIfsc: "-",
      },
    };

    const pdfBuffer = await generateProformaInvoicePDF(invoiceData);

    // Ensure headers are exposed for CORS so the frontend can read the filename
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pi.piNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());

    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
