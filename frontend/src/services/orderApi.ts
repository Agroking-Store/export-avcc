import api from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";

export interface Order {
  _id: string;
  orderId: string;
  dealerId?: string;
  date?: string;
  vehicles: Array<{
    name: string;
    color: string;
    quantity?: number;
  }>;
  status?: string;
  // Add other fields as needed
}

export const orderApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Order[]>>> => {
    const response = await api.get("/orders", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: Partial<Order>): Promise<ApiResponse<Order>> => {
    const response = await api.post("/orders", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

