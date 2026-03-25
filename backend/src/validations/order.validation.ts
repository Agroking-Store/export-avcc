import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";

export const validateCreateOrder = (data: CreateOrderDto) => {
  if (!data.clientId || !data.date || !data.vehicles?.length) {
    throw new Error("clientId, date, vehicles required");
  }
  data.vehicles.forEach((v, i) => {
    if (!v.name || !v.color || v.quantity < 1) {
      throw new Error(`Vehicle ${i+1}: name, color, quantity required`);
    }
  });
};

export const validateUpdateOrder = (data: UpdateOrderDto) => {
  if (Object.keys(data).length === 0) throw new Error("Update data required");
  if (data.vehicles) {
    data.vehicles.forEach((v, i) => {
      if (!v.name || !v.color || v.quantity < 1) {
        throw new Error(`Vehicle ${i+1}: name, color, quantity required`);
      }
    });
  }
};

