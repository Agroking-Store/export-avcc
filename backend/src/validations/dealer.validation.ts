const validateDealerBankDetails = (bankDetails: any, isRequired = false) => {
  if (!bankDetails || typeof bankDetails !== "object") {
    if (isRequired) {
      throw new Error("Dealer bank details are required");
    }
    return;
  }

  if (
    !bankDetails.bankName ||
    !bankDetails.accountNo ||
    !bankDetails.branchIfsc
  ) {
    throw new Error(
      "Bank name, account number and branch/IFSC are required",
    );
  }
};

const isValidPhone = (value: string) => /^[0-9]{10,15}$/.test(value.replace(/\D/g, ""));

export const validateCreateDealer = (data: any) => {
  if (!data.name || !data.contact || !data.gstNumber) {
    throw new Error("Name, contact and GST number are required");
  }
  if (!isValidPhone(data.contact)) {
    throw new Error("Contact must be 10-15 digits");
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    throw new Error("Invalid email format");
  }
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(data.gstNumber)) {
    throw new Error("Invalid GST number format");
  }
  validateDealerBankDetails(data.bankDetails, true);
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
  if (data.bankDetails) {
    validateDealerBankDetails(data.bankDetails, false);
  }
};
