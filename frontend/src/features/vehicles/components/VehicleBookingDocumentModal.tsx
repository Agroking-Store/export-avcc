import React, { useState } from "react";
import { X, Upload, CheckCircle2, Lock } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { VehicleBookingItem } from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem;
  onSuccess: () => void;
}

const VehicleBookingDocumentModal = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any>({});

  // States for Steps
  const isCRTMDone = !!booking?.isCRTMUploaded;
  const isBVDone = !!booking?.isBVUploaded;

  if (!isOpen) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    if (e.target.files?.[0]) {
      setFiles((prev: any) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleUpload = async (type: "CRTM" | "BV") => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (type === "CRTM") {
        if (
          !files.form20 ||
          !files.form21 ||
          !files.form22 ||
          !files.tempRegCert
        ) {
          toast.error("Please select all 4 CRTM documents");
          setLoading(false);
          return;
        }
        formData.append("form20", files.form20);
        formData.append("form21", files.form21);
        formData.append("form22", files.form22);
        formData.append("tempRegCert", files.tempRegCert);
      } else {
        if (!files.bvCertificate) {
          toast.error("Please select the BV Certificate");
          setLoading(false);
          return;
        }
        formData.append("bvCertificate", files.bvCertificate);
      }

      await api.post(`/vehicle-bookings/${booking._id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`${type} Documents Uploaded Successfully`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({ label, field, disabled }: any) => (
    <div className={`flex flex-col gap-1 ${disabled ? "opacity-50" : ""}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          disabled={disabled}
          onChange={(e) => handleFileChange(e, field)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600">
          <Upload size={14} />
          {files[field] ? (
            <span className="text-indigo-600 font-medium truncate">
              {files[field].name}
            </span>
          ) : (
            "Choose file..."
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Unit Documentation
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage registration and inspection docs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* STEP 1: CRTM */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                STEP 1
              </span>
              <h3 className="font-bold text-slate-700 text-sm">
                CRTM Documents
              </h3>
              {isCRTMDone && (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
            </div>

            {isCRTMDone ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <p className="text-xs font-bold text-emerald-800 uppercase">
                  CRTM Documents Uploaded
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FileInput label="Form 20" field="form20" />
                  <FileInput label="Form 21" field="form21" />
                  <FileInput label="Form 22" field="form22" />
                  <FileInput label="Temp Reg (TP)" field="tempRegCert" />
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleUpload("CRTM")}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md"
                >
                  {loading ? "Uploading..." : "Submit CRTM Documents"}
                </button>
              </div>
            )}
          </section>

          {/* STEP 2: BV */}
          <section className={`space-y-4 ${!isCRTMDone ? "opacity-40" : ""}`}>
            <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3">
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded">
                STEP 2
              </span>
              <h3 className="font-bold text-slate-700 text-sm">
                BV Certification
              </h3>
              {isBVDone ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                !isCRTMDone && <Lock size={14} className="text-slate-400" />
              )}
            </div>

            {isBVDone ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <p className="text-xs font-bold text-emerald-800 uppercase">
                  BV Certificate Uploaded
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileInput
                  label="BV Inspection Certificate"
                  field="bvCertificate"
                  disabled={!isCRTMDone}
                />
                <button
                  disabled={loading || !isCRTMDone}
                  onClick={() => handleUpload("BV")}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-md"
                >
                  {loading ? "Uploading..." : "Submit BV Certificate"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default VehicleBookingDocumentModal;

