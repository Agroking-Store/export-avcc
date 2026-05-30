import { Request, Response } from "express";
import { getCustomerNamesService } from "../services/shipment.service";

export const getCustomerNamesHandler = async (_req: Request, res: Response) => {
  try {
    const customers = await getCustomerNamesService();
    res.json({ data: customers });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

