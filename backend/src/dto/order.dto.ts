export interface VehicleDto {
  name: string;
  color: string;
  quantity: number;
  srNo?: number | null;
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

// export interface IVehicleItem {
//   name: string;
//   color: string;
//   quantity: number;
//   srNo?: string;
// }

export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
  srNo?: string;
  expandedIndex: number;
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
  dealerId?: string;
  vehicles?: IVehicleItem[];
  // NEW: update color for a specific expanded vehicle slot
  vehicleColorUpdate?: {
    expandedIndex: number; // position in expanded list (0,1,2...)
    color: string;
  };
  // Keep old vehiclesUpdate for backward compat (name/srNo edits)
  vehiclesUpdate?: {
    index: number;
    color?: string;
    name?: string;
    srNo?: string;
  };
  // vehicles?: VehicleDto[];
}
