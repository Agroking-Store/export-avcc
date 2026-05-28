import api from "../../services/api";

export interface VehicleListItem {
  _id: string;
  brandName: string;
  modelName: string;
  variant: string;
  color: string;
  engineCapacity?: string;
  commercialHsnCode: string;
  exportHsnCode: string;
  hsnCode?: string;
  quantity: number;
  fobAmount?: number;
  freight?: number;
  igstRate?: 5 | 18 | 40;
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
    engineCapacity?: string;
    commercialHsnCode: string;
    exportHsnCode: string;
    hsnCode?: string;
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
    status?: string;
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
    engineCapacity?: string;
    commercialHsnCode: string;
    exportHsnCode: string;
    quantity?: number;
    fobAmount?: number;
    freight?: number;
    igstRate?: number;
  }) => {
    const response = await api.post("/vehicle-list", payload);
    return response.data;
  },

  createVehiclesBulk: async (
    vehicles: Array<{
      brandName: string;
      modelName: string;
      variant: string;
      color: string;
      engineCapacity?: string;
      commercialHsnCode: string;
      exportHsnCode: string;
      quantity?: number;
      fobAmount?: number;
      freight?: number;
      igstRate?: number;
    }>,
  ) => {
    const response = await api.post("/vehicle-list/bulk", { vehicles });
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
      engineCapacity: string;
      commercialHsnCode: string;
      exportHsnCode: string;
      quantity: number;
      fobAmount: number;
      freight: number;
      igstRate: number;
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
    const response = await api.post("/vehicle-orders", payload, {
      skipGlobalErrorToast: true,
    } as any);
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

  deleteVehicleListItem: async (id: string) => {
    // Uses the existing 'api' instance which includes headers and baseUrl
    const response = await api.delete(`/vehicle-list/${id}`);
    return response.data;
  },

  deleteVehicleOrder: async (id: string) => {
    // Uses the existing 'api' instance
    const response = await api.delete(`/vehicle-orders/${id}`);
    return response.data;
  },
};
