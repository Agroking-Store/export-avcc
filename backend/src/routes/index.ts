import { Router } from "express";
import authRoutes from "./auth.route";
import clientRoutes from "./client.route";
import orderRoutes from "./order.route";
import vehicleRoutes from "./vehicle.route";
import proformaInvoiceRoutes from "./proforma-invoice.route";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/orders", orderRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);

export default router;
