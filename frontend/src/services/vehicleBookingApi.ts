import api from "./api";

export type VehicleBookingStatus =
  | "pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "delivered";

export interface VehicleBookingItem {
  _id: string;
  orderId: string;
  vehicleId: string;
  vehicleIndex: number;
  status: VehicleBookingStatus;
  quotationFile?: string;
  rejectionReason?: string;
  paymentAmount?: number;
  paymentReference?: string;
  engineNumber?: string;
  chassisNumber?: string;
  lastReminderAt?: string;
  reminderCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const vehicleBookingApi = {
  getByOrder: async (orderId: string): Promise<VehicleBookingItem[]> => {
    const response = await api.get(`/vehicle-bookings/order/${orderId}`);
    return response.data;
  },

  getById: async (bookingId: string): Promise<VehicleBookingItem> => {
    const response = await api.get(`/vehicle-bookings/${bookingId}`);
    return response.data;
  },

  uploadQuotation: async (bookingId: string, file: File) => {
    const formData = new FormData();
    formData.append("quotation", file);
    const response = await api.post(
      `/vehicle-bookings/${bookingId}/quotation`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data as VehicleBookingItem;
  },

  approve: async (bookingId: string) => {
    const response = await api.post(`/vehicle-bookings/${bookingId}/approve`);
    return response.data as VehicleBookingItem;
  },

  reject: async (bookingId: string, reason: string) => {
    const response = await api.post(`/vehicle-bookings/${bookingId}/reject`, {
      reason,
    });
    return response.data as VehicleBookingItem;
  },

  confirmPayment: async (bookingId: string, amount: number) => {
    const response = await api.post(
      `/vehicle-bookings/${bookingId}/confirm-payment`,
      {
        amount,
      },
    );
    return response.data as VehicleBookingItem;
  },

  updateChassisEngine: async (
    bookingId: string,
    payload: { chassisNumber?: string; engineNumber?: string },
  ) => {
    const response = await api.patch(
      `/vehicle-bookings/${bookingId}/chassis-engine`,
      payload,
    );
    return response.data as VehicleBookingItem;
  },

  updateStatus: async (bookingId: string, status: VehicleBookingStatus) => {
    const response = await api.patch(`/vehicle-bookings/${bookingId}/status`, {
      status,
    });
    return response.data as VehicleBookingItem;
  },

  getDueReminders: async (orderId: string, hours = 2) => {
    const response = await api.get(
      `/vehicle-bookings/order/${orderId}/chassis-reminders`,
      {
        params: { hours },
      },
    );
    return response.data as VehicleBookingItem[];
  },
};
