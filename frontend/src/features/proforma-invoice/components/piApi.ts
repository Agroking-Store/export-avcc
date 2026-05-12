import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";
import { PIForm, OrderDetailData, PIDashboardOverview } from "./pi.types"; // Import OrderDetailData
import { companyApi } from "../../company/components/companyApi"; // Import existing companyApi

const getAuthToken = () => {
  let token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token && localStorage.getItem("user")) {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      token = userObj.token || userObj.accessToken;
    } catch (e) {}
  }
  if (token && token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  return token;
};

const authHeaders = () => ({
  headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
});

export const piApi = {
  getClients: async (search: string) => {
    const res = await axios.get(`${apiConfig.baseURL}/clients`, {
      params: { limit: 10, search },
    });
    return res.data?.data || res.data;
  },

  // Reusing existing companyApi for fetching companies
  getCompanies: async (search: string) => {
    const res = await companyApi.getCompanies(search, 1, 10, "name", "asc"); // Assuming getCompanies takes these params
    return res.data || []; // Correctly access the 'data' array from the paginated response
  },

  getCompanyById: async (id: string) => {
    return companyApi.getCompanyById(id);
  },
  getOrders: async (search: string) => {
    const res = await axios.get(`${apiConfig.baseURL}/orders`, {
      params: { limit: 20, search },
    });
    return res.data?.data || res.data;
  },

  getBookedVehicleOrders: async (clientId: string, search: string = "") => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/booked-vehicle-orders`,
      {
        params: { clientId, search },
        ...authHeaders(),
      },
    );

    return res.data;
  },

  getPIById: async (id: string) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/${id}`,
      authHeaders(),
    );
    return res.data;
  },

  getOrderById: async (id: string) => {
    const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
    return res.data;
  },

  getOrderDetailWithTracking: async (
    orderId: string,
  ): Promise<OrderDetailData> => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/orders/${orderId}/details`,
      authHeaders(),
    );
    return res.data;
  },

  createPI: async (payload: Partial<PIForm> & { totalAmount: number }) => {
    const res = await axios.post(
      `${apiConfig.baseURL}/proforma-invoices`,
      payload,
      authHeaders(),
    );
    return res.data;
  },

  updatePI: async (
    id: string,
    payload: Partial<PIForm> & { totalAmount: number },
  ) => {
    const res = await axios.put(
      `${apiConfig.baseURL}/proforma-invoices/${id}`,
      payload,
      authHeaders(),
    );
    return res.data;
  },

  previewPDF: (id: string) => {
    return axios.get(`${apiConfig.baseURL}/proforma-invoices/${id}/pdf`, {
      responseType: "blob",
      headers: getAuthToken()
        ? { Authorization: `Bearer ${getAuthToken()}` }
        : {},
    });
  },

  getSuggestedNextPiNumber: async (companyId: string) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/next-pi-number`,
      {
        params: { companyId },
        ...authHeaders(),
      },
    );
    return res.data.piNumber;
  },

  getDashboardKPIs: async (timeRange: string) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/dashboard-kpis`,
      {
        params: { timeRange },
        ...authHeaders(),
      },
    );
    return res.data;
  },

  getDashboardOverview: async (
    timeRange: string,
  ): Promise<PIDashboardOverview> => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/dashboard-overview`,
      {
        params: { timeRange },
        ...authHeaders(),
      },
    );
    return res.data;
  },

  getPIStatusDistribution: async (timeRange: string) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/pi-status-distribution`,
      {
        params: { timeRange },
        ...authHeaders(),
      },
    );
    return res.data;
  },

  getMonthlyPIValueTrend: async (timeRange: string) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/monthly-pi-value-trend`,
      {
        params: { timeRange },
        ...authHeaders(),
      },
    );
    return res.data;
  },

  getTopClientsByPIValue: async (timeRange: string, limit: number = 5) => {
    const res = await axios.get(
      `${apiConfig.baseURL}/proforma-invoices/top-clients-by-pi-value`,
      {
        params: { timeRange, limit },
        ...authHeaders(),
      },
    );
    return res.data;
  },

  uploadLC: async (id: string, file: File, config?: any) => {
    const formData = new FormData();
    formData.append("lcFile", file);

    const res = await axios.post(
      `${apiConfig.baseURL}/proforma-invoices/${id}/lc`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        ...config,
      },
    );
    return res.data;
  },

  // Inside piApi object in frontend/src/features/proforma-invoice/components/piApi.ts

  // getPIViewUrl: (id: string, download = false) => {
  //   const token = getAuthToken();
  //   const baseUrl = `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`;
  //   const params = new URLSearchParams();
  //   if (download) params.append("download", "true");
  //   if (token) params.append("token", token);
  //   return `${baseUrl}?${params.toString()}`;
  // },

  getPIViewUrl: (id: string, download = false) => {
    const baseUrl = `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`;
    return download ? `${baseUrl}?download=true` : baseUrl;
  },

  getLCViewUrl: (id: string) => {
    const token = getAuthToken();
    const baseUrl = `${apiConfig.baseURL}/proforma-invoices/${id}/lc/view`;
    const params = new URLSearchParams();
    if (token) params.append("token", token);
    return `${baseUrl}?${params.toString()}`;
  },

  uploadHBL: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("hblFile", file);
    const res = await axios.post(
      `${apiConfig.baseURL}/proforma-invoices/${id}/hbl`,
      formData,
      authHeaders(),
    );
    return res.data;
  },

  getHBLViewUrl: (id: string) => {
    return `${apiConfig.baseURL}/proforma-invoices/${id}/hbl/view`;
  },
};
