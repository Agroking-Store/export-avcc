import type { User } from "./common.types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: User["role"];
  clientProfile?: {
    companyName: string;
    address: {
      houseBuilding?: string;
      streetArea?: string;
      cityTown?: string;
      state?: string;
      pincode?: string;
      country: string;
    };
  };
  dealerProfile?: {
    address?: string;
    gstNumber: string;
    bankDetails: {
      bankName: string;
      accountNo: string;
      branchIfsc: string;
    };
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
