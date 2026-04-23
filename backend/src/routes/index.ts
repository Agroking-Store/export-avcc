import { Router } from "express";
import authRoutes from "./auth.route";
import clientRoutes from "./client.route";
import orderRoutes from "./order.route";
import vehicleRoutes from "./vehicle.route";
import vehicleListRoutes from "./vehicle-list.route";
import vehicleOrderRoutes from "./vehicle-order.route";
import proformaInvoiceRoutes from "./proforma-invoice.route";
import bookingRoutes from "./booking.route";

import userRoutes from "./user.route";
const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/orders", orderRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicle-list", vehicleListRoutes);
router.use("/vehicle-orders", vehicleOrderRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/users", userRoutes);

export default router;
