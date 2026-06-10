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

  async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserDetails(id as string);
      return ResponseUtil.success(res, user, "User fetched successfully");
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

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await userService.updateUser(id as string, req.body);
      return ResponseUtil.success(res, updated, "User updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id as string);
      return ResponseUtil.success(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

