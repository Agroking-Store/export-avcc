import { Router } from "express";
import authRoutes from "./auth.route";
// will import other routes as you build them, like below:
// import clientRoutes from './client.route';
// import vehicleRoutes from './vehicle.route';
import clientRoutes from "./client.route";
import proformaInvoiceRoutes from "./proforma-invoice.route";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
// router.use('/clients', clientRoutes);
// router.use('/vehicles', vehicleRoutes);
// etc.
router.use("/clients", clientRoutes);
router.use("/proforma-invoices", proformaInvoiceRoutes);

export default router;
