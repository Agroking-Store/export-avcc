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

export type PIForm = {
  piNumber: string;
  client_id: string;
  dealer_id: string;
  clientDetails: { name: string; companyName: string; address: AddressDetails };
  dealerDetails: { name: string; gstin: string; address: AddressDetails };
  paymentTerms: string;
  validityDate: string;
  termsOfDelivery: string;
  incoterm: string;
  portOfLoading: string;
  portOfDischarge: string;
  bankDetails: { bankName: string; accountNo: string; branchIfsc: string };
  vehicleDetails: VehicleLineItem[];
};
