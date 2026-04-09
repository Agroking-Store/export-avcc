export interface IClientAddressDetailsDto {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface CreateClientDto {
  name: string;
  phone: string;
  country: string;
  email: string;
  companyName: string;
  address?: IClientAddressDetailsDto;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  country?: string;
  email?: string;
  companyName?: string;
  address?: IClientAddressDetailsDto;
}
