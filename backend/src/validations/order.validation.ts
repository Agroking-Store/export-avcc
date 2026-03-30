import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";

export const validateCreateOrder = (data: CreateOrderDto) => {
  if (!data.date || !data.vehicles?.length) {
    throw new Error("date and vehicles required");
  }
  data.vehicles.forEach((v, i) => {
    if (!v.vehicleName || !v.chassisNo || !v.engineNo) {
      throw new Error(`Vehicle ${i + 1}: vehicleName, chassisNo, engineNo required`);
    }
  });
};

export const validateUpdateOrder = (data: UpdateOrderDto) => {
  if (Object.keys(data).length === 0) throw new Error("Update data required");
};