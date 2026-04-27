import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getBookingsByOrder,
  initBooking,
  uploadQuotationHandler,
  approveHandler,
  rejectHandler,
  confirmPaymentHandler,
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

router.get("/order/:orderId", getBookingsByOrder);
router.get("/order/:orderId/chassis-reminders", getDueRemindersHandler);
router.post("/init", initBooking);
router.post("/:id/quotation", quotationUpload.single("quotation"), uploadQuotationHandler);
router.post("/:id/approve", approveHandler);
router.post("/:id/reject", rejectHandler);
router.post("/:id/confirm-payment", confirmPaymentHandler);
router.patch("/:id/assign-client", assignClientHandler);
router.patch("/:id/assign-dealer", assignDealerHandler);
router.patch("/:id/chassis-engine", updateChassisEngineHandler);
router.patch("/:id/status", updateStatusHandler);
router.get("/", getAllBookingsHandler);
router.get("/:id", getBookingByIdHandler);

router.post(
  "/:id/documents",
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
router.get("/:id/files/:field", getBookingFileHandler);

export default router;
