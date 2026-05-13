import express from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyProformaInvoice,
  updateCompany,
  getCompanyDealerInvoices,
} from "../controllers/company.controller";

const router = express.Router();

router.route("/").post(createCompany).get(getCompanies);
router.route("/:id").get(getCompanyById).put(updateCompany);
router.route("/proformainvoice/:id").get(getCompanyProformaInvoice);
router.route("/dealer-invoices/:id").get(getCompanyDealerInvoices);

export default router;
