import { Router } from "express";
import {
  createVehicleListItem,
  getVehicleListItems,
  getVehicleOrderFormOptions,
  getVehicleListItemById,
  updateVehicleListItem,
} from "../controllers/vehicle-list.controller";

const router = Router();

router.post("/", createVehicleListItem);
router.get("/", getVehicleListItems);
router.get("/order-options", getVehicleOrderFormOptions);
router.get("/:id", getVehicleListItemById);
router.put("/:id", updateVehicleListItem);

export default router;
