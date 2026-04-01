import { CreateClientDto } from "../dto/client.dto";

export const validateCreateClient = (data: CreateClientDto) => {
  if (!data.name?.trim()) {
    throw new Error("Name is required");
  }

  if (!data.phone?.trim()) {
    throw new Error("Phone is required");
  }

  if (!/^[0-9]{10}$/.test(data.phone)) {
    throw new Error("Phone must be 10 digits");
  }

  if (!data.country?.trim()) {
    throw new Error("Country is required");
  }

  if (!data.email?.trim()) {
    throw new Error("Email is required");
  }

  if (!/\S+@\S+\.\S+/.test(data.email)) {
    throw new Error("Invalid email format");
  }

  if (!data.companyName?.trim()) {
    throw new Error("Company name is required");
  }

  if (!data.address?.trim()) {
    throw new Error("Address is required");
  }
};

export const validateUpdateClient = (data: any) => {
  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required to update");
  }

  if (data.phone && !/^[0-9]{10}$/.test(data.phone)) {
    throw new Error("Phone must be 10 digits");
  }

  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    throw new Error("Invalid email format");
  }
};