import { AddressDetails, PIForm, VehicleLineItem } from "./pi.types";

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];

export const defaultAddress: AddressDetails = {
  houseBuilding: "",
  streetArea: "",
  cityTown: "",
  state: "",
  pincode: "",
  country: "",
};

export const defaultPIForm: PIForm = {
  piNumber: "",
  client_id: "",
  company_id: "",
  paymentTerms: "",
  validityDate: getTodayIsoDate(),
  termsOfDelivery: "",
  incoterm: "CFR",
  portOfLoading: "Any Port in India",
  portOfDischarge: "COLOMBO",
  buyersRef: "",
  otherRef: "",
  dispatchedThrough: "",
  destination: "",
  vehicleDetails: [],
};

export const getRate = (v: VehicleLineItem) =>
  (Number(v.fob) || 0) + (Number(v.freight) || 0);

export const getAmount = (v: VehicleLineItem) =>
  getRate(v) * (Number(v.quantity) || 0);

export const validatePIForm = (
  form: PIForm,
): {
  isValid: boolean;
  errors: Record<string, string>;
  errorMessage?: string;
} => {
  const errors: Record<string, string> = {};

  if (!form.client_id) errors.client_id = "Client is required";

  const includedVehicles = form.vehicleDetails.filter(
    (v) => v.selected !== false,
  );

  if (includedVehicles.length === 0) {
    return {
      isValid: false,
      errors,
      errorMessage:
        "At least one vehicle must be included. Please import an order.",
    };
  }

  includedVehicles.forEach((v) => {
    const index = form.vehicleDetails.indexOf(v);
    if (!v.model.trim()) errors[`v_${index}_model`] = "Model is required";
    if (v.quantity < 1)
      errors[`v_${index}_quantity`] = "Quantity must be at least 1";
    if (getRate(v) <= 0) errors[`v_${index}_rate`] = "Rate must be > 0";
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Number to words logic abstracted out of the UI component
export const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convert(n % 100) : "")
      );
    if (n < 1000000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 1000000000)
      return (
        convert(Math.floor(n / 1000000)) +
        " Million" +
        (n % 1000000 !== 0 ? " " + convert(n % 1000000) : "")
      );
    return "";
  };
  return "USD " + convert(Math.floor(num)) + " Only";
};
