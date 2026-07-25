import { apiConfig } from "@/config/apiConfig";
import api from "@/services/api";
import type {
  GeneratedInvoiceRecord,
  InvoiceManualFields,
  InvoiceType,
  PIInvoiceContext,
} from "./invoice.types";

export const invoiceApi = {
  async getPIContext(piId: string) {
    const res = await api.get<PIInvoiceContext>(`/pi/${piId}`);
    return res.data;
  },

  async getPIInvoices(piId: string) {
    const res = await api.get<GeneratedInvoiceRecord[]>(`/invoices/${piId}`);
    return res.data;
  },

  async generateInvoice(payload: {
    piId: string;
    vehicleId: string;
    type: InvoiceType;
    manualFields: InvoiceManualFields;
    replaceExisting?: boolean;
  }) {
    const res = await api.post<{
      success: boolean;
      invoiceId: string;
      invoiceNumber: string;
      downloadUrl: string;
    }>("/invoices/generate", payload);
    return res.data;
  },

  async generatePackingList(payload: {
    piId: string;
    vehicleIds: string[];
    manualFields?: Record<string, any>;
    replaceExisting?: boolean;
  }) {
    const res = await api.post<{
      success: boolean;
      invoiceId: string;
      invoiceNumber: string;
      packingListUrl: string;
    }>("/packing-list/generate", payload);
    return res.data;
  },

  getInvoiceViewUrl(invoiceId: string, download = false) {
    return `${apiConfig.baseURL}/invoices/${invoiceId}/download${download ? "?download=true" : ""}`;
  },

  getPackingListViewUrl(invoiceId: string, download = false) {
    return `${apiConfig.baseURL}/invoices/${invoiceId}/download-packing${download ? "?download=true" : ""}`;
  },

  async downloadFile(url: string, fileName: string) {
    const res = await api.get(url, {
      responseType: "blob",
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
