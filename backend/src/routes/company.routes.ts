import express from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyProformaInvoice,
  updateCompany,
} from "../controllers/company.controller";

const router = express.Router();

router.route("/").post(createCompany).get(getCompanies);
router.route("/:id").get(getCompanyById).put(updateCompany);
router.route("/proformainvoice/:id").get(getCompanyProformaInvoice)
export default router;
