import { Router } from "express";
import {
  createVehicleOrder,
  getVehicleOrderById,
  getVehicleOrders,
  updateVehicleOrder,
} from "../controllers/vehicle-order.controller";

const router = Router();

router.post("/", createVehicleOrder);
router.get("/", getVehicleOrders);
router.get("/:id", getVehicleOrderById);
router.put("/:id", updateVehicleOrder);

export default router;
