import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { ROLES } from "../config/constants";
import {
  getBookingsByOrderId,
  getOrCreateBooking,
  uploadQuotation,
  approveBooking,
  rejectBooking,
  confirmPayment,
  updateChassisEngine,
  updateBookingStatus,
  assignClientToBooking,
  assignDealerToBooking,
  getBookingById,
  getReminderDueBookings,
  uploadBookingDocuments,
  getBookingFile,
  getAllVehicleBookingsService,
} from "../services/vehicle-booking.service";

export const getAllBookingsHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllVehicleBookingsService(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

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
    if (req.file?.filename) {
      const uploadedAbsolutePath = path.join(
        process.cwd(),
        "uploads",
        "quotations",
        req.file.filename,
      );

      if (fs.existsSync(uploadedAbsolutePath)) {
        fs.unlinkSync(uploadedAbsolutePath);
      }
    }

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
    const { amount } = req.body;
    const booking = await confirmPayment(
      req.params.id as string,
      Number(amount),
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChassisEngineHandler = async (req: Request, res: Response) => {
  try {
    const {
      chassisNumber,
      engineNumber,
      deliveryDate,
      engineCapacity,
      fuelType,
      countryOfOrigin,
      yom,
      commercialHsnCode,
      exportHsnCode,
    } = req.body;
    const userRole = (req as any).user?.role;
    const bookingId = req.params.id as string;

    // If sourcing_team, enforce payment_done status restriction
    if (userRole === ROLES.SOURCING) {
      const booking = await getBookingById(bookingId);
      if (booking.status !== "payment_done") {
        return res.status(403).json({ message: "Sourcing team can only update engine/chassis after payment is completed" });
      }
    }

    const booking = await updateChassisEngine(bookingId, {
      chassisNumber,
      engineNumber,
      deliveryDate,
      engineCapacity,
      fuelType,
      countryOfOrigin,
      yom,
      commercialHsnCode,
      exportHsnCode,
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

export const assignDealerHandler = async (req: Request, res: Response) => {
  try {
    const { dealerId } = req.body;
    if (!dealerId) throw new Error("Dealer is required");

    const booking = await assignDealerToBooking(
      req.params.id as string,
      dealerId,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const assignClientHandler = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.body;
    if (!clientId) throw new Error("Client is required");

    const booking = await assignClientToBooking(
      req.params.id as string,
      clientId,
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

export const uploadBookingDocumentsHandler = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const booking = await uploadBookingDocuments(req.params.id as string, files);
    return res.json({
      success: true,
      message: "Booking documents updated",
      data: booking,
    });
  } catch (error: any) {
    console.error("Booking document upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingFileHandler = async (req: Request, res: Response) => {
  try {
    const field = Array.isArray(req.params.field)
      ? req.params.field[0]
      : req.params.field;
    const { download } = req.query;

    const filePath = await getBookingFile(req.params.id as string, field);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    if (download === "true") {
      return res.download(filePath);
    } else {
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
