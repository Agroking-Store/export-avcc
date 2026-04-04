export interface IAddressDetails {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface Company {
  _id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  // country?: string; // Removed as it's part of address now
  address?: IAddressDetails;
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
  gstNumber: string;
}

export interface UpdateCompanyForm {
  name?: string;
  email?: string;
  phone?: string;
  // country?: string; // Removed as it's part of address now
  address?: IAddressDetails;
  gstNumber?: string;
}
