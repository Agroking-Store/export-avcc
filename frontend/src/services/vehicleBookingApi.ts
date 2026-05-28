import api from "./api";

export type VehicleBookingStatus =
  | "pending"
  | "quotation_details_pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "shipped"
  | "delivered";

export interface VehicleBookingItem {
  _id: string;
  orderId:
    | string
    | {
        _id?: string;
        orderNumber?: string;
        vehicleSnapshot?: {
          brandName?: string;
          modelName?: string;
          variant?: string;
          color?: string;
          engineCapacity?: string;
        };
      };
  vehicleId: string;
  vehicleIndex: number;
  usdRate?: number;

  assignedClientId?: string;
  assignedClientSnapshot?: {
    name: string;
    companyName?: string;
    clientCode?: string;
  };
  assignedDealerId?: string;
  assignedDealerSnapshot?: {
    name: string;
    contact?: string;
    gstNumber?: string;
  };
  status: VehicleBookingStatus;
  quotationFile?: string;
  quotationDetails?: {
    dealershipName?: string;
    brand?: string;
    carModelName?: string;
    /** Replaces driveLink – colour fetched from vehicleSnapshot */
    carColour?: string;
    /** Ex-Showroom price entered by user; drives basicValue & carGst auto-calculation */
    exShowroomPrice?: number;
    /** GST rate (%) fetched from vehicle list item (igstRate) */
    gstRate?: number;
    netCost?: {
      basicValue?: number;
      handlingCharges?: number;
      crtm?: number;
      insurance?: number;
      registrationCost?: number;
      cashComponent?: number;
      bureauVeritas?: number;
      shippingCost?: number;
      total?: number;
    };
    taxAmount?: {
      carGst?: number;
      bureauVeritasGst?: number;
      shippingGst?: number;
      insuranceGst?: number;
      tcs?: number;
      total?: number;
    };
    grandTotal?: number;
    savedAt?: string;
  };
  rejectionReason?: string;
  bookingAmount?: number;
  paymentAmount?: number;
  payments?: Array<{
    amount: number;
    date: string;
    reference?: string;
    remarks?: string;
  }>;
  paymentReference?: string;
  engineNumber?: string;
  chassisNumber?: string;
  deliveryDate?: string;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: string;
  commercialHsnCode?: string;
  exportHsnCode?: string;
  hsnCode?: string;
  lastReminderAt?: string;
  reminderCount?: number;
  documents?: {
    form20?: string;
    form21?: string;
    form22?: string;
    tempRegCert?: string;
    bvCertificate?: string;
    dealerInvoice?: string;
  };
  isCRTMUploaded?: boolean;
  isBVUploaded?: boolean;
  isDealerInvoiceUploaded?: boolean;
  piGenerated?: boolean;
  associatedPIs?: Array<{
    _id: string;
    piNumber?: string;
    status?: string;
    hblPath?: string;
    pdfPath?: string;
  }>;
  commercialInvoices?: Array<{
    _id: string;
    invoiceNumber: string;
    type: string;
  }>;
  invoiceReadiness?: {
    INR: boolean;
    USD: boolean;
    COMMERCIAL: boolean;
    PACKING_LIST: boolean;
    isComplete: boolean;
  };
  canShip?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationDetailsPayload {
  dealershipName: string;
  brand: string;
  carModelName: string;
  /** Replaces driveLink – colour fetched from vehicleSnapshot */
  carColour?: string;
  /** Ex-Showroom price entered by user */
  exShowroomPrice?: number;
  /** GST rate (%) fetched from vehicle list item */
  gstRate?: number;
  usdRate?: number;
  netCost: {
    basicValue?: number | string;
    handlingCharges?: number | string;
    crtm?: number | string;
    insurance?: number | string;
    registrationCost?: number | string;
    cashComponent?: number | string;
    bureauVeritas?: number | string;
    shippingCost?: number | string;
    total?: number | string;
  };
  taxAmount: {
    carGst?: number | string;
    bureauVeritasGst?: number | string;
    shippingGst?: number | string;
    insuranceGst?: number | string;
    tcs?: number | string;
    total?: number | string;
  };
  grandTotal?: number | string;
  bookingAmount?: number;
}

export const vehicleBookingApi = {
  getAllBookings: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    vehicleId?: string;
    vehicle?: string;
    color?: string;
    engineNumber?: string;
    chassisNumber?: string;
    dealer?: string;
    client?: string;
  }): Promise<{
    data: VehicleBookingItem[];
    total: number;
    page: number;
    totalPages: number;
    stats?: {
      deliveredTotal: number;
      piReadyTotal: number;
      totalAll: number;
    };
  }> => {
    const response = await api.get("/vehicle-bookings", { params });
    return response.data;
  },

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

  saveQuotationDetails: async (
    bookingId: string,
    payload: QuotationDetailsPayload,
  ) => {
    const response = await api.patch(
      `/vehicle-bookings/${bookingId}/quotation-details`,
      payload,
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
      { amount },
    );
    return response.data as VehicleBookingItem;
  },

  updateChassisEngine: async (
    bookingId: string,
    payload: {
      chassisNumber?: string;
      engineNumber?: string;
      deliveryDate?: string;
      engineCapacity?: string;
      fuelType?: string;
      countryOfOrigin?: string;
      yom?: string;
      commercialHsnCode?: string;
      exportHsnCode?: string;
    },
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

  delete: async (bookingId: string) => {
    const response = await api.delete(`/vehicle-bookings/${bookingId}`);
    return response.data;
  },

  assignClient: async (bookingId: string, clientId: string) => {
    const response = await api.patch(
      `/vehicle-bookings/${bookingId}/assign-client`,
      { clientId },
    );
    return response.data as VehicleBookingItem;
  },

  assignDealer: async (bookingId: string, dealerId: string) => {
    const response = await api.patch(
      `/vehicle-bookings/${bookingId}/assign-dealer`,
      { dealerId },
    );
    return response.data as VehicleBookingItem;
  },

  getDueReminders: async (orderId: string, hours = 2) => {
    const response = await api.get(
      `/vehicle-bookings/order/${orderId}/chassis-reminders`,
      { params: { hours } },
    );
    return response.data as VehicleBookingItem[];
  },

  addPayment: async (
    bookingId: string,
    payload: {
      amount: number;
      date?: string;
      reference?: string;
      remarks?: string;
    },
  ): Promise<VehicleBookingItem> => {
    const response = await api.post(
      `/vehicle-bookings/${bookingId}/payments`,
      payload,
    );
    return response.data as VehicleBookingItem;
  },
};
