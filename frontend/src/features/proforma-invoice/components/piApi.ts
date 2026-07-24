import { apiConfig } from "../../../config/apiConfig";
import { PIForm, OrderDetailData, PIDashboardOverview } from "./pi.types";
import { companyApi } from "../../company/components/companyApi";
import api from "../../../services/api";

export const piApi = {
  getClients: async (search: string) => {
    const res = await api.get("/clients", {
      params: { limit: 10, search },
    });
    return res.data?.data || res.data;
  },

  // Reusing existing companyApi for fetching companies
  getCompanies: async (search: string) => {
    const res = await companyApi.getCompanies(search, 1, 10, "name", "asc");
    return res.data || [];
  },

  getCompanyById: async (id: string) => {
    return companyApi.getCompanyById(id);
  },

  getOrders: async (search: string) => {
    const res = await api.get("/orders", {
      params: { limit: 20, search },
    });
    return res.data?.data || res.data;
  },

  getBookedVehicleOrders: async (clientId: string, search: string = "") => {
    const res = await api.get("/proforma-invoices/booked-vehicle-orders", {
      params: { clientId, search },
    });
    return res.data;
  },

  getPIById: async (id: string) => {
    const res = await api.get(`/proforma-invoices/${id}`);
    return res.data;
  },

  getOrderById: async (id: string) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  getOrderDetailWithTracking: async (
    orderId: string,
  ): Promise<OrderDetailData> => {
    const res = await api.get(`/proforma-invoices/orders/${orderId}/details`);
    return res.data;
  },

  createPI: async (payload: Partial<PIForm> & { totalAmount: number }) => {
    const res = await api.post("/proforma-invoices", payload);
    return res.data;
  },

  updatePI: async (
    id: string,
    payload: Partial<PIForm> & { totalAmount: number },
  ) => {
    const res = await api.put(`/proforma-invoices/${id}`, payload);
    return res.data;
  },

  previewPDF: (id: string) => {
    return api.get(`/proforma-invoices/${id}/pdf`, {
      responseType: "blob",
    });
  },

  getSuggestedNextPiNumber: async (companyId: string) => {
    const res = await api.get("/proforma-invoices/next-pi-number", {
      params: { companyId },
    });
    return res.data.piNumber;
  },

  getDashboardKPIs: async (timeRange: string) => {
    const res = await api.get("/proforma-invoices/dashboard-kpis", {
      params: { timeRange },
    });
    return res.data;
  },

  getDashboardOverview: async (
    timeRange: string,
  ): Promise<PIDashboardOverview> => {
    const res = await api.get("/proforma-invoices/dashboard-overview", {
      params: { timeRange },
    });
    return res.data;
  },

  getPIStatusDistribution: async (timeRange: string) => {
    const res = await api.get("/proforma-invoices/pi-status-distribution", {
      params: { timeRange },
    });
    return res.data;
  },

  getMonthlyPIValueTrend: async (timeRange: string) => {
    const res = await api.get("/proforma-invoices/monthly-pi-value-trend", {
      params: { timeRange },
    });
    return res.data;
  },

  getTopClientsByPIValue: async (timeRange: string, limit: number = 5) => {
    const res = await api.get("/proforma-invoices/top-clients-by-pi-value", {
      params: { timeRange, limit },
    });
    return res.data;
  },

  uploadLC: async (id: string, file: File, config?: any) => {
    const formData = new FormData();
    formData.append("lcFile", file);
    const res = await api.post(`/proforma-invoices/${id}/lc`, formData, config);
    return res.data;
  },

  getPIViewUrl: (id: string, download = false) => {
    const baseUrl = `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`;
    return download ? `${baseUrl}?download=true` : baseUrl;
  },

  getLCViewUrl: (id: string) => {
    return `${apiConfig.baseURL}/proforma-invoices/${id}/lc/view`;
  },

  uploadHBL: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("hblFile", file);
    const res = await api.post(`/proforma-invoices/${id}/hbl`, formData);
    return res.data;
  },

  getHBLViewUrl: (id: string) => {
    return `${apiConfig.baseURL}/proforma-invoices/${id}/hbl/view`;
  },
};

