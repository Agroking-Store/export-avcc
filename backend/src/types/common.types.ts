import {
  ROLES,
  VEHICLE_STATUS,
  INVOICE_TYPE,
  DOCUMENT_TYPE,
  VERIFICATION_STATUS,
} from "../config/constants";

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export type VehicleStatus =
  (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];
export type InvoiceType = (typeof INVOICE_TYPE)[keyof typeof INVOICE_TYPE];
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];
export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
