export interface IClientAddress {
  houseBuilding?: string;
  streetArea?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IClient {
  _id: string;
  clientCode: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  companyName: string;
  address: IClientAddress;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
