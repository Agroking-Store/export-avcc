export const validateCreateDealer = (data: any) => {
  if (!data.name || !data.contact || !data.gstNumber) {
    throw new Error("Name, contact and GST number are required");
  }
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(data.gstNumber)) {
    throw new Error("Invalid GST number format");
  }
};

export const validateUpdateDealer = (data: any) => {
  if (Object.keys(data).length === 0) {
    throw new Error("Update data required");
  }
  if (data.gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(data.gstNumber)) {
      throw new Error("Invalid GST number format");
    }
  }
};