export interface IVehicleItem {
  name: string;
  color: string;
  quantity: number;
}

export interface CreateOrderDto {
  clientId: string;
  date: string;
  vehicles: IVehicleItem[];
}

export interface UpdateOrderDto {
  clientId?: string;
  date?: string | Date;
  vehicles?: IVehicleItem[];
}

