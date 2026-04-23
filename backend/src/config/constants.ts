export const ROLES = {
  ADMIN: "admin",
  SOURCING: "sourcing_team",
  ACCOUNTANT: "accountant",
  CLIENT: "client",
  DEALER: "dealer",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const VEHICLE_STATUS = {
  PENDING: "pending",
  IN_PROCESS: "in_process",
  PURCHASED: "purchased",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const INVOICE_TYPE = {
  PROFORMA: "proforma",
  DEALER: "dealer",
  USD_CLIENT: "usd_client",
  INR_PORT: "inr_port",
} as const;

export const DOCUMENT_TYPE = {
  PI: "proforma_invoice",
  LC: "letter_of_credit",
  DEALER_INVOICE: "dealer_invoice",
  USD_INVOICE: "usd_invoice",
  INR_INVOICE: "inr_invoice",
  VEHICLE_RC: "vehicle_rc",
  VEHICLE_INSURANCE: "vehicle_insurance",
  CUSTOMS: "customs_document",
  OTHER: "other",
} as const;

export const GST_RATES = {
  ABOVE_1000CC: 0.4, // 40%
  BELOW_1000CC: 0.18, // 18%
} as const;

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  DISCREPANCY: "discrepancy",
} as const;
