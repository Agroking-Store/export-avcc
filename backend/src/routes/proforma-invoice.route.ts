import { Router } from "express";
import {
  createPI,
  getPIs,
  getPIById,
  getSuggestedNextPiNumber, // Import the new controller
  updatePI,
  getOrdersWithPIStatus, // Keep this for the PIList page's "Order Perspective" tab
  getPIStatusDistribution, // Import the new controller for PI status distribution
  getDashboardKPIs, // Import the new controller for dashboard KPIs
  getMonthlyPIValueTrend, // Import new controller
  getTopClientsByPIValue, // Import new controller
  getOrderDetailWithTracking, // Import the new controller for order details with tracking
  updatePIStatus, // Import the controller for the new route
  getBookedVehicleOrders,
} from "../controllers/proforma-invoice.controller";
import {
  getProformaInvoiceData,
  downloadProformaInvoice,
} from "../controllers/pdf.controller";
import { validate } from "../middleware/validate.middleware";
import { createPIValidationSchema } from "../validations/proforma-invoice.validation";
// import {
//   uploadLC,
//   getLCFile,
// } from "../controllers/proforma-invoice.controller";
import { uploadLC } from "../controllers/lc.controller";
import { getLCFile } from "../controllers/proforma-invoice.controller";
import { upload } from "../middleware/upload.middleware";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.ACCOUNTANT));

router.post("/", validate(createPIValidationSchema), createPI);

router.get("/dashboard-kpis", getDashboardKPIs);
router.get("/monthly-pi-value-trend", getMonthlyPIValueTrend);
router.get("/top-clients-by-pi-value", getTopClientsByPIValue);
router.get("/pi-status-distribution", getPIStatusDistribution);
router.get("/next-pi-number", getSuggestedNextPiNumber);

router.get("/orders-with-pi-status", getOrdersWithPIStatus);
router.get("/orders/:orderId/details", getOrderDetailWithTracking);

router.get("/booked-vehicle-orders", getBookedVehicleOrders);

router.get("/", getPIs);

router.get("/:id/data", getProformaInvoiceData);
router.get("/:id/pdf", downloadProformaInvoice);
router.get("/:id/lc/view", getLCFile);
router.get("/:id", getPIById);

router.put("/:id", validate(createPIValidationSchema), updatePI);
router.patch("/:id/status", updatePIStatus);
router.post("/:id/lc", upload.single("lcFile"), uploadLC);

export default router;
