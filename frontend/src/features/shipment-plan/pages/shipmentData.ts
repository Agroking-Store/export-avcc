export type ShippingDetail = {
  _id: string;
  customerName: string;
  destinationCountry: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  shippingLine?: string;
  vesselName?: string;
  sailingDate?: string;
  arrivalDate?: string;
  containers?: ShipmentContainer[];
};

export type ShippingDetailForm = Omit<ShippingDetail, "_id" | "containers">;

export type ShipmentVehicleBooking = {
  _id: string;
  vehicleIndex: number;
  engineNumber?: string;
  chassisNumber?: string;
  status: string;
  vehicleId?: {
    brandName?: string;
    modelName?: string;
    variant?: string;
    color?: string;
  };
  orderId?: {
    orderNumber?: string;
    vehicleSnapshot?: {
      brandName?: string;
      modelName?: string;
      variant?: string;
      color?: string;
    };
  };
};

export type ShipmentContainer = {
  _id: string;
  containerNumber: string;
  vehicleBookingIds: ShipmentVehicleBooking[];
  createdAt?: string;
};

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
  required?: boolean;
}> = [
  { key: "customerName", label: "Customer Name", iconTone: "text-indigo-500", required: true },
  { key: "destinationCountry", label: "Destination", iconTone: "text-blue-500", required: true },
  { key: "portOfLoading", label: "Port Of Loading", iconTone: "text-emerald-500" },
  { key: "portOfDischarge", label: "Port Of Discharge", iconTone: "text-rose-500" },
  { key: "shippingLine", label: "Shipping Line", iconTone: "text-purple-500" },
  { key: "vesselName", label: "Vessel Name", iconTone: "text-cyan-500" },
  { key: "sailingDate", label: "Sailing Date", type: "date", iconTone: "text-amber-500" },
  { key: "arrivalDate", label: "Arrival Date", type: "date", iconTone: "text-teal-500" },
];

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB").format(date);
};

export const getShipmentVehicleLabel = (booking: ShipmentVehicleBooking) => {
  const vehicle = booking.vehicleId || booking.orderId?.vehicleSnapshot || {};
  return [vehicle.brandName, vehicle.modelName, vehicle.variant]
    .filter(Boolean)
    .join(" ")
    .trim() || `Vehicle ${booking.vehicleIndex + 1}`;
};
