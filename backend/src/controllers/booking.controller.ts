import { Request, Response } from "express";
import BookingService, {
  getLatestBookingVehiclesService,
} from "../services/booking.service";
import { ResponseUtil } from "../utils/response";
import {
  validateCreateBooking,
  validateUpdateBooking,
} from "../validations/booking.validation";
import { CreateBookingDto } from "../dto/booking.dto";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const bookingData = req.body as CreateBookingDto;
    const booking = await BookingService.create(bookingData);
    ResponseUtil.success(res, booking, "Booking created successfully");
  } catch (error: any) {
    if (error.message.includes("already booked")) {
      res.status(400).json({
        message: error.message,
        code: "VEHICLE_ALREADY_BOOKED",
      });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await BookingService.getAll();
    ResponseUtil.success(res, bookings, "Bookings fetched successfully");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await BookingService.getById(req.params.id as string);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    ResponseUtil.success(res, booking, "Booking fetched successfully");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingsByDealer = async (req: Request, res: Response) => {
  try {
    const bookings = await BookingService.getByDealer(
      req.params.dealerId as string,
    );
    ResponseUtil.success(res, bookings, "Dealer bookings fetched successfully");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const booking = await BookingService.update(
      req.params.id as string,
      req.body,
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    ResponseUtil.success(res, booking, "Booking updated successfully");
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const booking = await BookingService.delete(req.params.id as string);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    ResponseUtil.success(res, booking, "Booking deleted successfully");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getLatestBookingVehicles = async (req: Request, res: Response) => {
  try {
    const result = await getLatestBookingVehiclesService();

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBookingsByOrder = async (req: Request, res: Response) => {
  try {
    const deletedCount = await BookingService.deleteByOrderId(
      req.params.orderId as string,
    );
    ResponseUtil.success(
      res,
      { deletedCount },
      `${deletedCount} booking(s) deleted for order`,
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
