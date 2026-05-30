import { Request, Response } from "express";
import { generateProformaInvoicePDF } from "../services/pdf.service";
import { getPIByIdService } from "../services/proforma-invoice.service";
import { preparePIDataForService } from "../utils/pi-pdf-helper";

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

const formatAddress = (addr: any) => {
  if (!addr) return "-";
  // Handle legacy string addresses
  if (typeof addr === "string") return addr;

  // Handle new address object
  const addressParts = [
    addr.houseBuilding,
    addr.streetArea,
    addr.cityTown,
    [addr.state, addr.pincode].filter(Boolean).join(" - "),
    addr.country,
  ].filter(Boolean);
  return addressParts.join("\n");
};

const preparePIData = (pi: any) => {
  const clientForPdf: any = pi.clientSnapshot || pi.client_id;
  const companyForPdf: any = pi.companySnapshot || pi.company_id;

  let totalQty = 0;
  const items = pi.vehicleDetails.map((v: any, index: number) => {
    totalQty += v.quantity;
    const unitPrice = (Number(v.fob) || 0) + (Number(v.freight) || 0);
    return {
      slNo: index + 1,
      description: v.model || "N/A",
      qty: v.quantity,
      rate: unitPrice.toFixed(2),
      per: "No",
      amount: (v.quantity * unitPrice).toFixed(2),
      specs: {
        color: v.color,
        chassisNo: v.chassisNo,
        engineNo: v.engineNo,
        yom: v.yom,
        fuelType: v.fuelType,
        countryOfOrigin: v.countryOfOrigin,
        engineCapacity: v.engineCapacity ? `${v.engineCapacity}cc` : undefined,
        hsn: v.hsn,
        fob: (Number(v.fob) || 0).toFixed(2),
        freight: (Number(v.freight) || 0).toFixed(2),
      },
    };
  });

  return {
    piId: pi._id,
    invoiceNumber: pi.piNumber,
    orderId:
      typeof pi.order_id === "object" ? pi.order_id?.orderId : pi.order_id,
    date: pi.validityDate
      ? formatDate(pi.validityDate)
      : formatDate(pi.createdAt),
    paymentTerms: pi.paymentTerms || "As agreed",
    termsOfDelivery: pi.termsOfDelivery || " ",
    incoterm: pi.incoterm || " ",
    portOfLoading: pi.portOfLoading || "N/A",
    portOfDischarge: pi.portOfDischarge || "N/A",
    buyersRef: pi.buyersRef || " ",
    otherRef: pi.otherRef || " ",
    exporter: {
      name: companyForPdf?.name || "N/A",
      address: formatAddress(companyForPdf?.address) || "N/A",
      gstin: companyForPdf?.gstNumber || "N/A",
      state: companyForPdf?.address?.state || "N/A",
      stateCode: companyForPdf?.address?.pincode || "N/A",
    },
    buyer: {
      name: clientForPdf?.companyName || clientForPdf?.name || " ",
      address:
        formatAddress(clientForPdf?.address) || clientForPdf?.country || "",
      state: clientForPdf?.address?.state || " ",
      clientCode: clientForPdf?.clientCode || "",
    },
    consignee: {
      name: clientForPdf?.companyName || clientForPdf?.name || " ",
      address:
        formatAddress(clientForPdf?.address) || clientForPdf?.country || "",
      state: clientForPdf?.address?.state || " ",
    },
    dispatchedThrough: pi.dispatchedThrough || " ",
    destination: pi.destination || clientForPdf?.country || " ",
    items,
    totalQty,
    totalAmount: pi.totalAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    currency: pi.currency || "USD",
    amountInWords: pi.amountInWords || "N/A",
    bankDetails: companyForPdf?.bankDetails || {
      bankName: "N/A",
      accountNo: "N/A",
      branchIfsc: "N/A",
    },
    status: pi.status,
  };
};

// --- endpoint for getting pdf data ---
export const getProformaInvoiceData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }

    const pi = await getPIByIdService(id as string);

    if (!pi) {
      return res.status(404).json({ success: false, message: "PI not found" });
    }

    const formattedData = preparePIDataForService(pi);
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching PI Data:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch PI data" });
  }
};

export const downloadProformaInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pi = await getPIByIdService(id as string);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${req.query.download === "true" ? "attachment" : "inline"}; filename="${pi.piNumber}.pdf"`,
    );

    const invoiceData = preparePIDataForService(pi);

    const pdfBuffer = await generateProformaInvoicePDF(invoiceData);
    res.end(pdfBuffer);
  } catch (error) {
    res.status(500).send("Error generating PDF");
  }
};

// export const downloadProformaInvoice = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const pi = await getPIByIdService(id as string);

//     if (!pi) return res.status(404).json({ message: "PI not found" });

//     // 1. Check if a physical file path exists in DB and on Disk
//     if (pi.pdfPath) {
//       const absolutePath = path.join(process.cwd(), pi.pdfPath);

//       if (fs.existsSync(absolutePath)) {
//         const isDownload = req.query.download === "true";

//         res.setHeader("Content-Type", "application/pdf");
//         if (isDownload) {
//           res.setHeader(
//             "Content-Disposition",
//             `attachment; filename="${pi.piNumber}.pdf"`,
//           );
//         } else {
//           res.setHeader("Content-Disposition", "inline");
//         }

//         return res.sendFile(absolutePath);
//       }
//     }

//     const invoiceData = preparePIData(pi);
//     const pdfBuffer = await generateProformaInvoicePDF(invoiceData);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "inline");
//     res.end(pdfBuffer);
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to generate PDF" });
//   }
// };
