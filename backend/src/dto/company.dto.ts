export interface IAddressDetailsDto {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface CreateCompanyDto {
  name: string;
  email?: string;
  phone?: string;
  address?: IAddressDetailsDto;
  gstNumber?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: IAddressDetailsDto;
  gstNumber?: string;
}
