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
  order_id?: string; // Assuming it's just the ID string
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
