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

type CostingForm = {
  dealershipName: string;
  brand: string;
  carModelName: string;
  driveLink: string;
  netCost: Record<keyof QuotationDetailsPayload["netCost"], string>;
  taxAmount: Record<keyof QuotationDetailsPayload["taxAmount"], string>;
};

const emptyCostingForm = (): CostingForm => ({
  dealershipName: "",
  brand: "",
  carModelName: "",
  driveLink: "",
  netCost: {
    basicValue: "",
    handlingCharges: "",
    crtm: "",
    insurance: "",
    cashComponent: "",
    bureauVeritas: "",
    shippingCost: "",
    total: "",
  },
  taxAmount: {
    carGst: "",
    bureauVeritasGst: "",
    shippingGst: "",
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

const QuotationModal = ({ isOpen, onClose, booking, onSync }: Props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [costingForm, setCostingForm] = useState<CostingForm>(emptyCostingForm);
  const { isSourcingTeam } = useAuth();

  useEffect(() => {
    if (booking) {
      const details = booking.quotationDetails;
      const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
      setRejectReason(booking.rejectionReason || "");
      setSelectedFile(null);
      setCostingForm({
        dealershipName:
          details?.dealershipName || booking.assignedDealerSnapshot?.name || "",
        brand: details?.brand || vehicleSnapshot?.brandName || "",
        carModelName:
          details?.carModelName ||
          [vehicleSnapshot?.modelName, vehicleSnapshot?.variant]
            .filter(Boolean)
            .join(" "),
        driveLink: details?.driveLink || "",
        netCost: {
          basicValue: formatAmountForInput(details?.netCost?.basicValue),
          handlingCharges: formatAmountForInput(
            details?.netCost?.handlingCharges,
          ),
          crtm: formatAmountForInput(details?.netCost?.crtm),
          insurance: formatAmountForInput(details?.netCost?.insurance),
          cashComponent: formatAmountForInput(details?.netCost?.cashComponent),
          bureauVeritas: formatAmountForInput(details?.netCost?.bureauVeritas),
          shippingCost: formatAmountForInput(details?.netCost?.shippingCost),
          total: formatAmountForInput(details?.netCost?.total),
        },
        taxAmount: {
          carGst: formatAmountForInput(details?.taxAmount?.carGst),
          bureauVeritasGst: formatAmountForInput(
            details?.taxAmount?.bureauVeritasGst,
          ),
          shippingGst: formatAmountForInput(details?.taxAmount?.shippingGst),
          tcs: formatAmountForInput(details?.taxAmount?.tcs),
          total: formatAmountForInput(details?.taxAmount?.total),
        },
      });
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleQuotationUpload = async () => {
    if (!booking) return;
    if (!selectedFile) {
      toast.error("Please choose a quotation file");
      return;
    }

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.uploadQuotation(
        booking._id,
        selectedFile,
      );
      onSync(updated);
      toast.success(
        booking.quotationFile
          ? "Quotation replaced successfully"
          : "Quotation uploaded successfully. Please save costing details.",
      );
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload quotation");
    } finally {
      setQuotationSaving(false);
    }
  };

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

  const netTotal =
    toAmount(costingForm.netCost.basicValue) +
    toAmount(costingForm.netCost.handlingCharges) +
    toAmount(costingForm.netCost.crtm) +
    toAmount(costingForm.netCost.insurance) +
    toAmount(costingForm.netCost.cashComponent) +
    toAmount(costingForm.netCost.bureauVeritas) +
    toAmount(costingForm.netCost.shippingCost);

  const taxTotal =
    toAmount(costingForm.taxAmount.carGst) +
    toAmount(costingForm.taxAmount.bureauVeritasGst) +
    toAmount(costingForm.taxAmount.shippingGst) +
    toAmount(costingForm.taxAmount.tcs);

  const grandTotal = netTotal + taxTotal;

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
        driveLink: costingForm.driveLink,
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

  const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
  const vehicleName = vehicleSnapshot
    ? `${vehicleSnapshot.brandName || ""} ${vehicleSnapshot.modelName || ""}`.trim()
    : "Vehicle";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
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
          {/* Upload zone */}
          <div className="rounded-[24px] border border-dashed border-blue-300 bg-blue-50/70 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 rounded-full bg-white p-3 text-blue-700 shadow-sm">
                <Upload size={20} />
              </div>
              <p className="text-base font-semibold text-slate-900">
                Upload quotation file
              </p>
              <p className="mt-1 text-sm text-slate-500">
                PDF, JPG, PNG, WebP supported. Replacing a file removes the old one automatically.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <Upload size={16} />
                Choose File
              </button>

              <p className="mt-3 text-sm font-medium text-slate-700">
                {selectedFile?.name ||
                  (booking.quotationFile
                    ? "Existing quotation already uploaded"
                    : "No file selected")}
              </p>
            </div>
          </div>

          {/* View existing quotation */}
          {booking.quotationFile && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <FileText size={18} className="text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                Existing quotation available for this unit.
              </p>
              <button
                onClick={() =>
                  window.open(getQuotationUrl(booking.quotationFile), "_blank")
                }
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Eye size={14} />
                View File
              </button>
            </div>
          )}

          {/* Upload / Replace action */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleQuotationUpload}
              disabled={quotationSaving || !selectedFile}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={16} />
              {booking.quotationFile ? "Replace File" : "Upload File"}
            </button>
          </div>

          {/* Approval actions – only shown when quotation is uploaded and awaiting approval */}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Name of Dealership
                  </label>
                  <input
                    value={costingForm.dealershipName}
                    onChange={(event) =>
                      setCostingField("dealershipName", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Brand
                  </label>
                  <input
                    value={costingForm.brand}
                    onChange={(event) =>
                      setCostingField("brand", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Car Model Name
                  </label>
                  <input
                    value={costingForm.carModelName}
                    onChange={(event) =>
                      setCostingField("carModelName", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Drive Link
                  </label>
                  <input
                    value={costingForm.driveLink}
                    onChange={(event) =>
                      setCostingField("driveLink", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Net Cost
                  </p>
                  {[
                    ["basicValue", "Basic Value"],
                    ["handlingCharges", "Handling Charges"],
                    ["crtm", "CRTM"],
                    ["insurance", "Insurance"],
                    ["cashComponent", "Cash Component"],
                    ["bureauVeritas", "Bureau Veritas"],
                    ["shippingCost", "Shipping Cost"],
                  ].map(([field, label]) => (
                    <div key={field} className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={(costingForm.netCost as any)[field]}
                        onChange={(event) =>
                          setCostingAmount("netCost", field, event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    Total: {netTotal.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Tax Amount
                  </p>
                  {[
                    ["carGst", "Car GST"],
                    ["bureauVeritasGst", "Bureau Veritas GST"],
                    ["shippingGst", "Shipping GST"],
                    ["tcs", "TCS 1%"],
                  ].map(([field, label]) => (
                    <div key={field} className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={(costingForm.taxAmount as any)[field]}
                        onChange={(event) =>
                          setCostingAmount(
                            "taxAmount",
                            field,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    Total: {taxTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Grand Total: {grandTotal.toLocaleString("en-IN")}
                </p>
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

