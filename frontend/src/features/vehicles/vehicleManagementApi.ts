import api from "../../services/api";

export interface VehicleListItem {
  _id: string;
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  quantity: number;
  status: "Available" | "Out of Stock";
  createdAt: string;
}

export interface VehicleOrderItem {
  _id: string;
  orderNumber: string;
  clientId?: string;
  vehicleId: string;
  orderDate?: string;
  quantity: number;
  status: "Pending" | "Confirmed" | "Completed";
  clientSnapshot?: {
    name: string;
    companyName?: string;
  };
  vehicleSnapshot: {
    brandName: string;
    modelName: string;
    variant: string;
    color: string;
  };
}

export interface VehicleManagementFormOptions {
  clients: Array<{
    _id: string;
    name: string;
    companyName?: string;
  }>;
  vehicles: VehicleListItem[];
}

export const vehicleManagementApi = {
  getVehicleList: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/vehicle-list", { params });
    return response.data;
  },

  createVehicle: async (payload: {
    brandName: string;
    modelName: string;
    variant: string;
    color: string;
    quantity?: number;
  }) => {
    const response = await api.post("/vehicle-list", payload);
    return response.data;
  },

  getVehicleById: async (id: string) => {
    const response = await api.get(`/vehicle-list/${id}`);
    return response.data;
  },

  updateVehicle: async (
    id: string,
    payload: Partial<{
      brandName: string;
      modelName: string;
      variant: string;
      color: string;
      quantity: number;
    }>,
  ) => {
    const response = await api.put(`/vehicle-list/${id}`, payload);
    return response.data;
  },

  getVehicleOrders: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/vehicle-orders", { params });
    return response.data;
  },

  createVehicleOrder: async (payload: {
    clientId?: string;
    vehicleId: string;
    orderDate?: string;
    quantity: number;
  }) => {
    const response = await api.post("/vehicle-orders", payload);
    return response.data;
  },

  getVehicleOrderById: async (id: string) => {
    const response = await api.get(`/vehicle-orders/${id}`);
    return response.data;
  },

  updateVehicleOrder: async (
    id: string,
    payload: {
      clientId?: string;
      vehicleId: string;
      orderDate?: string;
      quantity: number;
      status?: "Pending" | "Confirmed" | "Completed";
    },
  ) => {
    const response = await api.put(`/vehicle-orders/${id}`, payload);
    return response.data;
  },

  getOrderOptions: async (): Promise<VehicleManagementFormOptions> => {
    const response = await api.get("/vehicle-list/order-options");
    return response.data;
  },
};
