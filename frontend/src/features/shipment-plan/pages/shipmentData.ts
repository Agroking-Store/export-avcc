export type ShippingDetail = {
  id: string;
  customerName: string;
  destinationCountry: string;
  portOfLoading: string;
  portOfDischarge: string;
  shippingLine: string;
  vesselName: string;
  sailingDate: string;
  arrivalDate: string;
};

export type ShippingDetailForm = Omit<ShippingDetail, "id">;

const STORAGE_KEY = "shipmentPlanningDetails";

export const emptyShippingDetail: ShippingDetailForm = {
  customerName: "",
  destinationCountry: "",
  portOfLoading: "",
  portOfDischarge: "",
  shippingLine: "",
  vesselName: "",
  sailingDate: "",
  arrivalDate: "",
};

export const shippingFields: Array<{
  key: keyof ShippingDetailForm;
  label: string;
  type?: string;
  iconTone: string;
}> = [
  { key: "customerName", label: "Customer Name", iconTone: "text-indigo-500" },
  { key: "destinationCountry", label: "Destination", iconTone: "text-blue-500" },
  { key: "portOfLoading", label: "Port Of Loading", iconTone: "text-emerald-500" },
  { key: "portOfDischarge", label: "Port Of Discharge", iconTone: "text-rose-500" },
  { key: "shippingLine", label: "Shipping Line", iconTone: "text-purple-500" },
  { key: "vesselName", label: "Vessel Name", iconTone: "text-cyan-500" },
  { key: "sailingDate", label: "Sailing Date", type: "date", iconTone: "text-amber-500" },
  { key: "arrivalDate", label: "Arrival Date", type: "date", iconTone: "text-teal-500" },
];

export const defaultShippingDetails: ShippingDetail[] = [
  {
    id: "SP-1001",
    customerName: "Auto Direct Pvt Ltd",
    destinationCountry: "Sri Lanka",
    portOfLoading: "Chennai",
    portOfDischarge: "Colombo",
    shippingLine: "One Line",
    vesselName: "Ever Libra/083A",
    sailingDate: "2026-05-22",
    arrivalDate: "2026-05-22",
  },
];

export const getShippingDetails = (): ShippingDetail[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultShippingDetails;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : defaultShippingDetails;
  } catch {
    return defaultShippingDetails;
  }
};

export const saveShippingDetails = (details: ShippingDetail[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
};

export const getNextShipmentId = (details: ShippingDetail[]) => {
  const lastNumber = details.reduce((highest, detail) => {
    const match = detail.id.match(/SP-(\d+)/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1000);

  return `SP-${String(lastNumber + 1).padStart(4, "0")}`;
};

export const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB").format(date);
};
