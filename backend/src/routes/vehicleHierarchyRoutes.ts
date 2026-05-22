import { Router } from "express";
import {
  getBrands,
  addBrand,
  getModels,
  addModel,
  getVariants,
  addVariant,
  getColors,
  addColor,
} from "../controllers/vehicleHierarchyController";

const router = Router();

// Brands
router.get("/brands", getBrands);
router.post("/brands", addBrand);

// Models
router.get("/models", getModels);
router.post("/models", addModel);

// Variants
router.get("/variants", getVariants);
router.post("/variants", addVariant);

// Colors
router.get("/colors", getColors);
router.post("/colors", addColor);

export default router;
