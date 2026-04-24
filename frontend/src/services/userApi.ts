import api from "./api";
import { ApiResponse } from "../types/api.types";
import { User } from "../types/common.types";

export const userApi = {
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get("/users");
    return response.data;
  },
  updateRole: async (id: string, role: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },
};
