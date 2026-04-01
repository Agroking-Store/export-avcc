import { Router } from "express";
import {
  createPI,
  getPIs,
  getPIById,
  updatePI,
  updatePIStatus,
  deletePI,
} from "../controllers/proforma-invoice.controller";
import { downloadProformaInvoice } from "../controllers/pdf.controller";
import { validate } from "../middleware/validate.middleware";
import { createPIValidationSchema } from "../validations/proforma-invoice.validation";

const router = Router();

router.post("/", validate(createPIValidationSchema), createPI);
router.get("/", getPIs);
router.get("/:id/pdf", downloadProformaInvoice);
router.get("/:id", getPIById);
router.put("/:id", validate(createPIValidationSchema), updatePI);
router.delete("/:id", deletePI);
router.patch("/:id/status", updatePIStatus);

export default router;
