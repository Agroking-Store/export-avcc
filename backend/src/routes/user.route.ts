import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { ROLES } from "../config/constants";

const router = Router();
const userController = new UserController();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", userController.getUsers);
router.patch("/:id/role", userController.updateRole);

export default router;
