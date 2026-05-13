export interface IAddressDetails {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IBankDetails {
  // Exported interface
  bankName?: string;
  accountNo?: string;
  branchIfsc?: string;
}

export const defaultBankDetails: IBankDetails = {
  // Exported default value
  bankName: "",
  accountNo: "",
  branchIfsc: "",
};

export interface Company {
  _id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  // country?: string; // Removed as it's part of address now
  address?: IAddressDetails;
  bankDetails?: IBankDetails; // Added bankDetails to Company interface
  gstNumber?: string;
  isActive: boolean;
  createdAt: string; // Dates are typically strings when received from the API
  updatedAt: string; // Dates are typically strings when received from the API
}

export interface CreateCompanyForm {
  name: string;
  email: string;
  phone?: string; // Made optional as per PI form
  // country: string; // Removed as it's part of address now
  address: IAddressDetails;
  bankDetails: IBankDetails; // Made required for CreateCompanyForm as default is provided
  gstNumber: string;
  isActive?: boolean; // Added isActive for updating company status
}

export interface UpdateCompanyForm {
  name?: string;
  email?: string;
  phone?: string;
  // country?: string; // Removed as it's part of address now
  address?: IAddressDetails;
  bankDetails?: IBankDetails; // Added bankDetails to UpdateCompanyForm
  gstNumber?: string;
  isActive?: boolean; // Added isActive for updating company status
}

export interface DealerInvoiceInfo {
  _id: string;
  chassisNumber: string;
  assignedDealerSnapshot?: {
    name: string;
  };
  documents: {
    dealerInvoice: string;
  };
  createdAt: string;
}
