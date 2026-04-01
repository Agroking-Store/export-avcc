export interface IVehicleItem {
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
}

export interface CreateOrderDto {
  clientId?: string;
  dealerId?: string;
  date: string;
  vehicles: IVehicleItem[];
}

export interface UpdateOrderDto {
  clientId?: string;
  date?: string | Date;
  dealerId?: string;
  vehicles?: IVehicleItem[];
}