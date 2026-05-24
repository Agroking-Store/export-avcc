import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";
import {
  addContainerHandler,
  addVehicleToContainerHandler,
  availableShipmentVehiclesHandler,
  createShipmentHandler,
  getShipmentHandler,
  listShipmentsHandler,
} from "../controllers/shipment.controller";

const router = Router();

router.get("/", authenticate, listShipmentsHandler);
router.post("/", authenticate, authorize(ROLES.ADMIN), createShipmentHandler);
router.get("/available-vehicles", authenticate, availableShipmentVehiclesHandler);
router.get("/:id", authenticate, getShipmentHandler);
router.post(
  "/:id/containers",
  authenticate,
  authorize(ROLES.ADMIN),
  addContainerHandler,
);
router.post(
  "/:id/containers/:containerId/vehicles",
  authenticate,
  authorize(ROLES.ADMIN),
  addVehicleToContainerHandler,
);

export default router;
