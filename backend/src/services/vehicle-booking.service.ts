import fs from "fs";
import path from "path";
import { VehicleBooking, VehicleBookingStatus } from "../models/VehicleBooking.model";
import { VehicleOrder } from "../models/VehicleOrder.model";

/**
 * Get all bookings for a given order
 */
export const getBookingsByOrderId = async (orderId: string) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  const existingBookings = await VehicleBooking.find({ orderId }).sort({
    vehicleIndex: 1,
  });

  const existingByIndex = new Map(
    existingBookings.map((booking) => [booking.vehicleIndex, booking]),
  );

  const createOps = [];
  for (let vehicleIndex = 0; vehicleIndex < order.quantity; vehicleIndex += 1) {
    if (!existingByIndex.has(vehicleIndex)) {
      createOps.push({
        orderId: order._id,
        vehicleId: order.vehicleId,
        vehicleIndex,
        status: "pending",
      });
    }
  }

  if (createOps.length > 0) {
    await VehicleBooking.insertMany(createOps, { ordered: false });
  }

  return await VehicleBooking.find({ orderId }).sort({ vehicleIndex: 1 });
};

/**
 * Get or create a booking for a specific vehicle unit in an order
 */
export const getOrCreateBooking = async (orderId: string, vehicleIndex: number) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  if (vehicleIndex < 0 || vehicleIndex >= order.quantity) {
    throw new Error("Vehicle index out of range");
  }

  let booking = await VehicleBooking.findOne({ orderId, vehicleIndex });
  if (!booking) {
    booking = new VehicleBooking({
      orderId,
      vehicleId: order.vehicleId,
      vehicleIndex,
      status: "pending",
    });
    await booking.save();
  }

  return booking;
};

/**
 * Upload quotation file and set status
 */
export const uploadQuotation = async (bookingId: string, filePath: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!["pending", "rejected", "quotation_uploaded"].includes(booking.status)) {
    throw new Error(
      "Quotation can only be uploaded when status is pending, rejected, or awaiting approval",
    );
  }

  const previousQuotation = booking.quotationFile;
  booking.quotationFile = filePath;
  booking.status = "quotation_uploaded";
  booking.rejectionReason = "";

  const updatedBooking = await booking.save();

  if (previousQuotation && previousQuotation !== filePath) {
    const previousAbsolutePath = path.join(
      process.cwd(),
      previousQuotation.replace(/^\/+/, ""),
    );

    if (fs.existsSync(previousAbsolutePath)) {
      fs.unlinkSync(previousAbsolutePath);
    }
  }

  return updatedBooking;
};

/**
 * Approve a booking (quotation must be uploaded)
 */
export const approveBooking = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only approve when quotation is uploaded");
  }

  booking.status = "approved";
  return await booking.save();
};

/**
 * Reject a booking with a mandatory reason
 */
export const rejectBooking = async (bookingId: string, reason: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "quotation_uploaded") {
    throw new Error("Can only reject when quotation is uploaded");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Rejection reason is required");
  }

  booking.status = "rejected";
  booking.rejectionReason = reason.trim();
  return await booking.save();
};

/**
 * Confirm payment with amount only
 */
export const confirmPayment = async (
  bookingId: string,
  amount: number,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "approved") {
    throw new Error("Can only confirm payment when booking is approved");
  }

  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  booking.paymentAmount = amount;
  booking.paymentReference = "";
  booking.status = "payment_done";
  return await booking.save();
};

/**
 * Update chassis and engine numbers
 */
export const updateChassisEngine = async (
  bookingId: string,
  data: { chassisNumber?: string; engineNumber?: string },
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (data.chassisNumber !== undefined) {
    booking.chassisNumber = data.chassisNumber.trim();
  }
  if (data.engineNumber !== undefined) {
    booking.engineNumber = data.engineNumber.trim();
  }

  // Auto-advance status if both are filled and status is payment_done
  if (
    booking.chassisNumber &&
    booking.engineNumber &&
    booking.status === "payment_done"
  ) {
    booking.status = "chassis_received";
  }

  return await booking.save();
};

/**
 * Update status manually (e.g. mark as delivered)
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: VehicleBookingStatus,
) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.status = status;
  return await booking.save();
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string) => {
  const booking = await VehicleBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return booking;
};

/**
 * Find records that still need chassis/engine numbers and are due for reminders
 */
export const getReminderDueBookings = async (
  orderId: string,
  intervalHours: number,
) => {
  const order = await VehicleOrder.findById(orderId);
  if (!order) throw new Error("Vehicle order not found");

  const hours = Number.isFinite(intervalHours) && intervalHours > 0 ? intervalHours : 2;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const due = await VehicleBooking.find({
    orderId,
    status: "payment_done",
    $and: [
      { $or: [{ engineNumber: "" }, { chassisNumber: "" }] },
      {
        $or: [
          { lastReminderAt: { $exists: false } },
          { lastReminderAt: { $lte: cutoff } },
        ],
      },
    ],
  }).sort({ vehicleIndex: 1 });

  if (due.length > 0) {
    await VehicleBooking.updateMany(
      { _id: { $in: due.map((item) => item._id) } },
      {
        $set: { lastReminderAt: new Date() },
        $inc: { reminderCount: 1 },
      },
    );
  }

  return due;
};
