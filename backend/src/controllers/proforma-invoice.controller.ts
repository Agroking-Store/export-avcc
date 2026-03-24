import { Request, Response } from "express";
import {
  createPIService,
  getPIsService,
  getPIByIdService,
  updatePIService,
  updatePIStatusService,
} from "../services/proforma-invoice.service";

import { validateCreatePI } from "../validations/proforma-invoice.validation";
import { deletePIService } from "../services/proforma-invoice.service";


// CREATE PI
export const createPI = async (req: Request, res: Response) => {
  try {
    validateCreatePI(req.body);

    const pi = await createPIService(req.body);

    res.status(201).json(pi);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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

export const deletePI = async (req: Request, res: Response) => {
  try {
    await deletePIService(req.params.id as string);

    res.json({ message: "PI deleted successfully" });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};