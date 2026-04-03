import { CreateOrderDto, UpdateOrderDto } from "../dto/order.dto";

export const validateCreateOrder = (data: CreateOrderDto) => {
  if (!data.date) {
    throw new Error("Date is required");
  }

  if (!data.clientId && !data.dealerId) {
    throw new Error("Client or Dealer is required");
  }

  if (!data.vehicles || data.vehicles.length === 0) {
    throw new Error("At least one vehicle is required");
  }

  data.vehicles.forEach((v, i) => {
    if (!v.name) {
      throw new Error(`Vehicle ${i + 1}: name required`);
    }
    if (!v.color) {
      throw new Error(`Vehicle ${i + 1}: color required`);
    }
    if (!v.quantity || v.quantity < 1) {
      throw new Error(`Vehicle ${i + 1}: quantity must be at least 1`);
    }
  });
};

export const validateUpdateOrder = (data: UpdateOrderDto) => {
  if (Object.keys(data).length === 0) {
    throw new Error("Update data required");
  }

  if (data.vehicles) {
    if (data.vehicles.length === 0) {
      throw new Error("At least one vehicle is required");
    }

    data.vehicles.forEach((v, i) => {
      if (!v.name) {
        throw new Error(`Vehicle ${i + 1}: name required`);
      }
      if (!v.color) {
        throw new Error(`Vehicle ${i + 1}: color required`);
      }
      if (!v.quantity || v.quantity < 1) {
        throw new Error(`Vehicle ${i + 1}: quantity must be at least 1`);
      }
    });
  }

  // Validate individual expanded vehicle color update
  if (data.vehicleColorUpdate) {
    const { expandedIndex, color } = data.vehicleColorUpdate;
    if (expandedIndex < 0) {
      throw new Error("expandedIndex must be non-negative");
    }
    if (!color || color.trim() === "") {
      throw new Error("color is required for vehicleColorUpdate");
    }
  }

  if (data.vehiclesUpdate) {
    const { index } = data.vehiclesUpdate;
    if (index < 0) {
      throw new Error("Vehicle index must be non-negative");
    }
    if (!data.vehiclesUpdate.color && !data.vehiclesUpdate.name && !data.vehiclesUpdate.srNo) {
      throw new Error("At least one vehicle field (color, name, or srNo) must be provided");
    }
  }
};