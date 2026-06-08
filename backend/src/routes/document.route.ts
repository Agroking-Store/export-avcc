import { Router } from "express";
import { getDocuments } from "../controllers/document.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getDocuments);

export default router;
