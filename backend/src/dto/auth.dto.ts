import type { UserRole } from "../types/common.types";
import type {
  ClientProfileInput,
  DealerProfileInput,
} from "../services/profile-sync.service";

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  clientProfile?: ClientProfileInput;
  dealerProfile?: DealerProfileInput;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}
