export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Vehicle {
  _id?: string;
  id?: string;
  name: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  quantity: number;
  model?: string;
  make?: string;
  year?: number;
  status: 'Available' | 'Booked';
  price?: number;
  bookedBy?: string;
}

export interface VehicleStats {
  total: number;
  booked: number;
  available: number;
}

