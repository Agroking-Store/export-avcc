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
  updatePIStatus,
  getOrderDetailsWithVehiclePIStatus, // Import the controller for the new route
} from "../controllers/proforma-invoice.controller";
import { downloadProformaInvoice } from "../controllers/pdf.controller";
import { validate } from "../middleware/validate.middleware";
import { createPIValidationSchema } from "../validations/proforma-invoice.validation";

const router = Router();
router.post("/", validate(createPIValidationSchema), createPI); // Route to create a new PI
router.get("/dashboard-kpis", getDashboardKPIs); // New route for dashboard KPIs
router.get("/monthly-pi-value-trend", getMonthlyPIValueTrend); // New route for monthly PI value trend
router.get("/top-clients-by-pi-value", getTopClientsByPIValue); // New route for top clients by PI value
router.get("/pi-status-distribution", getPIStatusDistribution); // New route for PI status distribution
router.get("/next-pi-number", getSuggestedNextPiNumber); // New route for suggested PI number
router.get("/orders-with-pi-status", getOrdersWithPIStatus); // Route to get a list of orders with their overall PI status (for the PIList page)
router.get("/", getPIs);
router.get("/:id/pdf", downloadProformaInvoice);
router.get("/:id", getPIById);
router.put("/:id", validate(createPIValidationSchema), updatePI); // Keep this line
router.patch("/:id/status", updatePIStatus);
router.get("/orders/:orderId/details", getOrderDetailsWithVehiclePIStatus); // New route for PI Order Detail page

export default router;
