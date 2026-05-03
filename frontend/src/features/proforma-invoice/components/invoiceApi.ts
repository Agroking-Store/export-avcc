import axios from "axios";
import { apiConfig } from "@/config/apiConfig";
import type {
  GeneratedInvoiceRecord,
  InvoiceManualFields,
  InvoiceType,
  PIInvoiceContext,
} from "./invoice.types";

export const invoiceApi = {
  async getPIContext(piId: string) {
    const res = await axios.get<PIInvoiceContext>(
      `${apiConfig.baseURL}/pi/${piId}`,
    );
    return res.data;
  },

  async getPIInvoices(piId: string) {
    const res = await axios.get<GeneratedInvoiceRecord[]>(
      `${apiConfig.baseURL}/invoices/${piId}`,
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
    }>(`${apiConfig.baseURL}/invoices/generate`, payload);
    return res.data;
  },

  getInvoiceViewUrl(invoiceId: string) {
    return `${apiConfig.baseURL}/invoices/${invoiceId}/download`;
  },

  getPackingListViewUrl(invoiceId: string) {
    return `${apiConfig.baseURL}/invoices/${invoiceId}/download-packing`;
  },

  async downloadFile(url: string, fileName: string) {
    const res = await axios.get(url, { responseType: "blob" });
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
