export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
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