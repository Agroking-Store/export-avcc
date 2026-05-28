import React, { useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { VehicleBookingItem } from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem;
  field: "hblDocument" | "shippingBill";
  title: string;
  label: string;
  tone: "cyan" | "emerald";
  onSuccess: () => void;
}

const toneClasses = {
  cyan: {
    border: "border-cyan-500",
    badge: "bg-cyan-100 text-cyan-700",
    button: "bg-cyan-600 hover:bg-cyan-700",
  },
  emerald: {
    border: "border-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
};

const VehicleSingleDocumentModal = ({
  isOpen,
  onClose,
  booking,
  field,
  title,
  label,
  tone,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const isUploaded = !!booking.documents?.[field];
  const styles = toneClasses[tone];

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      toast.error(`Please select ${label}`);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(field, file);

      await api.post(`/vehicle-bookings/${booking._id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`${label} uploaded successfully`);
      setFile(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">{title}</h2>
            <p className="text-xs font-medium text-slate-500">
              Upload or replace this vehicle document
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className={`flex items-center gap-2 border-l-4 pl-3 ${styles.border}`}>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}>
              DOCUMENT
            </span>
            <h3 className="text-sm font-bold text-slate-700">{label}</h3>
            {isUploaded && <CheckCircle2 size={16} className="text-emerald-500" />}
          </div>

          {isUploaded && !file && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold uppercase text-emerald-800">
                  {label} already uploaded
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-600">
                  Select a new file below to replace it
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              {isUploaded ? `Replace ${label}` : label}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50">
              <Upload size={14} />
              <span className={`truncate ${file ? "font-medium text-indigo-600" : ""}`}>
                {file?.name || "Choose file..."}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              disabled={loading || !file}
              onClick={handleUpload}
              className={`w-full cursor-pointer rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
            >
              {loading ? "Uploading..." : isUploaded ? `Replace ${label}` : `Submit ${label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSingleDocumentModal;
