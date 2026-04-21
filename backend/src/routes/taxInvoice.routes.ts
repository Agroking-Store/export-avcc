import { Router } from "express";

import {
  createTaxInvoice,
  getTaxInvoiceById,
  downloadTaxInvoice,
} from "../controllers/taxInvoice.controller";

const router = Router();

router.post("/", createTaxInvoice);
router.get("/:id", getTaxInvoiceById);
router.get("/:id/pdf", downloadTaxInvoice);

export default router;