import { User } from "../models/User.model";
import { UserRole } from "../types/common.types";

export class UserService {
  async getAllUsers() {
    return await User.find().select("-password").sort({ createdAt: -1 });
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
}
