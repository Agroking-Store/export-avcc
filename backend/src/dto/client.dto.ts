export interface CreateClientDto {
  name: string;
  phone: string;
  country: string;
  email: string;       
  companyName: string; 
  address: string;        
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  country?: string;
  email?: string;
  companyName?: string;
  address?: string;
}