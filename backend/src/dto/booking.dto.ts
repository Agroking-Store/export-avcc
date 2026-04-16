export interface CreateBookingDto {
  dealerId: string;
  date: string;
  vehicles: Array<{
    hsnCode: string;
    name: string;
    color: string;
    chassisNo: string;
    engineNo: string;
    engineCapacity?: string;
    fuelType?: string;
    countryOfOrigin?: string;
    yom: number;
    fobAmount: number;
    freight: number;
    quantity: number;
    srNo?: string;
  }>;
  status?: 'Draft' | 'Booked';
  orderId?: string;
}

export interface UpdateBookingDto {
  dealerId?: string;
  date?: string;
  vehicles?: Array<{
    hsnCode: string;
    name: string;
    color: string;
    chassisNo: string;
    engineNo: string;
    engineCapacity?: string;
    fuelType?: string;
    countryOfOrigin?: string;
    yom: number;
    fobAmount: number;
    freight: number;
    quantity: number;
    srNo?: string;
  }>;
  status?: 'Draft' | 'Booked';
}