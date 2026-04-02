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
  quantity?: number;
}

export interface CreateOrderDto {
  clientId?: string;
  dealerId?: string;
  date: string;
  vehicles: IVehicleItem[];
}

export interface UpdateOrderDto {
  clientId?: string;
  dealerId?: string;
  date?: string;
  vehicles?: IVehicleItem[];
  vehiclesUpdate?: {
    index: number;
    color?: string;
    name?: string;
    srNo?: string;
  };
}
