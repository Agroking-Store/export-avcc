import { useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  FileText,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiConfig } from "../../../config/apiConfig";
import {
  QuotationDetailsPayload,
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import { vehicleManagementApi } from "../vehicleManagementApi";

const API_ORIGIN = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");

const getQuotationUrl = (filePath?: string) =>
  filePath ? `${API_ORIGIN}${filePath}` : "";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem | null;
  onSync: (updated: VehicleBookingItem) => void;
}

import { useAuth } from "../../../hooks/useAuth";

// /** USD exchange rate used for "Total USD @ 89.5" rows */
// const USD_RATE = 89.5;

type CostingForm = {
  dealershipName: string;
  brand: string;
  carModelName: string;
  /** Car colour – read-only, fetched from vehicleSnapshot */
  carColour: string;
  /** Ex-Showroom price input; drives basicValue & carGst automatically */
  exShowroomPrice: string;
  /** GST rate (%) – read-only, fetched from vehicle list item */
  gstRate: string;
  bookingAmount: string;
  netCost: Record<keyof QuotationDetailsPayload["netCost"], string>;
  taxAmount: Record<keyof QuotationDetailsPayload["taxAmount"], string>;
  usdRate: string;

};

const emptyCostingForm = (): CostingForm => ({
  dealershipName: "",
  brand: "",
  carModelName: "",
  carColour: "",
  exShowroomPrice: "",
  gstRate: "",
  bookingAmount: "",
  usdRate: "",
  netCost: {
    basicValue: "",
    handlingCharges: "",
    crtm: "",
    insurance: "",
    registrationCost: "",
    cashComponent: "",
    bureauVeritas: "",
    shippingCost: "",
    total: "",
  },
  taxAmount: {
    carGst: "",
    bureauVeritasGst: "",
    shippingGst: "",
    insuranceGst: "",
    tcs: "",
    total: "",
  },
});

const toAmount = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmountForInput = (value?: string | number) =>
  value === undefined || value === null || Number(value) === 0
    ? ""
    : String(value);

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Given ex-showroom price and GST rate %, return { basicValue, carGst } */
const deriveFromExShowroom = (
  exShowroom: number,
  gstRatePct: number,
): { basicValue: number; carGst: number } => {
  if (!exShowroom || !gstRatePct) return { basicValue: 0, carGst: 0 };
  const carGst = Math.round(exShowroom * (gstRatePct / 100));
  const basicValue = Math.round(exShowroom - carGst);
  return { basicValue, carGst };
};

// ─── component ────────────────────────────────────────────────────────────────

const QuotationModal = ({ isOpen, onClose, booking, onSync }: Props) => {
  const [costingForm, setCostingForm] = useState<CostingForm>(emptyCostingForm);
  const usdRate = toAmount(costingForm.usdRate);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [quotationSaving, setQuotationSaving] = useState(false);
  const { isSourcingTeam } = useAuth();
  useEffect(() => {
    const loadDetails = async () => {
      if (!booking) return;

      const details = booking.quotationDetails;
      // Fetch vehicleSnapshot from populated orderId
      const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
      // Fetch igstRate from the vehicle list item snapshot (populated vehicleId or vehicleSnapshot)
      const vehicleItem = (booking as any).vehicleId;

      // GST rate (%) should come from vehicle list item (igstRate)
      let igstRate =
        details?.gstRate ??
        vehicleItem?.igstRate ??
        vehicleSnapshot?.igstRate ??
        0;

      // Robust fallback: if we only have IDs as strings, fetch the vehicle list item directly!
      if (!igstRate) {
        try {
          const vehicleIdStr =
            typeof booking.vehicleId === "object"
              ? (booking.vehicleId as any)._id
              : booking.vehicleId;
          if (vehicleIdStr) {
            const vehicle = await vehicleManagementApi.getVehicleById(vehicleIdStr);
            if (vehicle?.igstRate) {
              igstRate = vehicle.igstRate;
            }
          }
        } catch (e) {
          console.error("Failed to fetch vehicle GST fallback:", e);
        }
      }

      setRejectReason(booking.rejectionReason || "");
      setSelectedFile(null);

      // If we have an exShowroomPrice saved, derive basic/gst; otherwise use saved values
      const savedExShowroom = details?.exShowroomPrice || 0;
      const savedGstRate = igstRate;
      const { basicValue: derivedBasic, carGst: derivedCarGst } =
        savedExShowroom
          ? deriveFromExShowroom(savedExShowroom, savedGstRate)
          : { basicValue: 0, carGst: 0 };

      // Fallback for color/brand/model if snapshot is missing
      let fetchedVehicle: any = null;
      if (!vehicleSnapshot && typeof booking.vehicleId === "string") {
        try {
          fetchedVehicle = await vehicleManagementApi.getVehicleById(booking.vehicleId);
        } catch { }
      }

      const brandName = details?.brand || vehicleSnapshot?.brandName || fetchedVehicle?.brandName || "";
      const modelName = details?.carModelName ||
        (vehicleSnapshot
          ? [vehicleSnapshot.modelName, vehicleSnapshot.variant].filter(Boolean).join(" ")
          : fetchedVehicle
            ? [fetchedVehicle.modelName, fetchedVehicle.variant].filter(Boolean).join(" ")
            : "");
      const color = details?.carColour || vehicleSnapshot?.color || fetchedVehicle?.color || "";

      setCostingForm({
        dealershipName:
          details?.dealershipName || booking.assignedDealerSnapshot?.name || "",
        brand: brandName,
        carModelName: modelName,
        // carColour – prefer saved value, fallback to vehicleSnapshot colour
        carColour: color,
        exShowroomPrice: formatAmountForInput(details?.exShowroomPrice),
        gstRate: String(savedGstRate || ""),
        bookingAmount: formatAmountForInput(booking.bookingAmount),
        usdRate: formatAmountForInput(details?.usdRate),
        netCost: {
          basicValue: formatAmountForInput(
            details?.netCost?.basicValue || (savedExShowroom ? derivedBasic : undefined),
          ),
          handlingCharges: formatAmountForInput(details?.netCost?.handlingCharges),
          crtm: formatAmountForInput(details?.netCost?.crtm),
          insurance: formatAmountForInput(details?.netCost?.insurance),
          registrationCost: formatAmountForInput(details?.netCost?.registrationCost),
          cashComponent: formatAmountForInput(details?.netCost?.cashComponent),
          bureauVeritas: formatAmountForInput(details?.netCost?.bureauVeritas),
          shippingCost: formatAmountForInput(details?.netCost?.shippingCost),
          total: formatAmountForInput(details?.netCost?.total),
        },
        taxAmount: {
          carGst: formatAmountForInput(
            details?.taxAmount?.carGst || (savedExShowroom ? derivedCarGst : undefined),
          ),
          bureauVeritasGst: formatAmountForInput(details?.taxAmount?.bureauVeritasGst),
          shippingGst: formatAmountForInput(details?.taxAmount?.shippingGst),
          insuranceGst: formatAmountForInput(details?.taxAmount?.insuranceGst),
          tcs: formatAmountForInput(details?.taxAmount?.tcs),
          total: formatAmountForInput(details?.taxAmount?.total),
        },
      });
    };

    loadDetails();
  }, [booking]);

  if (!isOpen || !booking) return null;

  // ── upload handler ──────────────────────────────────────────────────────────

  const handleFileChangeAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.uploadQuotation(
        booking._id,
        file,
      );
      onSync(updated);
      toast.success(
        booking.quotationFile
          ? "Quotation replaced successfully"
          : "Quotation uploaded successfully. Please save costing details.",
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload quotation");
    } finally {
      setQuotationSaving(false);
      event.target.value = "";
    }
  };

  // ── form field setters ──────────────────────────────────────────────────────

  const setCostingField = (field: keyof CostingForm, value: string) => {
    setCostingForm((current) => ({ ...current, [field]: value }));
  };

  const setCostingAmount = (
    section: "netCost" | "taxAmount",
    field: string,
    value: string,
  ) => {
    setCostingForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  /**
   * When ex-showroom price changes, auto-calculate basicValue and carGst.
   */
  const handleExShowroomChange = (value: string) => {
    setCostingField("exShowroomPrice", value);
    const exShowroom = toAmount(value);
    const gstRate = toAmount(costingForm.gstRate);
    const { basicValue, carGst } = deriveFromExShowroom(exShowroom, gstRate);
    setCostingForm((current) => ({
      ...current,
      exShowroomPrice: value,
      netCost: {
        ...current.netCost,
        basicValue: basicValue > 0 ? String(basicValue) : "",
      },
      taxAmount: {
        ...current.taxAmount,
        carGst: carGst > 0 ? String(carGst) : "",
      },
    }));
  };

  // ── totals ──────────────────────────────────────────────────────────────────

  const netTotal =
    toAmount(costingForm.netCost.basicValue) +
    toAmount(costingForm.netCost.handlingCharges) +
    toAmount(costingForm.netCost.crtm) +
    toAmount(costingForm.netCost.insurance) +
    toAmount(costingForm.netCost.registrationCost) +
    toAmount(costingForm.netCost.cashComponent) +
    toAmount(costingForm.netCost.bureauVeritas) +
    toAmount(costingForm.netCost.shippingCost);

  const taxTotal =
    toAmount(costingForm.taxAmount.carGst) +
    toAmount(costingForm.taxAmount.bureauVeritasGst) +
    toAmount(costingForm.taxAmount.shippingGst) +
    toAmount(costingForm.taxAmount.insuranceGst) +
    toAmount(costingForm.taxAmount.tcs);

  const grandTotal = netTotal + taxTotal;

  // const netTotalUsd = netTotal > 0 ? (netTotal / USD_RATE).toFixed(5) : "—";
  // const taxTotalUsd = taxTotal > 0 ? (taxTotal / USD_RATE).toFixed(5) : "—";
  // const grandTotalUsd = grandTotal > 0 ? (grandTotal / USD_RATE).toFixed(5) : "—";

  const netTotalUsd = netTotal > 0 && usdRate > 0 ? (netTotal / usdRate).toFixed(5) : "—";
  const taxTotalUsd = taxTotal > 0 && usdRate > 0 ? (taxTotal / usdRate).toFixed(5) : "—";
  const grandTotalUsd = grandTotal > 0 && usdRate > 0 ? (grandTotal / usdRate).toFixed(5) : "—";

  // ── save handler ────────────────────────────────────────────────────────────

  const handleSaveQuotationDetails = async () => {
    if (!booking) return;
    if (!costingForm.dealershipName.trim()) {
      toast.error("Dealership name is required");
      return;
    }
    if (!costingForm.brand.trim()) {
      toast.error("Brand is required");
      return;
    }
    if (!costingForm.carModelName.trim()) {
      toast.error("Car model name is required");
      return;
    }

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.saveQuotationDetails(booking._id, {
        dealershipName: costingForm.dealershipName,
        brand: costingForm.brand,
        carModelName: costingForm.carModelName,
        carColour: costingForm.carColour,
        exShowroomPrice: toAmount(costingForm.exShowroomPrice),
        gstRate: toAmount(costingForm.gstRate),
        bookingAmount: toAmount(costingForm.bookingAmount),
        netCost: {
          ...costingForm.netCost,
          total: netTotal,
        },
        taxAmount: {
          ...costingForm.taxAmount,
          total: taxTotal,
        },
        grandTotal,
      });
      onSync(updated);
      toast.success("Costing details saved. Waiting for approval.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save costing details",
      );
    } finally {
      setQuotationSaving(false);
    }
  };

  // ── approve / reject ────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!booking) return;

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.approve(booking._id);
      onSync(updated);
      toast.success("Vehicle approved");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Approval failed");
    } finally {
      setQuotationSaving(false);
    }
  };

  const handleReject = async () => {
    if (!booking) return;
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.reject(
        booking._id,
        rejectReason,
      );
      onSync(updated);
      toast.success("Vehicle rejected");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Rejection failed");
    } finally {
      setQuotationSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
  const vehicleName = vehicleSnapshot
    ? `${vehicleSnapshot.brandName || ""} ${vehicleSnapshot.modelName || ""}`.trim()
    : "Vehicle";

  /** Shared input class */
  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400";
  const disabledInputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {vehicleName}
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              Quotation Upload & Approval
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {/* ── Consolidated Quotation File Action Row ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-800">
                {booking.quotationFile ? "Quotation File Uploaded" : "No Quotation File Uploaded"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {booking.quotationFile && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(getQuotationUrl(booking.quotationFile), "_blank")
                  }
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Eye size={14} />
                  View Quotation
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChangeAndUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={quotationSaving}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                <Upload size={14} />
                {booking.quotationFile ? "Replace File" : "Upload File"}
              </button>
            </div>
          </div>

          {/* ── Costing Sheet Details ── */}
          {booking.quotationFile && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    Costing Sheet Details
                  </p>
                  <p className="text-sm text-slate-500">
                    Save these details to move the quotation to Waiting for Approval.
                  </p>
                </div>
                {booking.status === "quotation_uploaded" &&
                  booking.quotationDetails?.savedAt && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Saved
                    </span>
                  )}
              </div>

              {/* ── Top info fields ── */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Name of Dealership
                  </label>
                  <input
                    value={costingForm.dealershipName}
                    onChange={(e) => setCostingField("dealershipName", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Brand
                  </label>
                  <input
                    value={costingForm.brand}
                    onChange={(e) => setCostingField("brand", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Car Model Name
                  </label>
                  <input
                    value={costingForm.carModelName}
                    onChange={(e) => setCostingField("carModelName", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Car Colour – read-only, fetched from vehicleSnapshot */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Car Colour
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(from vehicle)</span>
                  </label>
                  <input
                    value={costingForm.carColour}
                    readOnly
                    className={disabledInputCls}
                  />
                </div>

                {/* Ex-Showroom Price */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Ex-Showroom Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costingForm.exShowroomPrice}
                    onChange={(e) => handleExShowroomChange(e.target.value)}
                    placeholder="e.g. 1000000"
                    className={inputCls}
                  />
                  {toAmount(costingForm.exShowroomPrice) > 0 && toAmount(costingForm.gstRate) > 0 && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Basic Value auto-calculated as Ex-Showroom - Car GST ({costingForm.gstRate}%)
                    </p>
                  )}
                </div>

                {/* Booking Amount */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costingForm.bookingAmount}
                    onChange={(e) => setCostingField("bookingAmount", e.target.value)}
                    placeholder="e.g. 50000"
                    className={inputCls}
                  />
                  {toAmount(costingForm.netCost.basicValue) > 0 && toAmount(costingForm.bookingAmount) > 0 && (
                    <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                      Remaining to pay: ₹{(toAmount(costingForm.netCost.basicValue) - toAmount(costingForm.bookingAmount)).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>

                {/* GST Rate – disabled, fetched from vehicle list item */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Applied GST Rate (%)
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(from vehicle)</span>
                  </label>
                  <input
                    value={costingForm.gstRate ? `${costingForm.gstRate}%` : "—"}
                    disabled
                    className={disabledInputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    USD Exchange Rate (₹ per $1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costingForm.usdRate}
                    onChange={(e) => setCostingField("usdRate", e.target.value)}
                    placeholder="e.g. 89.5"
                    className={inputCls}
                  />
                </div>
              </div>


              {/* ── Net Cost & Tax Amount tables ── */}
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* NET COST */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Net Cost
                  </p>

                  {(
                    [
                      ["basicValue", "Basic Value"],
                      ["handlingCharges", "Handling Charges"],
                      ["crtm", "CRTM"],
                      ["insurance", "Insurance"],
                      ["cashComponent", "Cash Component"],
                      ["bureauVeritas", "Bureau Veritas"],
                      ["shippingCost", "Shipping Cost"],
                      ["registrationCost", "Registration Cost"],
                    ] as [string, string][]
                  ).map(([field, label]) => {
                    const isAutoField = field === "basicValue";
                    return (
                      <div key={field} className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          {label}
                          {isAutoField && toAmount(costingForm.exShowroomPrice) > 0 && (
                            <span className="ml-1 text-[10px] text-blue-400">(auto)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={(costingForm.netCost as any)[field]}
                          onChange={(e) =>
                            setCostingAmount("netCost", field, e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                    );
                  })}

                  {/* Total row */}
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    Total: ₹{netTotal.toLocaleString("en-IN")}
                  </div>
                  {/* Total USD row */}
                  <div className="mt-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Total USD @ {usdRate || "—"}: {netTotalUsd}
                  </div>
                  {/* <div className="mt-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Total USD @ {USD_RATE}: {netTotalUsd}
                  </div> */}
                </div>

                {/* TAX AMOUNT */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Tax Amount
                  </p>

                  {(
                    [
                      ["carGst", "Car GST"],
                      ["bureauVeritasGst", "Bureau Veritas GST"],
                      ["shippingGst", "Shipping GST"],
                      ["tcs", "TCS 1%"],
                      ["insuranceGst", "Insurance GST"],
                    ] as [string, string][]
                  ).map(([field, label]) => {
                    const isAutoField = field === "carGst";
                    return (
                      <div key={field} className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          {label}
                          {isAutoField && toAmount(costingForm.exShowroomPrice) > 0 && (
                            <span className="ml-1 text-[10px] text-blue-400">(auto)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={(costingForm.taxAmount as any)[field]}
                          onChange={(e) =>
                            setCostingAmount("taxAmount", field, e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                    );
                  })}

                  {/* Total row */}
                  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    Total: ₹{taxTotal.toLocaleString("en-IN")}
                  </div>
                  {/* Total USD row */}
                  {/* <div className="mt-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Total USD @ {USD_RATE}: {taxTotalUsd}
                  </div> */}
                  <div className="mt-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Total USD @ {usdRate || "—"}: {taxTotalUsd}
                  </div>
                </div>
              </div>

              {/* ── Grand Total + Save ── */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900">
                    Grand Total: ₹{grandTotal.toLocaleString("en-IN")}
                  </p>
                  {/* <p className="text-xs text-blue-600">
                    Total USD @ {USD_RATE}: {grandTotalUsd}
                  </p> */}
                  <p className="text-xs text-blue-600">
                    Total USD @ {usdRate || "—"}: {grandTotalUsd}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveQuotationDetails}
                  disabled={quotationSaving}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  Save Details
                </button>
              </div>
            </div>
          )}

          {/* ── Approval Actions ── */}
          {booking.quotationFile &&
            booking.status === "quotation_uploaded" && !isSourcingTeam && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2 text-slate-800">
                  <ShieldCheck size={18} />
                  <p className="font-semibold">Approval Actions</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={3}
                    placeholder="Enter rejection reason if needed..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={quotationSaving}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={quotationSaving}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;