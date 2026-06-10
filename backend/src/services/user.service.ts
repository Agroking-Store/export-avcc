import { ROLES } from "../config/constants";
import { User } from "../models/User.model";
import { UserRole } from "../types/common.types";

const STAFF_ROLES = [ROLES.ADMIN, ROLES.SOURCING, ROLES.ACCOUNTANT];

export class UserService {
  async getAllUsers() {
    return await User.find({ role: { $in: STAFF_ROLES } })
      .select("-password")
      .sort({ createdAt: -1 });
  }

  async getUserDetails(userId: string) {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUser(userId: string, payload: any) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Allow updating basic fields. If password is provided, update it.
    const { name, email, phone, role, password } = payload || {};

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.role = role ?? user.role;

    if (password) {
      user.password = password;
    }

    await user.save();

    const updated = await User.findById(userId).select("-password");
    return updated;
  }

  async deleteUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.role === "admin") {
      throw new Error("Admin users cannot be deleted.");
    }

    await User.findByIdAndDelete(userId);
  }
}

