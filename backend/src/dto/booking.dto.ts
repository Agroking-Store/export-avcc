export interface CreateBookingDto {
  dealerId: string;
  date: string;
  bookingAmount: number;
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
  status?: 'To be Sourced' | 'Booked' | 'Payment Done' | 'Transit' | 'JNPT Warehouse' | 'Shipped' | 'Commercial Invoice Submitted';
  orderId?: string;
}

export interface UpdateBookingDto {
  dealerId?: string;
  date?: string;
  bookingAmount?: number;
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
  status?: 'To be Sourced' | 'Booked' | 'Payment Done' | 'Transit' | 'JNPT Warehouse' | 'Shipped' | 'Commercial Invoice Submitted';
}
