import express from "express";
import multer from "multer";
import { uploadLC } from "../controllers/lc.controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// router.post("/upload/:id", upload.single("file"), uploadLC);
router.post("/:id/lc", upload.single("lcFile"), uploadLC);

export default router;