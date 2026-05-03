import { Router } from "express";
import authRoutes from "./auth.route";
import clientRoutes from "./client.route";
import orderRoutes from "./order.route";
//import vehicleRoutes from "./vehicle.route";
import vehicleListRoutes from "./vehicle-list.route";
import vehicleOrderRoutes from "./vehicle-order.route";
import vehicleBookingRoutes from "./vehicle-booking.route";
import proformaInvoiceRoutes from "./proforma-invoice.route";
import bookingRoutes from "./booking.route";
import taxInvoiceRoutes from "./taxInvoice.routes";
import invoiceRoutes from "./invoice.route";
import userRoutes from "./user.route";
const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/orders", orderRoutes);
//router.use("/vehicles", vehicleRoutes);
router.use("/vehicle-list", vehicleListRoutes);
router.use("/vehicle-orders", vehicleOrderRoutes);
router.use("/vehicle-bookings", vehicleBookingRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/tax-invoices", taxInvoiceRoutes);
router.use("/", invoiceRoutes);
router.use("/users", userRoutes);

export default router;
