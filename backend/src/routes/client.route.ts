import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  getCurrentClient,
  updateClient,
  getLatestClients,
} from "../controllers/client.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/add", createClient);
router.get("/", getClients);
router.get("/me", authenticate, getCurrentClient);
router.get("/getLatestClients",getLatestClients)
router.get("/:id", getClientById);
router.put("/:id", updateClient);
export default router;
