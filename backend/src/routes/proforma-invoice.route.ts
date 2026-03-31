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

const router = Router();

router.post("/", createPI);
router.get("/", getPIs);
router.get("/:id/pdf", downloadProformaInvoice);
router.get("/:id", getPIById);
router.put("/:id", updatePI);
router.delete("/:id", deletePI);
router.patch("/:id/status", updatePIStatus);

export default router;
