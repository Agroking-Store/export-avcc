export type InvoiceType = "INR" | "USD" | "COMMERCIAL";
export type InvoiceAssetType = InvoiceType | "PACKING_LIST";

export interface GeneratedInvoiceRecord {
  _id: string;
  vehicleId: string;
  type: InvoiceType | "PACKING_LIST";
  invoiceNumber: string;
  generatedAt: string;
  hasPackingList?: boolean;
  manualFields?: Record<string, any>;
}

export interface PIInvoiceVehicle {
  vehicleId: string;
  vehicleLineIndex: number;
  vehicleBookingId?: string;
  sourceVehicleId?: string;
  make: string;
  model: string;
  variant: string;
  colour: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  yearOfManufacture: string;
  monthYearFirstReg: string;
  commercialHsnCode: string;
  exportHsnCode: string;
  hsnCode: string;
  dbkSrNo: string;
  exportInspCertNo: string;
  exportInspCertDate: string;
  fobUSD: number;
  freightUSD: number;
  totalUSD: number;
  exShowroomINR: number;
  igstRate: number;
  igstAmountINR: number;
  totalINR: number;
  netWeightKg: string;
  grossWeightKg: string;
  dimensionsCm: string;
  quantity: number;
  displayModel: string;
  invoices: Partial<
    Record<
      InvoiceAssetType,
      GeneratedInvoiceRecord & { type: InvoiceAssetType }
    >
  >;
}

export interface PIInvoiceContext {
  _id: string;
  piNumber: string;
  piDate: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  lcNumber: string;
  lcDate: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  placeOfReceipt: string;
  termsOfDelivery: string;
  vehicles: PIInvoiceVehicle[];
  existingInvoices: GeneratedInvoiceRecord[];
  suggestedInvoiceNumber: string;
}

export interface InvoiceManualFields {
  invoiceNumber: string;
  invoiceDate: string;
  lcNumber: string;
  lcDate: string;
  lcSharedConfirmed?: boolean;
  containerNo: string;
  portOfLoading?: string;
  buyerOrderDate?: string;
  otherReference?: string;
  termsOfDelivery?: string;
  termsOfPayment?: string;
  dispatchedThrough?: string;
  destination?: string;
  commercialConsigneeName?: string;
  commercialConsigneeAddressLine1?: string;
  commercialConsigneeAddressLine2?: string;
  commercialClauses?: string;
  drawbackScheme?: string;
  rodtepSchemeCode?: string;
  endUseCode?: string;
  typeOfVehicle?: string;
  placeOfSupply?: string;
  customExchangeRate?: string;
  exShowroomINR?: string;
  igstRate?: string;
  make?: string;
  model?: string;
  variant?: string;
  colour?: string;
  engineCapacity?: string;
  fuelType?: string;
  yearOfManufacture?: string;
  monthYearFirstReg?: string;
  hsnCode?: string;
  dbkSrNo?: string;
  exportInspCertNo?: string;
  exportInspCertDate?: string;
  netWeightKg?: string;
  grossWeightKg?: string;
  dimensionsCm?: string;
  vehicleDescriptionPrefix?: string;
}
