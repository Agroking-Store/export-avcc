export const validateCreatePI = (data: any) => {
  if (!data.client_id) {
    throw new Error("Client is required");
  }

  if (!Array.isArray(data.vehicleDetails) || data.vehicleDetails.length === 0) {
    throw new Error("At least one vehicle is required");
  }

  data.vehicleDetails.forEach((v: any, index: number) => {
    if (!v.model) {
      throw new Error(`Vehicle ${index + 1}: Model is required`);
    }

    if (!v.quantity || v.quantity <= 0) {
      throw new Error(`Vehicle ${index + 1}: Quantity must be greater than 0`);
    }

    if (!v.unitPrice || v.unitPrice <= 0) {
      throw new Error(`Vehicle ${index + 1}: Unit price must be greater than 0`);
    }
  });
};