import { Types } from "mongoose";
import { Request, Response } from "express";
import {
  createPIService,
  getPIsService,
  getPIByIdService,
  updatePIService,
  getSuggestedNextPiNumberService, // Import the new service
  getOrdersWithPIStatusService,
  updatePIStatusService,
  getPIDashboardOverviewService,
  getDashboardKPIsService,
  getPIStatusDistributionService,
  getMonthlyPIValueTrendService,
  getTopClientsByPIValueService,
  getOrderDetailWithTrackingService,
  getBookedVehicleOrdersService,
} from "../services/proforma-invoice.service";

import LetterOfCredit from "../models/LetterOfCredit.model";
import ProformaInvoice from "../models/ProformaInvoice.model";
import { Company } from "../models/Company.model";

import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import puppeteer from "puppeteer";

// CREATE PI
export const createPI = async (req: Request, res: Response) => {
  try {
    const pi = await createPIService(req.body);

    res.status(201).json(pi);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// GET Order Details with PI Tracking
export const getOrderDetailWithTracking = async (
  req: Request,
  res: Response,
) => {
  try {
    const { orderId } = req.params;
    const orderDetails = await getOrderDetailWithTrackingService(
      orderId as string,
    );
    res.status(200).json(orderDetails);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// GET SUGGESTED NEXT PI NUMBER
export const getSuggestedNextPiNumber = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res
        .status(400)
        .json({ message: "Company ID is required to suggest PI number." });
    }
    const suggestedPiNumber = await getSuggestedNextPiNumberService(
      companyId as string,
    );
    res.status(200).json({ piNumber: suggestedPiNumber });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET DASHBOARD KPIS
export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const kpis = await getDashboardKPIsService(timeRange as string);
    res.status(200).json(kpis);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch dashboard KPIs",
      error: error.message,
    });
  }
};

export const getPIDashboardOverview = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const overview = await getPIDashboardOverviewService(timeRange as string);
    res.status(200).json(overview);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch PI dashboard overview",
      error: error.message,
    });
  }
};

// GET PI STATUS DISTRIBUTION FOR CHARTS
export const getPIStatusDistribution = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const distribution = await getPIStatusDistributionService(
      timeRange as string,
    );
    res.status(200).json(distribution);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch PI status distribution",
      error: error.message,
    });
  }
};

// GET MONTHLY PI VALUE TREND
export const getMonthlyPIValueTrend = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;
    const trend = await getMonthlyPIValueTrendService(timeRange as string);
    res.status(200).json(trend);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch monthly PI value trend",
      error: error.message,
    });
  }
};

// GET TOP CLIENTS BY PI VALUE
export const getTopClientsByPIValue = async (req: Request, res: Response) => {
  try {
    const { timeRange, limit } = req.query;
    const clients = await getTopClientsByPIValueService(
      timeRange as string,
      Number(limit),
    );
    res.status(200).json(clients);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch top clients by PI value",
      error: error.message,
    });
  }
};

// GET ALL PIs
export const getPIs = async (req: Request, res: Response) => {
  try {
    const pis = await getPIsService(req.query);

    res.json(pis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET ORDERS WITH PI STATUS
export const getOrdersWithPIStatus = async (req: Request, res: Response) => {
  try {
    const ordersWithPIStatus = await getOrdersWithPIStatusService(req.query);
    res.json(ordersWithPIStatus);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPIById = async (req: Request, res: Response) => {
  try {
    const pi = await getPIByIdService(req.params.id as string);
    const piData = pi.toObject();

    const serverUrl = process.env.SERVER_URL;

    const formattedResponse = {
      ...piData,
      vehicleBookingIds: (piData.vehicleBookingIds || []).map((id: any) =>
        id?._id?.toString?.() || id?.toString?.() || id,
      ),
      hblPath: piData.hblPath,
      assignedClientSnapshot: piData.clientSnapshot,
      documents: {
        proformaInvoice: `${serverUrl}/api/v1/proforma-invoices/${piData._id}/pdf`,
      },
    };

    res.json(formattedResponse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PI
export const updatePI = async (req: Request, res: Response) => {
  try {
    const updated = await updatePIService(req.params.id as string, req.body);

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE STATUS
export const updatePIStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const updated = await updatePIStatusService(
      req.params.id as string,
      status,
    );

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPIPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ── 1. Try serving from disk first ──────────────────────────────
    const pi = await ProformaInvoice.findById(id)
      .populate("company_id", "name gstNumber address bankDetails")
      .populate("client_id", "name companyName address")
      .lean() as any;

    if (!pi) {
      return res.status(404).json({ message: "Proforma Invoice not found" });
    }

    const absolutePath = pi.pdfPath
      ? path.join(process.cwd(), pi.pdfPath)
      : null;

    if (absolutePath && fs.existsSync(absolutePath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        req.query.download === "true"
          ? `attachment; filename="${pi.piNumber}.pdf"`
          : `inline; filename="${pi.piNumber}.pdf"`,
      );
      return res.sendFile(absolutePath);
    }

    // ── 2. On-the-fly generation (pdfPath missing or file deleted) ──
    const company = pi.company_id as any;
    const buyer   = pi.clientSnapshot || pi.client_id || {};

    const bankDetails = {
      bankName:   company?.bankDetails?.bankName   || "",
      accountNo:  company?.bankDetails?.accountNo  || "",
      branchIfsc: company?.bankDetails?.branchIfsc || "",
      swiftCode:  company?.bankDetails?.swiftCode  || "",  // ✅ swiftCode included
    };

    const exporter = {
      name:      company?.name      || "",
      address:   [
        company?.address?.houseBuilding,
        company?.address?.streetArea,
        company?.address?.cityTown && company?.address?.state
          ? `${company.address.cityTown}, ${company.address.state}${company.address.pincode ? " - " + company.address.pincode : ""}`
          : company?.address?.cityTown || company?.address?.state,
        company?.address?.country,
      ].filter(Boolean).join("\n"),
      gstin:     company?.gstNumber || "",
      state:     company?.address?.state || "",
      stateCode: "",
    };

    const consignee = {
      name:    (buyer as any).companyName || (buyer as any).name || "",
      address: [
        (buyer as any).address?.houseBuilding,
        (buyer as any).address?.streetArea,
        (buyer as any).address?.cityTown,
        (buyer as any).address?.state,
        (buyer as any).address?.pincode,
      ].filter(Boolean).join(", "),
      state: (buyer as any).address?.state || (buyer as any).address?.country || "",
    };

    const items = (pi.vehicleDetails || []).map((v: any, i: number) => ({
      slNo:        i + 1,
      description: [v.make, v.model, v.variant].filter(Boolean).join(" ") || "Vehicle",
      specs: {
        hsn:           v.exportHsn || v.commercialHsn || v.hsn || "",
        color:         v.color     || "",
        chassisNo:     v.chassisNo || "",
        engineCapacity: v.engineCapacity || "",
        fuelType:      v.fuelType  || "",
        countryOfOrigin: "INDIA",
        yom:           v.yom       || "",
        fob:           v.fob       || "",
        freight:       v.freight   || "",
      },
      qty:    v.quantity || 1,
      per:    "No",
      rate:   `$${(Number(v.fob || 0) + Number(v.freight || 0)).toFixed(2)}`,
      amount: `$${((v.quantity || 1) * (Number(v.fob || 0) + Number(v.freight || 0))).toFixed(2)}`,
    }));

    const totalAmount = (pi.vehicleDetails || []).reduce(
      (sum: number, v: any) =>
        sum + (v.quantity || 1) * (Number(v.fob || 0) + Number(v.freight || 0)),
      0,
    );

    const templateData = {
      exporter,
      consignee,
      buyer: consignee,
      bankDetails,
      invoiceNumber:    pi.piNumber || "",
      date:             pi.createdAt
        ? new Date(pi.createdAt).toLocaleDateString("en-IN")
        : "",
      paymentTerms:     pi.paymentTerms     || "",
      buyersRef:        pi.buyersRef        || "",
      otherRef:         pi.otherRef         || "",
      dispatchedThrough: pi.dispatchedThrough || "",
      destination:      pi.destination      || "",
      termsOfDelivery:  pi.termsOfDelivery  || "",
      incoterm:         pi.incoterm         || "",
      portOfLoading:    pi.portOfLoading    || "",
      portOfDischarge:  pi.portOfDischarge  || "",
      items,
      totalQty:         items.reduce((s: number, i: any) => s + Number(i.qty), 0),
      totalAmount:      totalAmount.toFixed(2),
      amountInWords:    pi.amountInWords    || "",
    };

    const templatePath = path.join(process.cwd(), "src/templates/proforma-invoice.hbs");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const compiled     = handlebars.compile(templateHtml);
    const html         = compiled(templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: false });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      req.query.download === "true"
        ? `attachment; filename="${pi.piNumber}.pdf"`
        : `inline; filename="${pi.piNumber}.pdf"`,
    );
    return res.send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Upload LC

// export const uploadLC = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const file = req.file;
//     if (!file) return res.status(400).json({ message: "No file uploaded" });

//     const filePath = `/uploads/lcs/${file.filename}`;

//     // Create record in LetterOfCredit collection
//     await LetterOfCredit.create({
//       pi_id: new Types.ObjectId(id),
//       documentUrl: filePath,
//       status: "uploaded",
//     });

//     // IMPORTANT: Update the ProformaInvoice document with the path
//     // This is what the View logic is looking for
//     await ProformaInvoice.findByIdAndUpdate(id, {
//       status: "lc_received",
//       lcPath: filePath, // Ensure this field name matches your PI Model
//     });

//     res.status(201).json({
//       message: "LC uploaded successfully",
//       path: filePath,
//     });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getSafeId = (id: any): string => (Array.isArray(id) ? id[0] : id);

export const uploadLC = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const piId = getSafeId(rawId); // Fixes the TypeScript error

    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // FIX: Remove leading slash so path.join works correctly
    const relativePath = `uploads/lcs/${file.filename}`;

    // Create the record in LetterOfCredit collection
    await LetterOfCredit.create({
      pi_id: new Types.ObjectId(piId),
      documentUrl: relativePath,
      status: "uploaded",
    });

    // Update ProformaInvoice document
    // Ensure your ProformaInvoice model has 'lcPath' in its schema
    await ProformaInvoice.findByIdAndUpdate(piId, {
      status: "lc_received",
      lcPath: relativePath,
    });

    res.status(201).json({
      message: "LC uploaded successfully",
      path: relativePath,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// export const getLCFile = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     // First: Try to find it on the PI document
//     const pi = await ProformaInvoice.findById(id).lean();
//     let lcPath = (pi as any)?.lcPath;

//     // Second: If not on PI, look in the LetterOfCredit collection
//     if (!lcPath) {
//       const lcRecord = await LetterOfCredit.findOne({ pi_id: id }).sort({
//         createdAt: -1,
//       });
//       lcPath = lcRecord?.documentUrl;
//     }

//     if (!lcPath) {
//       return res.status(404).json({ message: "No LC uploaded for this PI" });
//     }

//     const absolutePath = path.join(process.cwd(), lcPath);

//     if (!fs.existsSync(absolutePath)) {
//       return res.status(404).json({ message: "File missing on server disk" });
//     }

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "inline; filename=letter-of-credit.pdf",
//     );
//     res.sendFile(absolutePath);
//   } catch (error: any) {
//     res.status(500).json({ message: "Failed to serve LC file" });
//   }
// };

export const getLCFile = async (req: Request, res: Response) => {
  try {
    const piId = getSafeId(req.params.id);

    // 1. Try to find path from PI document
    const pi = await ProformaInvoice.findById(piId).lean();
    let lcPath = (pi as any)?.lcPath;

    // 2. Fallback to LetterOfCredit collection
    if (!lcPath) {
      const lcRecord = await LetterOfCredit.findOne({ pi_id: piId }).sort({
        createdAt: -1,
      });
      lcPath = lcRecord?.documentUrl;
    }

    if (!lcPath) {
      return res.status(404).json({ message: "No LC path found in database" });
    }

    // 3. Resolve absolute path
    // We clean the path to ensure no double slashes or leading slash issues
    const cleanPath = lcPath.startsWith("/") ? lcPath.substring(1) : lcPath;
    const absolutePath = path.resolve(process.cwd(), cleanPath);

    console.log("Looking for file at:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      console.error("File missing at path:", absolutePath);
      return res.status(404).json({ message: "File missing on server disk" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=lc.pdf");
    res.sendFile(absolutePath);
  } catch (error: any) {
    res.status(500).json({ message: "Server error retrieving file" });
  }
};

export const getBookedVehicleOrders = async (req: Request, res: Response) => {
  try {
    const { clientId, search } = req.query;

    const data = await getBookedVehicleOrdersService(
      clientId as string,
      search as string,
    );

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadHBL = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = `/uploads/hbls/${req.file.filename}`;

    await ProformaInvoice.findByIdAndUpdate(id, { hblPath: filePath });

    res
      .status(200)
      .json({ message: "HBL uploaded successfully", path: filePath });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getHBLFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pi = await ProformaInvoice.findById(id);

    if (!pi || !pi.hblPath)
      return res.status(404).json({ message: "HBL file not found" });

    const absolutePath = path.join(process.cwd(), pi.hblPath);
    if (!fs.existsSync(absolutePath))
      return res.status(404).json({ message: "File missing on disk" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="hbl-document.pdf"');
    res.sendFile(absolutePath);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicleInPI = async (req: Request, res: Response) => {
  try {
    const { piId, index } = req.params;
    const { engineNo } = req.body;

    const pi = await ProformaInvoice.findById(piId);
    if (!pi) return res.status(404).json({ message: "PI not found" });

    const idx = parseInt(index as string);
    if (isNaN(idx) || !pi.vehicleDetails[idx]) {
      return res.status(404).json({ message: "Vehicle not found in PI" });
    }

    pi.vehicleDetails[idx].engineNo = engineNo?.trim().toUpperCase() || "";

    await pi.save();
    res.json({ success: true, message: "Engine number updated in PI" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};