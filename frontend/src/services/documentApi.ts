import api from "./api";

export interface UnifiedDocument {
  id: string;
  fileName: string;
  documentType: string;
  documentTypeName: string;
  relatedEntity: string;
  relatedEntityId: string;
  relatedEntityType: "vehicle_booking" | "proforma_invoice" | "invoice";
  uploadDate: string;
  uploadedBy: string;
  fileSize?: number;
  downloadUrl: string;
  viewUrl: string;
  buyerName: string;
}

export interface DocumentListResponse {
  data: UnifiedDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const documentApi = {
  fetchDocuments: async (params?: {
    search?: string;
    docType?: string;
    entityType?: string;
    sortBy?: "name" | "date";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  }): Promise<DocumentListResponse> => {
    const response = await api.get("/documents", { params });
    return response.data;
  },
};
