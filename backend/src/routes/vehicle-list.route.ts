import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";
import {
  createVehicleListItem,
  createVehicleListItems,
  getVehicleListItems,
  getVehicleOrderFormOptions,
  getVehicleListItemById,
  updateVehicleListItem,
  deleteVehicleListItem,
} from "../controllers/vehicle-list.controller";

const router = Router();

// Read routes: any authenticated user
router.get("/", authenticate, getVehicleListItems);
router.get("/order-options", authenticate, getVehicleOrderFormOptions);
router.get("/:id", authenticate, getVehicleListItemById);
router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  deleteVehicleListItem,
);

// Write routes: admin only
router.post("/", authenticate, authorize(ROLES.ADMIN), createVehicleListItem);
router.post(
  "/bulk",
  authenticate,
  authorize(ROLES.ADMIN),
  createVehicleListItems,
);
router.put("/:id", authenticate, authorize(ROLES.ADMIN), updateVehicleListItem);

export default router;
