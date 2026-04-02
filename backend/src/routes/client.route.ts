import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
} from "../controllers/client.controller";

const router = Router();

router.post("/", createClient);
router.get("/", getClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);

export default router;