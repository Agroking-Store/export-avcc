import React, { useState } from "react";
import { X, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { VehicleBookingItem } from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem;
  onSuccess: () => void;
}

const VehicleDealerInvoiceModal = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const isUploaded = !!booking?.isDealerInvoiceUploaded;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        toast.error("Please select a Dealer Invoice file");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("dealerInvoice", file);

      await api.post(`/vehicle-bookings/${booking._id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Dealer Invoice Uploaded Successfully");
      setFile(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Dealer Invoice
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Upload or replace dealer invoice document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-l-4 border-purple-500 pl-3">
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">
              DOCUMENT
            </span>
            <h3 className="font-bold text-slate-700 text-sm">
              Dealer Invoice
            </h3>
            {isUploaded && (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
          </div>

          {isUploaded && !file && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase">
                  Dealer Invoice Already Uploaded
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  Select a new file below to replace it
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                {isUploaded ? "Replace Dealer Invoice" : "Dealer Invoice"}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600">
                  <Upload size={14} />
                  {file ? (
                    <span className="text-indigo-600 font-medium truncate">
                      {file.name}
                    </span>
                  ) : (
                    "Choose file..."
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={loading || !file}
              onClick={handleUpload}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Uploading..."
                : isUploaded
                  ? "Replace Dealer Invoice"
                  : "Submit Dealer Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDealerInvoiceModal;

