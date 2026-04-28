import express from "express";
import {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer,
  getDealerVehicles,
} from "../controllers/dealer.controller";

const router = express.Router();

router.post("/", createDealer);
router.get("/", getDealers);
router.get("/:id/getVehicles", getDealerVehicles);
router.get("/:id", getDealerById);
router.put("/:id", updateDealer);
router.delete("/:id", deleteDealer);

export default router;