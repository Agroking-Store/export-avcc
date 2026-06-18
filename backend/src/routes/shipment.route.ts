import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";
import {
  addVehicleToShipmentHandler,
  availableShipmentVehiclesHandler,
  createShipmentHandler,
  getShipmentHandler,
  listShipmentsHandler,
  getShippedVehicleDetailsHandler,
  removeVehicleFromShipmentHandler,
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
  "/:id/vehicles",
  authenticate,
  authorize(ROLES.ADMIN),
  addVehicleToShipmentHandler,
);
router.delete(
  "/:id/vehicles/:vehicleBookingId",
  authenticate,
  authorize(ROLES.ADMIN),
  removeVehicleFromShipmentHandler,
);

router.put(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  updateShipmentHandler,
);

export default router;
