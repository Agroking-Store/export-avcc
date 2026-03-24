import { User, IUser } from "../models/User.model";
import { RegisterDTO, LoginDTO, AuthResponseDTO } from "../dto/auth.dto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../middleware/error.middleware";

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponseDTO> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Create user
    const user = await User.create(data);

    // Generate tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    // Find user with password
    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(token);

      // Find user
      const user = await User.findById(decoded.id).select("+refreshToken");
      if (!user || user.refreshToken !== token) {
        throw new AppError("Invalid refresh token", 401);
      }

      // Generate new tokens
      const payload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async updateProfile(
    userId: string,
    data: Partial<RegisterDTO>,
  ): Promise<IUser> {
    // Remove sensitive fields
    const { password, role, ...updateData } = data;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }
}
