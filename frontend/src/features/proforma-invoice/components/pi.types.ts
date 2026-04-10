export type VehicleLineItem = {
  vehicle_id: string;
  model: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  quantity: number;
  fob: number | "";
  freight: number | "";
  hsn: string;
  yom: string;
  fuelType: string;
  countryOfOrigin: string;
  engineCapacity: string;
  selected?: boolean;
};

export type AddressDetails = {
  houseBuilding: string;
  streetArea: string;
  cityTown: string;
  state: string;
  pincode: string;
  country: string;
};

export type BankDetails = {
  bankName?: string;
  accountNo?: string;
  branchIfsc?: string;
};

export type PIForm = {
  order_id?: string; // Added to link PI to an Order
  piNumber: string;
  client_id: string;
  company_id: string;
  paymentTerms: string;
  validityDate: string;
  termsOfDelivery: string;
  incoterm: string;
  portOfLoading: string;
  buyersRef: string;
  otherRef: string;
  dispatchedThrough: string;
  destination: string;
  portOfDischarge: string;
  vehicleDetails: VehicleLineItem[];
  // Snapshot of client details for independent editing within the PI
  clientSnapshot?: {
    name?: string;
    companyName?: string;
    clientCode?: string;
    email?: string;
    phone?: string;
    address?: AddressDetails;
  };
  // Snapshot of company details for independent editing within the PI
  companySnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: AddressDetails;
    bankDetails?: BankDetails;
    gstNumber?: string;
  };
};

// This type is for the Proforma Invoice data fetched from the API
export interface ProformaInvoiceAPI {
  _id: string;
  piNumber: string;
  order_id?: string | { _id: string; orderId: string }; // Updated to support populated object
  client_id:
    | string
    | {
        _id: string;
        name: string;
        clientCode: string;
        email?: string;
        phone?: string;
        country?: string;
        address?: AddressDetails;
        companyName?: string;
      }; // Can be populated or just ID
  company_id?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        address?: AddressDetails;
        bankDetails?: BankDetails;
        gstNumber?: string;
      };
  // Snapshot of client details stored with the PI
  clientSnapshot?: {
    name?: string;
    companyName?: string;
    clientCode?: string;
    email?: string;
    phone?: string;
    address?: AddressDetails;
  };
  // Snapshot of company details stored with the PI
  companySnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: AddressDetails;
    bankDetails?: BankDetails;
    gstNumber?: string;
  }; // Can be populated or just ID
  vehicleDetails: VehicleLineItem[];
  totalAmount: number;
  amountInWords?: string;
  currency: string;
  paymentTerms?: string;
  termsOfDelivery?: string;
  incoterm?: string;
  buyersRef?: string;
  otherRef?: string;
  dispatchedThrough?: string;
  destination?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  validityDate?: string; // API might return as string
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "sent_to_buyer"
    | "lc_received"
    | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithPIStatus {
  _id: string;
  orderId: string;
  voucherNo: string;
  date: string; // Assuming date comes as a string from the backend
  client: { name: string; companyName?: string; clientCode?: string };
  dealer: { name: string };
  totalVehiclesInOrder: number;
  totalVehiclesPIed: number;
  pendingVehicles: number;
  overallPIStatus: string;
  createdAt: string; // Added for 'Created' column
  updatedAt: string; // Added for 'Last Updated' column
}

// New interfaces for Order Detail with Tracking
export interface AssociatedPI {
  piId: string;
  piNumber: string;
  createdAt: string;
}

export interface VehicleTracking {
  _id: string;
  make: string;
  model: string;
  chassisNo: string;
  engineNo: string;
  color: string;
  hsn: string;
  yom: string;
  fuelType: string;
  countryOfOrigin: string;
  engineCapacity: string;
  fob: number;
  freight: number;
  quantity: number;
  bookingStatus: "Booked" | "Draft";
  piStatus: "PI'd" | "Pending";
  associatedPIs: AssociatedPI[];
}

export interface OrderDetailData {
  _id: string;
  orderId: string;
  voucherNo: string;
  client: { _id: string; name: string; clientCode: string };
  dealer: { name: string };
  createdAt: string;
  totalVehiclesInOrder: number;
  totalVehiclesPIed: number;
  pendingVehicles: number;
  overallPIStatus: string;
  vehicleTracking: VehicleTracking[];
}
