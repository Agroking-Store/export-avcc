import { Router } from "express";
import {
  deleteInvoice,
  downloadInvoice,
  downloadPackingList,
  generateInvoice,
  getInvoicesByPI,
  getPIInvoiceContext,
} from "../controllers/invoice.controller";

const router = Router();

router.get("/pi/:piId", getPIInvoiceContext);
router.post("/invoices/generate", generateInvoice);
router.get("/invoices/:invoiceId/download-packing", downloadPackingList);
router.get("/invoices/:invoiceId/download", downloadInvoice);
router.get("/invoices/:piId", getInvoicesByPI);
router.delete("/invoices/:invoiceId", deleteInvoice);

export default router;
