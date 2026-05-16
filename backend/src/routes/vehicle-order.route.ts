import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";
import {
  createVehicleOrder,
  getVehicleOrderById,
  getVehicleOrders,
  updateVehicleOrder,
  deleteVehicleOrder,
} from "../controllers/vehicle-order.controller";

const router = Router();

// Read routes: any authenticated user
router.get("/", authenticate, getVehicleOrders);
router.get("/:id", authenticate, getVehicleOrderById);

// Write routes: admin only
router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DEALER, ROLES.CLIENT),
  createVehicleOrder,
);
router.put("/:id", authenticate, authorize(ROLES.ADMIN), updateVehicleOrder);
router.delete("/:id", authenticate, authorize(ROLES.ADMIN), deleteVehicleOrder);

export default router;
