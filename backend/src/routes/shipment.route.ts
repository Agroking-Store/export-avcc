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
  getShippedVehicleDetailsHandler,
  removeContainerHandler,
  removeVehicleFromContainerHandler,
  updateShipmentHandler,
} from "../controllers/shipment.controller";
import { getCustomerNamesHandler } from "../controllers/shipmentCustomer.controller";


const router = Router();

router.get("/", authenticate, listShipmentsHandler);
router.post("/", authenticate, authorize(ROLES.ADMIN), createShipmentHandler);
router.get("/available-vehicles", authenticate, availableShipmentVehiclesHandler);
router.get("/customer-names", authenticate, getCustomerNamesHandler);

router.get("/:id", authenticate, getShipmentHandler);
router.get("/:id/shipped-details", authenticate, getShippedVehicleDetailsHandler);
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
router.delete(
  "/:id/containers/:containerId",
  authenticate,
  authorize(ROLES.ADMIN),
  removeContainerHandler,
);
router.delete(
  "/:id/containers/:containerId/vehicles/:vehicleBookingId",
  authenticate,
  authorize(ROLES.ADMIN),
  removeVehicleFromContainerHandler,
);

router.put(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  updateShipmentHandler,
);

export default router;

