import api from "./api";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "../types/auth.types";
import { ApiResponse } from "../types/api.types";
import { User } from "../types/common.types";

export const authApi = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post("/auth/register", data, {
      skipGlobalErrorToast: true,
    } as any);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};
