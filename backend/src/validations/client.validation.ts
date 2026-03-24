import { CreateClientDto } from "../dto/client.dto";

export const validateCreateClient = (data: CreateClientDto) => {
  if (!data.name || !data.phone || !data.country) {
    throw new Error("Name, Phone and Country are required");
  }
};

export const validateUpdateClient = (data: any) => {
  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required to update");
  }
};