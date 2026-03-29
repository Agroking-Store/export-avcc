import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleStats,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  bookVehicle
} from "../controllers/vehicle.controller";
import { 
  validateCreateVehicle, 
  validateUpdateVehicle, 
  validateBookVehicle 
} from "../validations/vehicle.validation";
import { authenticate as authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", validateCreateVehicle, createVehicle);
router.get("/", getVehicles);
router.get("/stats", getVehicleStats);
router.get("/:id", getVehicle);
router.put("/:id", validateUpdateVehicle, updateVehicle);
router.delete("/:id", deleteVehicle);
router.post("/book", validateBookVehicle, bookVehicle);

export default router;

