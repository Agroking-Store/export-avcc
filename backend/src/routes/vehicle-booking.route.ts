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
  getBookingByIdHandler,
  getDueRemindersHandler,
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

const router = Router();

router.get("/order/:orderId", getBookingsByOrder);
router.get("/order/:orderId/chassis-reminders", getDueRemindersHandler);
router.post("/init", initBooking);
router.post("/:id/quotation", quotationUpload.single("quotation"), uploadQuotationHandler);
router.post("/:id/approve", approveHandler);
router.post("/:id/reject", rejectHandler);
router.post("/:id/confirm-payment", confirmPaymentHandler);
router.patch("/:id/assign-client", assignClientHandler);
router.patch("/:id/chassis-engine", updateChassisEngineHandler);
router.patch("/:id/status", updateStatusHandler);
router.get("/:id", getBookingByIdHandler);

export default router;
