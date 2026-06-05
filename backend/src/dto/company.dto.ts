export interface IAddressDetailsDto {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IBankDetailsDto {
  bankName?: string;
  accountNo?: string;
  branchIfsc?: string;
  swiftCode?: string;
}

export interface CreateCompanyDto {
  name: string;
  email?: string;
  phone?: string;
  address?: IAddressDetailsDto;
  bankDetails?: IBankDetailsDto; // Added bankDetails to DTO
  gstNumber?: string;
  isActive?: boolean;
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: IAddressDetailsDto;
  bankDetails?: IBankDetailsDto; // Added bankDetails to DTO
  gstNumber?: string;
  isActive?: boolean;
}