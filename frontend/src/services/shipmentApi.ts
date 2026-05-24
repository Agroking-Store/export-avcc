import api from "./api";
import {
  ShippingDetail,
  ShippingDetailForm,
  ShipmentVehicleBooking,
} from "../features/shipment-plan/pages/shipmentData";

export const shipmentApi = {
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ShippingDetail[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get("/shipments", { params });
    return response.data;
  },

  create: async (payload: ShippingDetailForm): Promise<ShippingDetail> => {
    const response = await api.post("/shipments", payload);
    return response.data;
  },

  getById: async (shipmentId: string): Promise<ShippingDetail> => {
    const response = await api.get(`/shipments/${shipmentId}`);
    return response.data;
  },

  addContainer: async (
    shipmentId: string,
    containerNumber: string,
  ): Promise<ShippingDetail> => {
    const response = await api.post(`/shipments/${shipmentId}/containers`, {
      containerNumber,
    });
    return response.data;
  },

  getAvailableVehicles: async (): Promise<ShipmentVehicleBooking[]> => {
    const response = await api.get("/shipments/available-vehicles");
    return response.data;
  },

  getShippedDetails: async (shipmentId: string): Promise<any> => {
    const response = await api.get(`/shipments/${shipmentId}/shipped-details`);
    return response.data;
  },

  addVehicleToContainer: async (
    shipmentId: string,
    containerId: string,
    vehicleBookingId: string,
  ): Promise<ShippingDetail> => {
    const response = await api.post(
      `/shipments/${shipmentId}/containers/${containerId}/vehicles`,
      { vehicleBookingId },
    );
    return response.data;
  },
};
