import React from "react";
import { X, Eye, Download, FileText, AlertCircle } from "lucide-react";
import { apiConfig } from "@/config/apiConfig";
import { VehicleBookingItem } from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem;
}

const VehicleBookingDocumentViewModal = ({ isOpen, onClose, booking }: Props) => {
  if (!isOpen) return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("auth_token");

  const docs = [
    { label: "Form 20", key: "form20" },
    { label: "Form 21", key: "form21" },
    { label: "Form 22", key: "form22" },
    { label: "Temporary Registration", key: "tempRegCert" },
    { label: "BV Certificate", key: "bvCertificate" },
    { label: "Dealer Invoice", key: "dealerInvoice" },
  ];

  const getFileUrl = (field: string, download = false) => {
    const cleanBaseUrl = apiConfig.baseURL.endsWith("/")
      ? apiConfig.baseURL.slice(0, -1)
      : apiConfig.baseURL;

    const baseUrl = `${cleanBaseUrl}/vehicle-bookings/${booking._id}/files/${field}`;
    const params = new URLSearchParams();

    if (download) params.append("download", "true");
    if (token) {
      params.append("token", token);
    } else {
      console.error("CRITICAL: No token found in localStorage.");
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const hasAnyDoc = docs.some((d) => booking?.documents?.[d.key as keyof typeof booking.documents]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Document Library
            </h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              Unit Records
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!hasAnyDoc ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <AlertCircle size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => {
                const hasFile = booking?.documents?.[doc.key as keyof typeof booking.documents];
                if (!hasFile) return null;

                return (
                  <div
                    key={doc.key}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 leading-none mb-1">
                          {doc.label}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          PDF Document
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={getFileUrl(doc.key, false)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </a>
                      <a
                        href={getFileUrl(doc.key, true)}
                        className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleBookingDocumentViewModal;

