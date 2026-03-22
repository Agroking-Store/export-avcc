import express from "express";
import {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer,
} from "../controllers/dealer.controller";

const router = express.Router();

router.post("/", createDealer);
router.get("/", getDealers);
router.get("/:id", getDealerById);
router.put("/:id", updateDealer);
router.delete("/:id", deleteDealer);

export default router;