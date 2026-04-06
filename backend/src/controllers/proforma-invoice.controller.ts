import { Request, Response } from "express";
import {
  createPIService,
  getPIsService,
  getPIByIdService,
  updatePIService,
  getSuggestedNextPiNumberService, // Import the new service
  getOrdersWithPIStatusService,
  updatePIStatusService,
  getOrderDetailsWithVehiclePIStatusService,
} from "../services/proforma-invoice.service";

// CREATE PI
export const createPI = async (req: Request, res: Response) => {
  try {
    const pi = await createPIService(req.body);

    res.status(201).json(pi);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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
      companyId as string
    );
    res.status(200).json({ piNumber: suggestedPiNumber });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

// GET ORDER DETAILS WITH VEHICLE PI STATUS
export const getOrderDetailsWithVehiclePIStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const orderDetails = await getOrderDetailsWithVehiclePIStatusService(
      req.params.orderId as string
    );
    res.json(orderDetails);
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
      status
    );

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
