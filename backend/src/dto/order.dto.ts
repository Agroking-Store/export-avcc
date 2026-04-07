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

// CREATE DTO
export interface CreateOrderDto {
  clientId: string;      
  date: string;
  vehicles: VehicleDto[];
}

// UPDATE DTO
export interface UpdateOrderDto {
  clientId?: string;    
  date?: string | Date;
  vehicles?: VehicleDto[];
}