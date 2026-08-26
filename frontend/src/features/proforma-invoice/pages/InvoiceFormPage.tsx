import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InvoiceStepBar from "../components/InvoiceStepBar";
import { invoiceApi } from "../components/invoiceApi";
import type {
  GeneratedInvoiceRecord,
  InvoiceManualFields,
  InvoiceType,
  PIInvoiceContext,
  PIInvoiceVehicle,
} from "../components/invoice.types";

const formatUsdWords = (amount: number) =>
  `Dollars ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const roundCurrency = (value: number) => Number(value.toFixed(2));

const pad = (value: number) => String(value).padStart(2, "0");

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month}-${day}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const deriveExchangeRateFromVehicle = (vehicle: PIInvoiceVehicle) => {
  if (vehicle.totalUSD > 0 && vehicle.exShowroomINR > 0) {
    return roundCurrency(vehicle.exShowroomINR / vehicle.totalUSD);
  }

  return undefined;
};

const calculateInrInvoiceAmounts = ({
  totalUSD,
  exchangeRate,
  igstRate,
}: {
  totalUSD: number;
  exchangeRate: number;
  igstRate: number;
}) => {
  const assessableINR = roundCurrency(totalUSD * exchangeRate);
  const igstAmount = roundCurrency((assessableINR * igstRate) / 100);
  const totalINR = roundCurrency(assessableINR + igstAmount);

  return {
    assessableINR,
    igstAmount,
    totalINR,
  };
};

const toIndianWords = (num: number): string => {
  const ones = [
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
  const tens = [
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

  const underThousand = (value: number): string => {
    if (value < 20) return ones[value];
    if (value < 100) {
      return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;
    }
    return `${ones[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${underThousand(value % 100)}` : ""}`;
  };

  if (!num) return "Rupees Zero Only";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  return `Rupees ${[
    crore ? `${underThousand(crore)} Crore` : "",
    lakh ? `${underThousand(lakh)} Lakh` : "",
    thousand ? `${underThousand(thousand)} Thousand` : "",
    rest ? underThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ")} Only`;
};

const getSharedVehicleInvoiceNumber = (vehicle: PIInvoiceVehicle) => {
  const invoiceTypes = ["INR", "USD", "COMMERCIAL", "PACKING_LIST"] as const;

  for (const invoiceType of invoiceTypes) {
    const invoiceNumber = vehicle.invoices[invoiceType]?.invoiceNumber;
    if (invoiceNumber?.trim()) {
      return invoiceNumber.trim();
    }
  }

  return "";
};

const DEFAULT_COMMERCIAL_CLAUSES = `WE HEREBY CERTIFY THAT THIS SHIPMENT CONFIRMS TO PROFORMA INVOICE NO. {{PI_NUMBER}} DT {{PI_DATE}}
WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE HAVE THE FOLLOWING ACCESSORIES INSTALLED
A) AUTOMATIC TRANSMISSION
B) ANTI-LOCK BRAKING SYSTEM
C) DRIVER & FRONT PASSENGER HAVE STANDARD AIRBAGS
D) DRIVER & FRONT PASSENGER HAVE THREE POINT SEAT BELT & OTHER PASSENGERS HAVE MINIMUM TWO POINT SEAT BELT WHERE APPLICABLE.
WE HEREBY CONFIRM THAT ALL VEHICLES ON THIS INVOICE ARE NOT MORE THAN 3 YEARS OLD AT THE TIME OF SHIPMENT.`;

const buildInitialForm = (
  context: PIInvoiceContext,
  vehicle: PIInvoiceVehicle,
  invoiceType: InvoiceType,
  existingInvoice?: GeneratedInvoiceRecord & {
    manualFields?: Record<string, any>;
  },
): InvoiceManualFields => {
  const manual = (existingInvoice?.manualFields || {}) as InvoiceManualFields;

  return {
    invoiceNumber:
      manual.invoiceNumber ||
      existingInvoice?.invoiceNumber ||
      getSharedVehicleInvoiceNumber(vehicle) ||
      "",
    invoiceDate:
      toDateInputValue(manual.invoiceDate) ||
      new Date().toISOString().slice(0, 10),
    lcNumber: manual.lcNumber || context.lcNumber || "",
    lcDate: toDateInputValue(manual.lcDate || context.lcDate),
    lcSharedConfirmed: manual.lcSharedConfirmed === true,
    containerNo: manual.containerNo || "",
    portOfLoading: manual.portOfLoading || context.portOfLoading || "",
    portOfDischarge: manual.portOfDischarge || context.portOfDischarge || "",
    buyerOrderDate: manual.buyerOrderDate || "",
    otherReference: manual.otherReference || context.piNumber || "",
    termsOfDelivery: manual.termsOfDelivery || context.termsOfDelivery || "",
    termsOfPayment:
      manual.termsOfPayment || (invoiceType === "USD" ? "Immediate" : ""),
    dispatchedThrough: manual.dispatchedThrough || "By Sea",
    destination: manual.destination || context.buyerCountry || "Sri Lanka",
    commercialConsigneeName:
      manual.commercialConsigneeName || manual.termsOfPayment || "",
    ...(invoiceType === "COMMERCIAL"
      ? {
          commercialConsigneeAddressLine1:
            manual.commercialConsigneeAddressLine1 || context.buyerName || "",
          commercialConsigneeAddressLine2:
            manual.commercialConsigneeAddressLine2 ||
            context.buyerAddress ||
            "",
        }
      : {}),
    commercialClauses:
      manual.commercialClauses ||
      DEFAULT_COMMERCIAL_CLAUSES.replace(
        "{{PI_NUMBER}}",
        context.piNumber,
      ).replace("{{PI_DATE}}", context.piDate),
    drawbackScheme: manual.drawbackScheme || "RODTEP",
    rodtepSchemeCode: manual.rodtepSchemeCode || "",
    endUseCode: manual.endUseCode || "",
    typeOfVehicle: manual.typeOfVehicle || "SUV",
    placeOfSupply: manual.placeOfSupply || "Maharashtra - 27",
    customExchangeRate:
      manual.customExchangeRate ||
      (deriveExchangeRateFromVehicle(vehicle)?.toFixed(2) ?? ""),
    igstRate: manual.igstRate || String(vehicle.igstRate || 18),
    make: manual.make || vehicle.make || "",
    model: manual.model || vehicle.model || "",
    colour: manual.colour || vehicle.colour || "",
    engineCapacity: vehicle.engineCapacity || "",
    fuelType: vehicle.fuelType || "",
    yearOfManufacture:
      manual.yearOfManufacture || vehicle.yearOfManufacture || "",
    monthYearFirstReg:
      manual.monthYearFirstReg || vehicle.monthYearFirstReg || "",
    hsnCode:
      manual.hsnCode ||
      (invoiceType === "COMMERCIAL"
        ? vehicle.commercialHsnCode || vehicle.hsnCode || ""
        : vehicle.exportHsnCode || vehicle.hsnCode || ""),
    dbkSrNo: manual.dbkSrNo || vehicle.dbkSrNo || "",
    exportInspCertNo: manual.exportInspCertNo || vehicle.exportInspCertNo || "",
    exportInspCertDate:
      manual.exportInspCertDate || vehicle.exportInspCertDate || "",
    netWeightKg: manual.netWeightKg || vehicle.netWeightKg || "",
    grossWeightKg: manual.grossWeightKg || vehicle.grossWeightKg || "",
    dimensionsCm: manual.dimensionsCm || vehicle.dimensionsCm || "",
    vehicleDescriptionPrefix: manual.vehicleDescriptionPrefix || "",
  };
};

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </label>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      {value || "—"}
    </div>
  </div>
);

const EditableField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: keyof InvoiceManualFields;
  value: string | undefined;
  onChange: (name: keyof InvoiceManualFields, value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(name, e.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </div>
);

const EditableTextArea = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 4,
  className = "",
}: {
  label: string;
  name: keyof InvoiceManualFields;
  value: string | undefined;
  onChange: (name: keyof InvoiceManualFields, value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      value={value || ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(name, e.target.value)}
      className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </div>
);

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { piId = "", type = "", vehicleId = "" } = useParams();
  const invoiceType = type as InvoiceType;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState<PIInvoiceContext | null>(null);
  const [vehicle, setVehicle] = useState<PIInvoiceVehicle | null>(null);
  const [form, setForm] = useState<InvoiceManualFields | null>(null);
  const [existingInvoice, setExistingInvoice] = useState<
    (GeneratedInvoiceRecord & { manualFields?: Record<string, any> }) | null
  >(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [successData, setSuccessData] = useState<{
    invoiceId: string;
    invoiceNumber: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getPIContext(piId);
        const selectedVehicle = data.vehicles.find(
          (item) => item.vehicleId === vehicleId,
        );

        if (!selectedVehicle) {
          toast.error("Selected vehicle was not found in this PI");
          navigate(`/invoices/generate/${piId}/${invoiceType}`);
          return;
        }

        const currentInvoice = selectedVehicle.invoices[invoiceType] || null;

        setContext(data);
        setVehicle(selectedVehicle);
        setExistingInvoice(currentInvoice as any);
        setForm(
          buildInitialForm(
            data,
            selectedVehicle,
            invoiceType,
            currentInvoice as any,
          ),
        );

        const engineNoMissing =
          !selectedVehicle.engineNo || !selectedVehicle.engineNo.trim();
        if (engineNoMissing) {
          toast.error(
            "Vehicle Doesn't have Engine Number. Please add engine number for this vehicle.",
          );
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to load invoice form",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [invoiceType, navigate, piId, vehicleId]);

  const computed = useMemo(() => {
    const totalUSD = Number(vehicle?.totalUSD || 0);
    const exchangeRate = Number(form?.customExchangeRate || 0);
    const igstRate = Number(form?.igstRate || vehicle?.igstRate || 18);
    const { assessableINR, igstAmount, totalINR } = calculateInrInvoiceAmounts({
      totalUSD,
      exchangeRate,
      igstRate,
    });

    return {
      totalUSD,
      exchangeRate,
      assessableINR,
      igstRate,
      igstAmount,
      totalINR,
      amountWords:
        invoiceType === "INR"
          ? toIndianWords(Math.round(totalINR))
          : formatUsdWords(totalUSD),
    };
  }, [
    form?.customExchangeRate,
    form?.igstRate,
    invoiceType,
    vehicle?.igstRate,
    vehicle?.totalUSD,
  ]);

  const handleFieldChange = (
    name: keyof InvoiceManualFields,
    value: string | boolean,
  ) => {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const submit = async (replaceExisting = false) => {
    if (!form) return;

    if (!form.lcSharedConfirmed) {
      toast.error(
        "Please confirm the LC number and date are same for all invoices",
      );
      return;
    }

    const isReplacing = replaceExisting || !!existingInvoice;

    try {
      setSubmitting(true);
      const response = await invoiceApi.generateInvoice({
        piId,
        vehicleId,
        type: invoiceType,
        manualFields: form,
        replaceExisting: isReplacing,
      });

      toast.success(
        existingInvoice
          ? `${invoiceType} invoice updated successfully`
          : `${invoiceType} invoice generated successfully`,
      );
      setSuccessData({
        invoiceId: response.invoiceId,
        invoiceNumber: response.invoiceNumber,
      });
      setExistingInvoice({
        _id: response.invoiceId,
        invoiceNumber: response.invoiceNumber,
        generatedAt: new Date().toISOString(),
        vehicleId,
        type: invoiceType,
        hasPackingList: false,
        manualFields: { ...form, invoiceNumber: response.invoiceNumber },
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setShowReplaceConfirm(true);
        return;
      }

      const fields = error.response?.data?.fields;
      if (Array.isArray(fields) && fields.length) {
        toast.error(`Missing fields: ${fields.join(", ")}`);
        return;
      }

      toast.error(
        error.response?.data?.message || "Failed to generate invoice",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !context || !vehicle || !form) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const showUsdFields = invoiceType === "USD" || invoiceType === "COMMERCIAL";
  const showInrFields = invoiceType === "INR";
  const showCommercialFields = invoiceType === "COMMERCIAL";
  const showUsdOnlyFields = invoiceType === "USD";
  const showPackingSupportFields = invoiceType === "USD";
  const showCommonExportDetailFields =
    invoiceType === "USD" || invoiceType === "INR";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Invoice Generation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Fill Details for{" "}
            {invoiceType === "COMMERCIAL" ? "Commercial" : invoiceType} Invoice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vehicle {vehicle.chassisNo || vehicle.displayModel}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <InvoiceStepBar activeStep={successData ? 4 : 3} type={invoiceType} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              PI & Vehicle Data
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Read-only fields are prefilled from the PI. Fields not available
              from fetch are kept editable below so the invoice can still be
              generated per vehicle.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField label="PI Number" value={context.piNumber} />
              <ReadOnlyField label="PI Date" value={context.piDate} />
              <ReadOnlyField label="Buyer" value={context.buyerName} />
              <ReadOnlyField
                label="Buyer Address"
                value={context.buyerAddress}
              />
              <EditableField
                label="Port of Loading"
                name="portOfLoading"
                value={form.portOfLoading}
                onChange={handleFieldChange}
                placeholder="Enter port of loading"
                required
              />
              <EditableField
                label="Port of Discharge"
                name="portOfDischarge"
                value={form.portOfDischarge}
                onChange={handleFieldChange}
                placeholder="e.g. COLOMBO"
              />
              <ReadOnlyField
                label="Place of Delivery"
                value={context.placeOfDelivery}
              />
              <ReadOnlyField label="VIN / Chassis" value={vehicle.chassisNo} />
              <ReadOnlyField label="Engine No" value={vehicle.engineNo} />
              <ReadOnlyField
                label="Engine Capacity"
                value={vehicle.engineCapacity}
              />
              <ReadOnlyField label="Fuel Type" value={vehicle.fuelType} />
              <ReadOnlyField
                label="Vehicle Value (USD)"
                value={vehicle.totalUSD.toFixed(2)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Invoice Fields</h2>
            <p className="mt-1 text-sm text-slate-500">
              {invoiceType === "USD"
                ? "USD invoice follows the export invoice format with drawback, RODTEP, and buyer-order references."
                : invoiceType === "COMMERCIAL"
                  ? "Commercial invoice follows the bank / LC format, including consignee bank wording and commercial declaration vehicle details."
                  : "INR tax invoice auto-calculates INR from USD total and exchange rate, then adds IGST."}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <EditableField
                label="Invoice Number"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleFieldChange}
                required
                placeholder="AN/EX/26-27/001"
              />
              <EditableField
                label="Invoice Date"
                name="invoiceDate"
                value={form.invoiceDate}
                onChange={handleFieldChange}
                type="date"
                required
              />
              <EditableField
                label="LC Number"
                name="lcNumber"
                value={form.lcNumber}
                onChange={handleFieldChange}
                required
                placeholder="Enter LC number"
              />
              <EditableField
                label="LC Date"
                name="lcDate"
                value={form.lcDate}
                onChange={handleFieldChange}
                type="date"
                required
              />
              <label className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 md:col-span-2 xl:col-span-3">
                <Checkbox
                  checked={!!form.lcSharedConfirmed}
                  onCheckedChange={(checked) =>
                    handleFieldChange("lcSharedConfirmed", checked === true)
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Same LC number and date for all invoices
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Confirm this before generating the PDF.
                  </span>
                </span>
              </label>
              <EditableField
                label="Container No"
                name="containerNo"
                value={form.containerNo}
                onChange={handleFieldChange}
                placeholder="Optional container no"
              />
              {showUsdOnlyFields && (
                <>
                  <EditableField
                    label="Buyer Order & Date"
                    name="buyerOrderDate"
                    value={form.buyerOrderDate}
                    onChange={handleFieldChange}
                    placeholder="Buyer order reference"
                  />
                  <EditableField
                    label="Other Reference"
                    name="otherReference"
                    value={form.otherReference}
                    onChange={handleFieldChange}
                    placeholder="PI or internal reference"
                  />
                </>
              )}
              {showUsdOnlyFields && (
                <>
                  <EditableTextArea
                    label="Terms of Delivery and Origin Details"
                    name="termsOfDelivery"
                    value={form.termsOfDelivery}
                    onChange={handleFieldChange}
                    required
                    placeholder={`DDU / CFR
State of Origin of Goods - Maharashtra - 27
District of Origin of Goods - Pune - 411009`}
                    rows={5}
                    className="md:col-span-2"
                  />
                  <EditableField
                    label="Terms of Payment"
                    name="termsOfPayment"
                    value={form.termsOfPayment}
                    onChange={handleFieldChange}
                    required
                    placeholder="Immediate / As agreed"
                  />
                  <EditableField
                    label="Drawback Scheme"
                    name="drawbackScheme"
                    value={form.drawbackScheme}
                    onChange={handleFieldChange}
                    required
                    placeholder="RODTEP"
                  />
                  <EditableField
                    label="RODTEP Scheme Code"
                    name="rodtepSchemeCode"
                    value={form.rodtepSchemeCode}
                    onChange={handleFieldChange}
                    required
                    placeholder="60 / 61"
                  />
                  <EditableField
                    label="End Use Code"
                    name="endUseCode"
                    value={form.endUseCode}
                    onChange={handleFieldChange}
                    required
                    placeholder="GNX100"
                  />
                </>
              )}
              {showCommercialFields && (
                <>
                  <EditableField
                    label="Dispatched Through"
                    name="dispatchedThrough"
                    value={form.dispatchedThrough}
                    onChange={handleFieldChange}
                    required
                    placeholder="By Sea"
                  />
                  <EditableField
                    label="Destination"
                    name="destination"
                    value={form.destination}
                    onChange={handleFieldChange}
                    required
                    placeholder="Sri Lanka"
                  />
                </>
              )}
              {showCommercialFields && (
                <>
                  <EditableField
                    label="Consignee Name"
                    name="commercialConsigneeName"
                    value={form.commercialConsigneeName}
                    onChange={handleFieldChange}
                    required
                    placeholder="TO THE ORDER OF SAMPATH BANK PLC"
                  />
                  <EditableField
                    label="Consignee Address Line 1"
                    name="commercialConsigneeAddressLine1"
                    value={form.commercialConsigneeAddressLine1}
                    onChange={handleFieldChange}
                    required
                    placeholder="AUTODIRECT PVT LTD"
                  />
                  <EditableField
                    label="Consignee Address Line 2"
                    name="commercialConsigneeAddressLine2"
                    value={form.commercialConsigneeAddressLine2}
                    onChange={handleFieldChange}
                    required
                    placeholder="NO: 15 PARK CIRCUS COLOMBO 05 SRI LANKA"
                  />
                  <EditableField
                    label="Terms of Delivery"
                    name="termsOfDelivery"
                    value={form.termsOfDelivery}
                    onChange={handleFieldChange}
                    required
                    placeholder="CFR any port in Sri Lanka"
                  />
                  <EditableTextArea
                    label="Bank / LC Clauses"
                    name="commercialClauses"
                    value={form.commercialClauses}
                    onChange={handleFieldChange}
                    required
                    rows={7}
                    className="md:col-span-2 xl:col-span-3"
                    placeholder="Paste Sampath / Commercial Bank / Hatton Bank clauses here"
                  />
                </>
              )}
              {(showInrFields || showUsdOnlyFields) && (
                <>
                  <EditableField
                    label="Consignee Name"
                    name="commercialConsigneeName"
                    value={form.commercialConsigneeName}
                    onChange={handleFieldChange}
                    required
                    placeholder="TO THE ORDER OF SAMPATH BANK PLC"
                  />
                </>
              )}
              {showInrFields && (
                <>
                  <EditableField
                    label="Place of Supply"
                    name="placeOfSupply"
                    value={form.placeOfSupply}
                    onChange={handleFieldChange}
                    required
                    placeholder="Maharashtra - 27"
                  />
                  <EditableField
                    label="Terms of Payment"
                    name="termsOfPayment"
                    value={form.termsOfPayment}
                    onChange={handleFieldChange}
                    required
                    placeholder="ABC / 30 Days"
                  />
                  <EditableField
                    label="RODTEP Scheme Code"
                    name="rodtepSchemeCode"
                    value={form.rodtepSchemeCode}
                    onChange={handleFieldChange}
                    required
                    placeholder="60 / 61"
                  />
                  <EditableField
                    label="End Use Code"
                    name="endUseCode"
                    value={form.endUseCode}
                    onChange={handleFieldChange}
                    required
                    placeholder="GNX100"
                  />
                  <EditableField
                    label="Custom Exchange Rate"
                    name="customExchangeRate"
                    value={form.customExchangeRate}
                    onChange={handleFieldChange}
                    required
                    placeholder="92.55"
                  />
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Format Fields</h2>
            <p className="mt-1 text-sm text-slate-500">
              {showCommercialFields
                ? "Commercial invoice needs exact certification vehicle details, so fields like year, first registration, inspection certificate, and type of vehicle stay editable."
                : showPackingSupportFields
                  ? "USD invoice uses export-format fields only. Packing list is generated separately."
                  : "Only fields used in the invoice format are shown here. INR assessable value is calculated automatically from USD total and exchange rate."}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {showCommercialFields && (
                <EditableField
                  label="Make"
                  name="make"
                  value={form.make}
                  onChange={handleFieldChange}
                  placeholder="KIA INDIA PRIVATE LIMITED"
                />
              )}
              <EditableField
                label="Model"
                name="model"
                value={form.model}
                onChange={handleFieldChange}
                placeholder="Toyota Hyryder"
              />
              {showCommercialFields && (
                <EditableField
                  label="Vehicle Description Suffix"
                  name="vehicleDescriptionPrefix"
                  value={form.vehicleDescriptionPrefix}
                  onChange={handleFieldChange}
                  placeholder="e.g. TOYOTA GT 1.0T 7DCT HTX"
                />
              )}
              {showCommercialFields && (
                <EditableField
                  label="Type of Vehicle"
                  name="typeOfVehicle"
                  value={form.typeOfVehicle}
                  onChange={handleFieldChange}
                  placeholder="SUV"
                />
              )}
              {showCommonExportDetailFields && (
                <>
                  <EditableField
                    label="Colour"
                    name="colour"
                    value={form.colour}
                    onChange={handleFieldChange}
                    placeholder="Gaming Grey"
                  />
                  <EditableField
                    label="Export HSN"
                    name="hsnCode"
                    value={form.hsnCode}
                    onChange={handleFieldChange}
                    placeholder="FOR DEALER INVOICE / INR / USD / PACKING LIST"
                  />
                  <EditableField
                    label="DBK Sr No"
                    name="dbkSrNo"
                    value={form.dbkSrNo}
                    onChange={handleFieldChange}
                    placeholder="870302"
                  />
                </>
              )}
              {showCommercialFields && (
                <>
                  <EditableField
                    label="Colour"
                    name="colour"
                    value={form.colour}
                    onChange={handleFieldChange}
                    placeholder="Gaming Grey"
                  />

                  <EditableField
                    label="Year of Manufacture"
                    name="yearOfManufacture"
                    value={form.yearOfManufacture}
                    onChange={handleFieldChange}
                    placeholder="2026"
                  />
                  <EditableField
                    label="Month / Year First Reg"
                    name="monthYearFirstReg"
                    value={form.monthYearFirstReg}
                    onChange={handleFieldChange}
                    placeholder="2026/MAR/19"
                  />
                  <EditableField
                    label="Export Insp Cert No"
                    name="exportInspCertNo"
                    value={form.exportInspCertNo}
                    onChange={handleFieldChange}
                    placeholder="IND.M.9.26.1035/09"
                  />
                  <EditableField
                    label="Export Insp Cert Date"
                    name="exportInspCertDate"
                    value={form.exportInspCertDate}
                    onChange={handleFieldChange}
                    placeholder="28/03/2026"
                  />
                </>
              )}
              {showPackingSupportFields && (
                <>
                  <EditableField
                    label="Net Weight (KG)"
                    name="netWeightKg"
                    value={form.netWeightKg}
                    onChange={handleFieldChange}
                    placeholder="Optional"
                  />
                  <EditableField
                    label="Gross Weight (KG)"
                    name="grossWeightKg"
                    value={form.grossWeightKg}
                    onChange={handleFieldChange}
                    placeholder="Optional"
                  />
                  <EditableField
                    label="Dimensions (cm)"
                    name="dimensionsCm"
                    value={form.dimensionsCm}
                    onChange={handleFieldChange}
                    placeholder="Optional"
                  />
                </>
              )}
              {showInrFields && (
                <>
                  <ReadOnlyField
                    label="Assessable INR (USD x Rate)"
                    value={computed.assessableINR.toFixed(2)}
                  />
                  <EditableField
                    label="IGST Rate %"
                    name="igstRate"
                    value={form.igstRate}
                    onChange={handleFieldChange}
                    placeholder="18"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Calculated Summary
                </h2>
                <p className="text-sm text-slate-500">
                  Auto-read-only totals shown before generation.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">USD Total</span>
                <span className="font-semibold text-slate-900">
                  {computed.totalUSD.toFixed(2)}
                </span>
              </div>
              {showInrFields && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Exchange Rate</span>
                    <span className="font-semibold text-slate-900">
                      {computed.exchangeRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Assessable INR</span>
                    <span className="font-semibold text-slate-900">
                      {computed.assessableINR.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">IGST Amount</span>
                <span className="font-semibold text-slate-900">
                  {computed.igstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">INR Total</span>
                <span className="font-semibold text-slate-900">
                  {computed.totalINR.toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Amount in Words
                </span>
                <p className="mt-2">{computed.amountWords}</p>
              </div>
              {showInrFields && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                  Formula: `Assessable INR = USD Total x Exchange Rate`; `IGST =
                  Assessable INR x IGST%`; `Invoice Total = Assessable INR +
                  IGST`
                </div>
              )}
            </div>

            <Button
              className="mt-5 h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={submitting}
              onClick={() => submit(!!existingInvoice)}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {existingInvoice
                    ? "Updating Invoice..."
                    : "Generating Invoice..."}
                </>
              ) : existingInvoice ? (
                "Update & Replace Invoice"
              ) : (
                "Generate Invoice"
              )}
            </Button>

            {existingInvoice && (
              <p className="mt-3 text-xs text-slate-500">
                Existing {invoiceType} invoice found for this vehicle:{" "}
                {existingInvoice.invoiceNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={showReplaceConfirm}
        onOpenChange={setShowReplaceConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              An invoice already exists for this vehicle and type. Regenerating
              will replace the old PDF file with the updated one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReplaceConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowReplaceConfirm(false);
                submit(true);
              }}
            >
              Replace Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!successData}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessData(null);
            navigate(`/proforma-invoice/${piId}`);
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Invoice Generated
            </DialogTitle>
            <DialogDescription>
              {successData?.invoiceNumber} is ready for view and download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={() =>
                successData &&
                window.open(
                  invoiceApi.getInvoiceViewUrl(successData.invoiceId),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <Eye className="h-4 w-4" />
              View PDF
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                successData &&
                invoiceApi.downloadFile(
                  invoiceApi.getInvoiceViewUrl(successData.invoiceId),
                  `${successData.invoiceNumber}.pdf`,
                )
              }
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/proforma-invoice/${piId}`)}
            >
              Back to PI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
