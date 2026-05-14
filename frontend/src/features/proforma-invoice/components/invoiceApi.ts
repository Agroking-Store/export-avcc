import axios from "axios";
import { apiConfig } from "@/config/apiConfig";
import { authStorage } from "@/utils/authStorage";
import type {
  GeneratedInvoiceRecord,
  InvoiceManualFields,
  InvoiceType,
  PIInvoiceContext,
} from "./invoice.types";

const getAuthToken = () => {
  const accessToken = authStorage.getToken();
  if (accessToken) {
    return accessToken;
  }

  const user = authStorage.getUser();
  return user?.token || user?.accessToken || localStorage.getItem("token");
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const appendToken = (url: string) => {
  const token = getAuthToken();
  if (!token) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

export const invoiceApi = {
  async getPIContext(piId: string) {
    const res = await axios.get<PIInvoiceContext>(
      `${apiConfig.baseURL}/pi/${piId}`,
      { headers: getAuthHeaders() },
    );
    return res.data;
  },

  async getPIInvoices(piId: string) {
    const res = await axios.get<GeneratedInvoiceRecord[]>(
      `${apiConfig.baseURL}/invoices/${piId}`,
      { headers: getAuthHeaders() },
    );
    return res.data;
  },

  async generateInvoice(payload: {
    piId: string;
    vehicleId: string;
    type: InvoiceType;
    manualFields: InvoiceManualFields;
    replaceExisting?: boolean;
  }) {
    const res = await axios.post<{
      success: boolean;
      invoiceId: string;
      downloadUrl: string;
      packingListUrl?: string;
    }>(`${apiConfig.baseURL}/invoices/generate`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  async generatePackingList(payload: {
    piId: string;
    vehicleIds: string[];
    manualFields?: Record<string, any>;
    replaceExisting?: boolean;
  }) {
    const res = await axios.post<{
      success: boolean;
      invoiceId: string;
      packingListUrl: string;
    }>(`${apiConfig.baseURL}/packing-list/generate`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getInvoiceViewUrl(invoiceId: string, download = false) {
    return appendToken(
      `${apiConfig.baseURL}/invoices/${invoiceId}/download${download ? "?download=true" : ""}`,
    );
  },

  getPackingListViewUrl(invoiceId: string, download = false) {
    return appendToken(
      `${apiConfig.baseURL}/invoices/${invoiceId}/download-packing${download ? "?download=true" : ""}`,
    );
  },

  async downloadFile(url: string, fileName: string) {
    const res = await axios.get(url, {
      responseType: "blob",
      headers: getAuthHeaders(),
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const href = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(href);
  },
};
