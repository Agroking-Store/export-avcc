import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { ResponseUtil } from "../utils/response";

const userService = new UserService();

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      return ResponseUtil.success(res, users, "Users fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await userService.updateUserRole(id as string, role);
      return ResponseUtil.success(res, user, "Role updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
