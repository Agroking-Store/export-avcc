import { Router } from "express";
import {
  createPI,
  getPIs,
  getPIById,
  updatePI,
  getOrdersWithPIStatus, // Keep this for the PIList page's "Order Perspective" tab
  updatePIStatus,
  deletePI,
  getOrderDetailsWithVehiclePIStatus, // Import the controller for the new route
} from "../controllers/proforma-invoice.controller";
import { downloadProformaInvoice } from "../controllers/pdf.controller";
import { validate } from "../middleware/validate.middleware";
import { createPIValidationSchema } from "../validations/proforma-invoice.validation";

const router = Router();
router.post("/", validate(createPIValidationSchema), createPI); // Route to create a new PI
router.get("/orders-with-pi-status", getOrdersWithPIStatus); // Route to get a list of orders with their overall PI status (for the PIList page)
router.get("/", getPIs);
router.get("/:id/pdf", downloadProformaInvoice);
router.get("/:id", getPIById);
router.put("/:id", validate(createPIValidationSchema), updatePI);
router.delete("/:id", deletePI);
router.patch("/:id/status", updatePIStatus);
router.get("/orders/:orderId/details", getOrderDetailsWithVehiclePIStatus); // New route for PI Order Detail page

export default router;
