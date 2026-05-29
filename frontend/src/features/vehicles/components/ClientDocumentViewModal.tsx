import React, { useEffect, useState } from "react";
import {
  X,
  Eye,
  Download,
  FileText,
  AlertCircle,
  Loader2,
  Ship,
  Receipt,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { apiConfig } from "../../../config/apiConfig";
import {
  ClientDocumentInfo,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import { piApi } from "../../proforma-invoice/components/piApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

const ClientDocumentViewModal = ({ isOpen, onClose, bookingId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<ClientDocumentInfo | null>(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await vehicleBookingApi.getClientDocuments(bookingId);
        setDocs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("auth_token");

  const getBookingFileUrl = (field: string, download = false) => {
    const cleanBaseUrl = apiConfig.baseURL.endsWith("/")
      ? apiConfig.baseURL.slice(0, -1)
      : apiConfig.baseURL;
    const baseUrl = `${cleanBaseUrl}/vehicle-bookings/${bookingId}/files/${field}`;
    const params = new URLSearchParams();
    if (download) params.append("download", "true");
    if (token) params.append("token", token);
    return `${baseUrl}?${params.toString()}`;
  };

  const hasAnyDoc =
    docs?.bvCertificate?.available ||
    docs?.crtm?.available ||
    docs?.hblDocuments?.some((h) => h.available) ||
    docs?.commercialInvoices?.some((c) => c.available);

  const docItems: Array<{
    label: string;
    icon: React.ReactNode;
    available: boolean;
    getViewUrl: () => string;
    getDownloadUrl: () => string;
    subLabel?: string;
  }> = [
    {
      label: "HBL Document",
      icon: <Ship size={20} />,
      available: docs?.hblDocuments?.some((h) => h.available) || false,
      getViewUrl: () => {
        const pi = docs?.hblDocuments?.find((h) => h.available);
        return pi ? piApi.getHBLViewUrl(pi.piId) : "#";
      },
      getDownloadUrl: () => {
        const pi = docs?.hblDocuments?.find((h) => h.available);
        return pi ? piApi.getHBLViewUrl(pi.piId) + "?download=true" : "#";
      },
      subLabel: docs?.hblDocuments?.find((h) => h.available)?.piNumber,
    },
    {
      label: "Commercial Invoice",
      icon: <Receipt size={20} />,
      available: docs?.commercialInvoices?.some((c) => c.available) || false,
      getViewUrl: () => {
        const pi = docs?.commercialInvoices?.find((c) => c.available);
        return pi ? piApi.getPIViewUrl(pi.piId) : "#";
      },
      getDownloadUrl: () => {
        const pi = docs?.commercialInvoices?.find((c) => c.available);
        return pi ? piApi.getPIViewUrl(pi.piId, true) : "#";
      },
      subLabel: docs?.commercialInvoices?.find((c) => c.available)?.piNumber,
    },
    {
      label: "BV Certificate",
      icon: <ShieldCheck size={20} />,
      available: docs?.bvCertificate?.available || false,
      getViewUrl: () => getBookingFileUrl("bvCertificate", false),
      getDownloadUrl: () => getBookingFileUrl("bvCertificate", true),
    },
    {
      label: "CRTM Document",
      icon: <FileCheck size={20} />,
      available: docs?.crtm?.available || false,
      getViewUrl: () => getBookingFileUrl("crtm", false),
      getDownloadUrl: () => getBookingFileUrl("crtm", true),
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Export Documents
            </h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              Shipment & Compliance Records
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm font-bold">Loading documents...</p>
            </div>
          ) : !hasAnyDoc ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <AlertCircle size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">No documents available yet</p>
              <p className="text-xs mt-1 text-slate-300">
                Documents will appear here once uploaded
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {docItems.map((doc) => (
                <div
                  key={doc.label}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    doc.available
                      ? "bg-slate-50 border-slate-100 group hover:bg-white hover:border-indigo-100 hover:shadow-md"
                      : "bg-slate-50/40 border-slate-100/60 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                        doc.available
                          ? "bg-indigo-100 text-indigo-600 group-hover:scale-110"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {doc.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 leading-none mb-1">
                        {doc.label}
                      </p>
                      {doc.subLabel && doc.available ? (
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">
                          {doc.subLabel}
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                          {doc.available ? "Available" : "Not uploaded"}
                        </p>
                      )}
                    </div>
                  </div>

                  {doc.available && (
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.getViewUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </a>
                      <a
                        href={doc.getDownloadUrl()}
                        className="cursor-pointer p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDocumentViewModal;
