export interface VehicleDto {
  name: string;
  color: string;
  quantity: number;
  hsnCode?: string;
  vehicleName?: string;
  exteriorColour?: string;
  chassisNo?: string;
  engineNo?: string;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: string;
  fobAmount?: number;
  freight?: number;
}

export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
}

export interface CreateOrderDto {
  clientId?: string;
  dealerId?: string;
  date: string;
  // vehicles: IVehicleItem[];
  vehicles: VehicleDto[];
}

export interface UpdateOrderDto {
  clientId?: string;
  date?: string | Date;
  dealerId?: string;
  // vehicles?: IVehicleItem[];
  vehicles: VehicleDto[];
}
