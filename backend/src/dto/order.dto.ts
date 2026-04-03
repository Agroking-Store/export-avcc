export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
  srNo?: string;
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
}