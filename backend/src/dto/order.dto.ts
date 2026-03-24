export interface IVehicleItem {
  slNo: number;
  hsnCode: string;
  vehicleName: string;
  exteriorColour: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  countryOfOrigin: string;
  yom: number;
  fobAmount: number;
  freight: number;
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
}

export interface CreateOrderDto {
  clientId: string;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  paymentTerms: string;
  buyerRef: string;
  vehicles: IVehicleItem[];
  grandTotal: number;
  grandTotalInWords: string;
  bankName: string;
  accountNo: string;
  branch: string;
  ifscCode: string;
}

export interface UpdateOrderDto {
  clientId?: string;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  paymentTerms?: string;
  buyerRef?: string;
  vehicles?: IVehicleItem[];
  grandTotal?: number;
  grandTotalInWords?: string;
  bankName?: string;
  accountNo?: string;
  branch?: string;
  ifscCode?: string;
  status?: "Draft" | "Confirmed" | "PI Generated";
}