import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from "../validations/auth.validation";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken,
);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put("/change-password", authenticate, authController.changePassword);

export default router;
