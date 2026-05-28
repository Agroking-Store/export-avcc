import React, { useState } from "react";
import { X, Eye, Download, FileText, AlertCircle, Receipt, Upload } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { apiConfig } from "@/config/apiConfig";
import { VehicleBookingItem } from "../../../services/vehicleBookingApi";
import { useAuth } from "../../../hooks/useAuth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem;
}

const VehicleBookingDocumentViewModal = ({ isOpen, onClose, booking }: Props) => {
  const { isClient } = useAuth();
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [uploadingCorrection, setUploadingCorrection] = useState(false);

  if (!isOpen) return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("auth_token");

  const docs = isClient
    ? []
    : [
        // Admin / Sourcing team: full document list
        { label: "Form 20", key: "form20" },
        { label: "Form 21", key: "form21" },
        { label: "Form 22", key: "form22" },
        { label: "Temporary Registration", key: "tempRegCert" },
        { label: "BV Certificate", key: "bvCertificate" },
        { label: "HBL", key: "hblDocument" },
        { label: "Shipping Bill", key: "shippingBill" },
    ];

  const appendToken = (url: string) =>
    token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;

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

  const commercialInvoice = booking?.commercialInvoices?.find(
    (invoice: any) => invoice.type === "COMMERCIAL",
  );
  const mergedUrl = appendToken(
    `${apiConfig.baseURL}/vehicle-bookings/${booking._id}/client-documents/merged`,
  );

  const clientDocs = isClient
    ? [
        {
          label: "Commercial Invoice",
          available: !!commercialInvoice,
          url: commercialInvoice
            ? appendToken(`${apiConfig.baseURL}/invoices/${commercialInvoice._id}/download`)
            : "",
          Icon: Receipt,
        },
        {
          label: "HBL",
          available: !!booking?.documents?.hblDocument,
          url: booking?.documents?.hblDocument
            ? getFileUrl("hblDocument", false)
            : "",
          Icon: FileText,
        },
        {
          label: "BV Certificate",
          available: !!booking?.documents?.bvCertificate,
          url: booking?.documents?.bvCertificate
            ? getFileUrl("bvCertificate", false)
            : "",
          Icon: FileText,
        },
        {
          label: "Shipping Bill",
          available: !!booking?.documents?.shippingBill,
          url: booking?.documents?.shippingBill
            ? getFileUrl("shippingBill", false)
            : "",
          Icon: FileText,
        },
      ]
    : [];

  const getCorrectionFileUrl = (correctionId: string, download = false) => {
    const cleanBaseUrl = apiConfig.baseURL.endsWith("/")
      ? apiConfig.baseURL.slice(0, -1)
      : apiConfig.baseURL;
    const params = new URLSearchParams();
    if (download) params.append("download", "true");
    if (token) params.append("token", token);

    return `${cleanBaseUrl}/vehicle-bookings/${booking._id}/client-corrections/${correctionId}?${params.toString()}`;
  };

  const handleCorrectionUpload = async () => {
    if (!correctionFile) {
      toast.error("Please select a correction document");
      return;
    }

    try {
      setUploadingCorrection(true);
      const formData = new FormData();
      formData.append("clientCorrection", correctionFile);
      await api.post(
        `/vehicle-bookings/${booking._id}/client-corrections`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      toast.success("Correction document uploaded");
      setCorrectionFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload correction");
    } finally {
      setUploadingCorrection(false);
    }
  };

  const hasAnyDoc =
    docs.some((d) => booking?.documents?.[d.key as keyof typeof booking.documents]) ||
    clientDocs.length > 0;

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
            className="cursor-pointer p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"/>
          {isClient && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <a
                href={mergedUrl}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
              >
                <Eye size={14} />
                View Merged Documents
              </a>
            </div>
          )}

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
                        className="cursor-pointer p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </a>
                      <a
                        href={getFileUrl(doc.key, true)}
                        className="cursor-pointer p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
              {clientDocs.map(({ label, available, url, Icon }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between p-4 border rounded-2xl group transition-all duration-300 ${
                    available
                      ? "bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md"
                      : "bg-slate-50/70 border-slate-100 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                        available
                          ? "bg-indigo-100 text-indigo-600 group-hover:scale-110"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 leading-none mb-1">
                        {label}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {available ? "PDF Document" : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {available ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed p-2 bg-white text-slate-300 border border-slate-200 rounded-lg shadow-sm"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!isClient && (booking.clientCorrections || []).length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-amber-800">
                    Client Corrections
                  </p>
                  <div className="space-y-2">
                    {(booking.clientCorrections || []).map((correction, index) => (
                      <div
                        key={correction._id || correction.filePath}
                        className="flex items-center justify-between rounded-xl border border-amber-100 bg-white p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-700">
                            {correction.originalName || `Correction ${index + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {correction.uploadedAt
                              ? new Date(correction.uploadedAt).toLocaleString()
                              : "Uploaded by client"}
                          </p>
                        </div>
                        {correction._id && (
                          <div className="flex items-center gap-2">
                            <a
                              href={getCorrectionFileUrl(correction._id)}
                              target="_blank"
                              rel="noreferrer"
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={getCorrectionFileUrl(correction._id, true)}
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isClient && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-700">
                    Upload Correction
                  </p>
                  <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50">
                    <Upload size={14} />
                    <span className={`truncate ${correctionFile ? "font-semibold text-indigo-600" : ""}`}>
                      {correctionFile?.name || "Choose correction document..."}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setCorrectionFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    onClick={handleCorrectionUpload}
                    disabled={uploadingCorrection || !correctionFile}
                    className="w-full cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingCorrection ? "Uploading..." : "Submit Correction"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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

export default VehicleBookingDocumentViewModal;

