import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  downloadOrderPDF,
} from "../controllers/order.controller";

const router = Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
router.patch("/:id/status", updateOrderStatus);
router.get("/:id/pdf", downloadOrderPDF);

export default router;
