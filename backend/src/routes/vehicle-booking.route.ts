import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";
import {
  getBookingsByOrder,
  initBooking,
  uploadQuotationHandler,
  saveQuotationDetailsHandler,
  approveHandler,
  rejectHandler,
  confirmPaymentHandler,
  addPaymentHandler,
  updateChassisEngineHandler,
  updateStatusHandler,
  assignClientHandler,
  assignDealerHandler,
  getBookingByIdHandler,
  getDueRemindersHandler,
  uploadBookingDocumentsHandler,
  getBookingFileHandler,
  getAllBookingsHandler,
} from "../controllers/vehicle-booking.controller";

// Quotation-specific multer config
const quotationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "uploads/quotations");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `quot-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const quotationUpload = multer({
  storage: quotationStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, PNG, and WebP files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Document upload multer config
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "uploads/booking-documents");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, PNG, and WebP files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// Public read routes (any authenticated user)
router.get("/order/:orderId", authenticate, getBookingsByOrder);
router.get("/order/:orderId/chassis-reminders", authenticate, getDueRemindersHandler);
router.get("/", authenticate, getAllBookingsHandler);
router.get("/:id", authenticate, getBookingByIdHandler);
router.get("/:id/files/:field", authenticate, getBookingFileHandler);

// Admin-only: init booking, payment, approve/reject, client allotment, status update, document upload
router.post("/init", authenticate, authorize(ROLES.ADMIN), initBooking);
router.post("/:id/approve", authenticate, authorize(ROLES.ADMIN), approveHandler);
router.post("/:id/reject", authenticate, authorize(ROLES.ADMIN), rejectHandler);
router.post("/:id/confirm-payment", authenticate, authorize(ROLES.ADMIN), confirmPaymentHandler);
router.post("/:id/payments", authenticate, authorize(ROLES.ADMIN), addPaymentHandler);
router.patch("/:id/assign-client", authenticate, authorize(ROLES.ADMIN), assignClientHandler);
router.patch("/:id/status", authenticate, authorize(ROLES.ADMIN, ROLES.SOURCING), updateStatusHandler);
router.post(
  "/:id/documents",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SOURCING),
  documentUpload.fields([
    { name: "form20", maxCount: 1 },
    { name: "form21", maxCount: 1 },
    { name: "form22", maxCount: 1 },
    { name: "tempRegCert", maxCount: 1 },
    { name: "bvCertificate", maxCount: 1 },
    { name: "dealerInvoice", maxCount: 1 },
  ]),
  uploadBookingDocumentsHandler,
);

// Admin + Sourcing Team: dealer assignment, quotation upload, chassis-engine update
router.patch("/:id/assign-dealer", authenticate, authorize(ROLES.ADMIN, ROLES.SOURCING), assignDealerHandler);
router.post("/:id/quotation", authenticate, authorize(ROLES.ADMIN, ROLES.SOURCING), quotationUpload.single("quotation"), uploadQuotationHandler);
router.patch("/:id/quotation-details", authenticate, authorize(ROLES.ADMIN, ROLES.SOURCING), saveQuotationDetailsHandler);
router.patch("/:id/chassis-engine", authenticate, authorize(ROLES.ADMIN, ROLES.SOURCING), updateChassisEngineHandler);

export default router;
