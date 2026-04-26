import { useEffect, useRef, useState } from "react";
import { X, Upload, FileText, Eye, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { apiConfig } from "../../../config/apiConfig";
import {
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

const QuotationModal = ({ isOpen, onClose, booking, onSync }: Props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [quotationSaving, setQuotationSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setRejectReason(booking.rejectionReason || "");
      setSelectedFile(null);
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
          : "Quotation uploaded successfully",
      );
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload quotation");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Unit {booking.vehicleIndex + 1}
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
              disabled={quotationSaving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={16} />
              {booking.quotationFile ? "Replace File" : "Upload File"}
            </button>
          </div>

          {/* Approval actions – only shown when quotation is uploaded and awaiting approval */}
          {booking.quotationFile &&
            booking.status === "quotation_uploaded" && (
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

