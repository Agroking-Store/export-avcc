import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";

// Vehicle interface moved to api.types.ts

export interface VehicleStats {
  total: number;
  booked: number;
  available: number;
}

export const vehicleApi = {
  getVehicles: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Vehicle[]>>> => {
    const response = await api.get("/vehicles", { params });
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<VehicleStats>> => {
    const response = await api.get("/vehicles/stats");
    return response.data;
  },

  bookVehicle: async (data: {
    vehicleId: string;
    clientId?: string;
    amount: number;
    date: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("/vehicles/book", data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Vehicle>> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  create: async (data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> => {
    const response = await api.post("/vehicles", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

