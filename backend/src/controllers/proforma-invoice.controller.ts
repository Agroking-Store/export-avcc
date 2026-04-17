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
  getDashboardKPIsService,
  getPIStatusDistributionService,
  getMonthlyPIValueTrendService,
  getTopClientsByPIValueService,
  getOrderDetailWithTrackingService, // Import the new service
} from "../services/proforma-invoice.service";

import LetterOfCredit from "../models/LetterOfCredit.model";
import ProformaInvoice from "../models/ProformaInvoice.model";

import path from "path";
import fs from "fs";

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

// GET PI BY ID
export const getPIById = async (req: Request, res: Response) => {
  try {
    const pi = await getPIByIdService(req.params.id as string);

    res.json(pi);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
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

// Upload LC
export const uploadLC = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const piIdString = Array.isArray(id) ? id[0] : id;

    if (!piIdString) {
      return res.status(400).json({ message: "Invalid PI ID" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const piObjectId = new Types.ObjectId(piIdString);
    const filePath = `/uploads/lcs/${file.filename}`;

    await LetterOfCredit.create({
      pi_id: piObjectId,
      documentUrl: filePath,
      status: "uploaded",
    });

    await updatePIStatusService(piIdString, "lc_received");

    res.status(201).json({
      message: "LC uploaded successfully",
      path: filePath,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLCFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const piIdString = Array.isArray(id) ? id[0] : id;

    const lc = await LetterOfCredit.findOne({ pi_id: piIdString }).sort({
      uploadedAt: -1,
    });

    if (!lc || !lc.documentUrl) {
      return res
        .status(404)
        .json({ message: "Letter of Credit file not found" });
    }

    const absolutePath = path.join(process.cwd(), lc.documentUrl);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File not found on server disk" });
    }

    res.sendFile(absolutePath);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
