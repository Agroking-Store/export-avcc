import { Router } from "express";
import {
  createPI,
  getPIs,
  getPIById,
  updatePI,
  updatePIStatus,
} from "../controllers/proforma-invoice.controller";

const router = Router();

router.post("/", createPI);
router.get("/", getPIs);
router.get("/:id", getPIById);
router.put("/:id", updatePI);

// 🔥 Status update
router.patch("/:id/status", updatePIStatus);

export default router;