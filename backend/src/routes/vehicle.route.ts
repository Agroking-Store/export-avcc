import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleStats,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  bookVehicle,
} from "../controllers/vehicle.controller";
import {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateBookVehicle,
} from "../validations/vehicle.validation";
import { authenticate as authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { uploadVehicleDocuments } from "../controllers/vehicle.controller";
import { getVehicleFile } from "../controllers/vehicle.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", validateCreateVehicle, createVehicle);
router.get("/", getVehicles);
router.get("/stats", getVehicleStats);
router.get("/:id", getVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);
router.post("/book", validateBookVehicle, bookVehicle);

router.post(
  "/:id/documents",
  upload.fields([
    { name: "form20", maxCount: 1 },
    { name: "form21", maxCount: 1 },
    { name: "form22", maxCount: 1 },
    { name: "tempRegCert", maxCount: 1 },
    { name: "bvCertificate", maxCount: 1 },
  ]),
  uploadVehicleDocuments,
);
router.get("/:id/files/:field", getVehicleFile);

export default router;
