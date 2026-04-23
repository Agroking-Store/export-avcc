import { Request, Response } from "express";
import {
  getBookingsByOrderId,
  getOrCreateBooking,
  uploadQuotation,
  approveBooking,
  rejectBooking,
  confirmPayment,
  updateChassisEngine,
  updateBookingStatus,
  getBookingById,
  getReminderDueBookings,
} from "../services/vehicle-booking.service";

export const getBookingsByOrder = async (req: Request, res: Response) => {
  try {
    const bookings = await getBookingsByOrderId(req.params.orderId as string);
    res.json(bookings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const initBooking = async (req: Request, res: Response) => {
  try {
    const { orderId, vehicleIndex } = req.body;
    if (!orderId || vehicleIndex === undefined) {
      throw new Error("orderId and vehicleIndex are required");
    }
    const booking = await getOrCreateBooking(orderId, Number(vehicleIndex));
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadQuotationHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    const filePath = `/uploads/quotations/${req.file.filename}`;
    const booking = await uploadQuotation(req.params.id as string, filePath);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveHandler = async (req: Request, res: Response) => {
  try {
    const booking = await approveBooking(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectHandler = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const booking = await rejectBooking(req.params.id as string, reason);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const confirmPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { amount, reference } = req.body;
    const booking = await confirmPayment(
      req.params.id as string,
      Number(amount),
      reference,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChassisEngineHandler = async (req: Request, res: Response) => {
  try {
    const { chassisNumber, engineNumber } = req.body;
    const booking = await updateChassisEngine(req.params.id as string, {
      chassisNumber,
      engineNumber,
    });
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStatusHandler = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) throw new Error("Status is required");
    const booking = await updateBookingStatus(
      req.params.id as string,
      status,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBookingByIdHandler = async (req: Request, res: Response) => {
  try {
    const booking = await getBookingById(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getDueRemindersHandler = async (req: Request, res: Response) => {
  try {
    const intervalHours = Number(req.query.hours || 2);
    const due = await getReminderDueBookings(
      req.params.orderId as string,
      intervalHours,
    );
    res.json(due);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
