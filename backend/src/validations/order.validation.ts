import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";

export const validateCreateOrder = (data: CreateOrderDto) => {
  if (!data.clientId || !data.paymentTerms || !data.buyerRef || !data.vehicles || !data.bankName || !data.accountNo || !data.branch || !data.ifscCode) {
    throw new Error("clientId, paymentTerms, buyerRef, vehicles, bankName, accountNo, branch, and ifscCode are required");
  }

  if (!Array.isArray(data.vehicles) || data.vehicles.length === 0) {
    throw new Error("vehicles must be a non-empty array");
  }

  // Validate each vehicle item
  data.vehicles.forEach((vehicle, index) => {
    if (!vehicle.slNo || !vehicle.hsnCode || !vehicle.vehicleName || !vehicle.exteriorColour || !vehicle.chassisNo || !vehicle.engineNo || !vehicle.engineCapacity || !vehicle.fuelType || !vehicle.countryOfOrigin || !vehicle.yom || !vehicle.fobAmount || !vehicle.freight || !vehicle.quantity || !vehicle.ratePerUnit || !vehicle.totalAmount) {
      throw new Error(`Vehicle item at index ${index} is missing required fields`);
    }
  });
};

export const validateUpdateOrder = (data: any) => {
  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required to update");
  }

  // If vehicles are being updated, validate them
  if (data.vehicles) {
    if (!Array.isArray(data.vehicles)) {
      throw new Error("vehicles must be an array");
    }

    data.vehicles.forEach((vehicle, index) => {
      if (!vehicle.slNo || !vehicle.hsnCode || !vehicle.vehicleName || !vehicle.exteriorColour || !vehicle.chassisNo || !vehicle.engineNo || !vehicle.engineCapacity || !vehicle.fuelType || !vehicle.countryOfOrigin || !vehicle.yom || !vehicle.fobAmount || !vehicle.freight || !vehicle.quantity || !vehicle.ratePerUnit || !vehicle.totalAmount) {
        throw new Error(`Vehicle item at index ${index} is missing required fields`);
      }
    });
  }
};