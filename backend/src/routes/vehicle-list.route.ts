import { Router } from "express";
import {
  createVehicleListItem,
  createVehicleListItems,
  getVehicleListItems,
  getVehicleOrderFormOptions,
  getVehicleListItemById,
  updateVehicleListItem,
} from "../controllers/vehicle-list.controller";

const router = Router();

router.post("/", createVehicleListItem);
router.post("/bulk", createVehicleListItems);
router.get("/", getVehicleListItems);
router.get("/order-options", getVehicleOrderFormOptions);
router.get("/:id", getVehicleListItemById);
router.put("/:id", updateVehicleListItem);

export default router;
