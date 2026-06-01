import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { InvoiceManualFields, PIInvoiceContext } from "../components/invoice.types";

const pad = (value: number) => String(value).padStart(2, "0");

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const getSharedPackingInvoiceNumber = (context: PIInvoiceContext) => {
  const existing = context.existingInvoices.find(
    (invoice) => invoice.type === "PACKING_LIST" && invoice.invoiceNumber,
  );

  if (existing?.invoiceNumber) return existing.invoiceNumber;

  for (const vehicle of context.vehicles) {
    const invoiceNumber =
      vehicle.invoices.PACKING_LIST?.invoiceNumber ||
      vehicle.invoices.USD?.invoiceNumber ||
      vehicle.invoices.INR?.invoiceNumber ||
      vehicle.invoices.COMMERCIAL?.invoiceNumber;

    if (invoiceNumber?.trim()) return invoiceNumber.trim();
  }

  return context.suggestedInvoiceNumber;
};

const buildInitialForm = (context: PIInvoiceContext): InvoiceManualFields => {
  const existing = context.existingInvoices.find(
    (invoice) => invoice.type === "PACKING_LIST",
  );
  const manual = (existing?.manualFields || {}) as Partial<InvoiceManualFields>;
  const firstVehicle = context.vehicles[0];

  return {
    invoiceNumber:
      manual.invoiceNumber || existing?.invoiceNumber || getSharedPackingInvoiceNumber(context),
    invoiceDate:
      toDateInputValue(manual.invoiceDate) || new Date().toISOString().slice(0, 10),
    lcNumber: manual.lcNumber || context.lcNumber || "",
    lcDate: toDateInputValue(manual.lcDate || context.lcDate),
    lcSharedConfirmed: manual.lcSharedConfirmed === true,
    containerNo: manual.containerNo || "",
    buyerOrderDate: manual.buyerOrderDate || "",
    otherReference: manual.otherReference || context.piNumber || "",
    termsOfDelivery: manual.termsOfDelivery || context.termsOfDelivery || "",
    termsOfPayment: manual.termsOfPayment || "",
    dispatchedThrough: manual.dispatchedThrough || "By Sea",
    destination: manual.destination || context.buyerCountry || "Sri Lanka",
    commercialConsigneeName: manual.commercialConsigneeName || "",
    commercialConsigneeAddressLine1: manual.commercialConsigneeAddressLine1 || "",
    commercialConsigneeAddressLine2: manual.commercialConsigneeAddressLine2 || "",
    commercialClauses: manual.commercialClauses || "",
    drawbackScheme: manual.drawbackScheme || "",
    rodtepSchemeCode: manual.rodtepSchemeCode || "",
    endUseCode: manual.endUseCode || "",
    typeOfVehicle: manual.typeOfVehicle || "",
    placeOfSupply: manual.placeOfSupply || "",
    customExchangeRate: manual.customExchangeRate || "",
    igstRate: manual.igstRate || String(firstVehicle?.igstRate || 18),
    make: manual.make || firstVehicle?.make || "",
    model: manual.model || firstVehicle?.model || "",
    variant: manual.variant || firstVehicle?.variant || "",
    colour: manual.colour || firstVehicle?.colour || "",
    engineCapacity: manual.engineCapacity || firstVehicle?.engineCapacity || "",
    fuelType: manual.fuelType || firstVehicle?.fuelType || "",
    yearOfManufacture:
      manual.yearOfManufacture || firstVehicle?.yearOfManufacture || "",
    monthYearFirstReg:
      manual.monthYearFirstReg || firstVehicle?.monthYearFirstReg || "",
    hsnCode:
      manual.hsnCode ||
      firstVehicle?.exportHsnCode ||
      firstVehicle?.hsnCode ||
      "",
    dbkSrNo: manual.dbkSrNo || firstVehicle?.dbkSrNo || "",
    exportInspCertNo:
      manual.exportInspCertNo || firstVehicle?.exportInspCertNo || "",
    exportInspCertDate:
      manual.exportInspCertDate || firstVehicle?.exportInspCertDate || "",
    netWeightKg: manual.netWeightKg || firstVehicle?.netWeightKg || "",
    grossWeightKg: manual.grossWeightKg || firstVehicle?.grossWeightKg || "",
    dimensionsCm: manual.dimensionsCm || firstVehicle?.dimensionsCm || "",
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
      {value || "-"}
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

export default function GeneratePackingList() {
  const { piId = "" } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState<PIInvoiceContext | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [form, setForm] = useState<InvoiceManualFields | null>(null);
  const [successData, setSuccessData] = useState<{
    invoiceId: string;
    invoiceNumber: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getPIContext(piId);
        setContext(data);
        setForm(buildInitialForm(data));
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load PI data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [piId]);

  const selectedVehicleRows = useMemo(
    () =>
      context?.vehicles.filter((vehicle) =>
        selectedVehicles.includes(vehicle.vehicleId),
      ) || [],
    [context?.vehicles, selectedVehicles],
  );

  const totals = useMemo(() => {
    const usdTotal = selectedVehicleRows.reduce(
      (sum, vehicle) => sum + Number(vehicle.totalUSD || 0),
      0,
    );
    const totalQuantity = selectedVehicleRows.reduce(
      (sum, vehicle) => sum + Number(vehicle.quantity || 1),
      0,
    );

    return { usdTotal, totalQuantity };
  }, [selectedVehicleRows]);

  const handleFieldChange = (
    name: keyof InvoiceManualFields,
    value: string | boolean,
  ) => {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId],
    );
  };

  const selectAll = () => {
    if (!context) return;
    setSelectedVehicles(context.vehicles.map((vehicle) => vehicle.vehicleId));
  };

  const clearSelection = () => setSelectedVehicles([]);

  const handleGenerate = async () => {
    if (!form) return;
    if (selectedVehicles.length === 0) {
      toast.error("Please select at least one vehicle");
      return;
    }
    if (!form.lcSharedConfirmed) {
      toast.error("Please confirm the LC number and date are same for all invoices");
      return;
    }

    try {
      setSubmitting(true);
      const res = await invoiceApi.generatePackingList({
        piId,
        vehicleIds: selectedVehicles,
        manualFields: form,
        replaceExisting: true,
      });

      toast.success("Packing List generated successfully");
      setSuccessData({
        invoiceId: res.invoiceId,
        invoiceNumber: res.invoiceNumber,
      });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to generate Packing List",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !context || !form) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Invoice Generation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Fill Details for Packing List
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            PI {context.piNumber} - {context.buyerName}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <InvoiceStepBar activeStep={3} type="PACKING_LIST" />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              PI & Shipment Data
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Read-only fields are prefilled from the PI and used in the packing list PDF.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField label="PI Number" value={context.piNumber} />
              <ReadOnlyField label="PI Date" value={context.piDate} />
              <ReadOnlyField label="Buyer" value={context.buyerName} />
              <ReadOnlyField label="Buyer Address" value={context.buyerAddress} />
              <ReadOnlyField label="Port of Loading" value={context.portOfLoading} />
              <ReadOnlyField label="Port of Discharge" value={context.portOfDischarge} />
              <ReadOnlyField label="Place of Delivery" value={context.placeOfDelivery} />
              <ReadOnlyField label="Vehicle Count" value={context.vehicles.length} />
              <ReadOnlyField
                label="Selected Vehicles"
                value={selectedVehicles.length}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Invoice Fields</h2>
            <p className="mt-1 text-sm text-slate-500">
              Packing list uses the same invoice number, date, LC, container, and export detail fields as the invoice flow.
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
              <EditableField
                label="Other Reference"
                name="otherReference"
                value={form.otherReference}
                onChange={handleFieldChange}
                placeholder="PI or internal reference"
              />
              <EditableField
                label="Terms of Delivery"
                name="termsOfDelivery"
                value={form.termsOfDelivery}
                onChange={handleFieldChange}
                placeholder="CFR any port in Sri Lanka"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Format Fields</h2>
            <p className="mt-1 text-sm text-slate-500">
              Weight, dimensions, and export codes are editable here just like the supporting invoice fields.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Vehicles in this PI
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select one or more vehicles to include in this packing list.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Select</th>
                    <th className="px-6 py-4">VIN</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">Existing</th>
                  </tr>
                </thead>
                <tbody>
                  {context.vehicles.map((vehicle) => {
                    const checked = selectedVehicles.includes(vehicle.vehicleId);

                    return (
                      <tr
                        key={vehicle.vehicleId}
                        className={`border-t border-slate-200 ${
                          checked ? "bg-blue-50/70" : "bg-white"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleVehicle(vehicle.vehicleId)}
                          />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700">
                          {vehicle.chassisNo || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {vehicle.model || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {vehicle.make || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {vehicle.variant || "-"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          USD{" "}
                          {vehicle.totalUSD.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                              vehicle.invoices.PACKING_LIST
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {vehicle.invoices.PACKING_LIST && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            Packing
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                  Packing Summary
                </h2>
                <p className="text-sm text-slate-500">
                  Selected vehicles before generation.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Selected Vehicles</span>
                <span className="font-semibold text-slate-900">
                  {selectedVehicles.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total Quantity</span>
                <span className="font-semibold text-slate-900">
                  {totals.totalQuantity}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">USD Total</span>
                <span className="font-semibold text-slate-900">
                  {totals.usdTotal.toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Invoice Number
                </span>
                <p className="mt-2">{form.invoiceNumber || "-"}</p>
              </div>
            </div>

            <Button
              className="mt-5 h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={submitting || selectedVehicles.length === 0}
              onClick={handleGenerate}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Packing List...
                </>
              ) : (
                "Generate Packing List"
              )}
            </Button>
          </div>
        </div>
      </div>

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
              Packing List Generated
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
                  invoiceApi.getPackingListViewUrl(successData.invoiceId),
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
                  invoiceApi.getPackingListViewUrl(successData.invoiceId),
                  `${successData.invoiceNumber}-packing.pdf`,
                )
              }
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuccessData(null);
                navigate(`/proforma-invoice/${piId}`);
              }}
            >
              Back to PI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
