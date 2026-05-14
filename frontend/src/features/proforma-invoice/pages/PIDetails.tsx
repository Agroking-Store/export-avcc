import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import {
  Download,
  Eye,
  ChevronLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Edit,
  Loader2,
  FileUp,
  MoreVertical,
  FileDown,
  RefreshCw,
  Upload,
  ShieldCheck,
  ShieldAlert,
  X,
  FileBadge,
  AlertTriangle,
  Car,
  AlertOctagon,
  Package2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProformaInvoiceAPI } from "../components/pi.types";
import { Button } from "@/components/ui/button";
import { piApi } from "../components/piApi";
import InvoiceTypeModal from "../components/InvoiceTypeModal";
import { invoiceApi } from "../components/invoiceApi";
import type { PIInvoiceContext } from "../components/invoice.types";
import HBLUploadModal from "../components/HBLUploadModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompareField {
  field: string;
  piValue: string;
  lcValue: string;
  type?: "vehicle";
}

interface ComparisonResult {
  status: "PASSED" | "FAILED";
  mismatches: CompareField[];
  matchedFields: CompareField[];
  vehicleMismatch: boolean;
  wrongLCAttached: boolean;
}

// ─── LC Upload Modal ──────────────────────────────────────────────────────────

interface LCModalProps {
  piId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LCUploadModal = ({ piId, onClose, onSuccess }: LCModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTicker = (from: number, to: number, label: string) => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    setProgressLabel(label);
    let cur = from;
    tickerRef.current = setInterval(() => {
      cur += Math.random() * 1.5;
      if (cur >= to) {
        cur = to;
        clearInterval(tickerRef.current!);
      }
      setProgress(Math.round(cur));
    }, 200);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleVerify = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setProgress(5);
    startTicker(5, 40, "Uploading document...");

    try {
      const res = await piApi.uploadLC(piId, selectedFile, {
        onUploadProgress: (evt: any) => {
          setProgress(Math.min(40, Math.round((evt.loaded / evt.total) * 40)));
        },
      });

      startTicker(42, 88, "Running OCR & extracting fields...");
      await new Promise((r) => setTimeout(r, 1000));

      setProgress(92);
      setProgressLabel("Comparing with PI data...");
      await new Promise((r) => setTimeout(r, 300));
      setProgress(100);
      setProgressLabel("Done");

      if (!res.comparison) {
        toast.error("Unexpected server response");
        return;
      }

      setResult(res.comparison as ComparisonResult);
      if (res.comparison.status === "PASSED") onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      if (tickerRef.current) clearInterval(tickerRef.current);
      setProcessing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setProgress(0);
    setProgressLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPassed = result?.status === "PASSED";

  // Split mismatches into vehicle and non-vehicle for separate rendering
  const vehicleMismatches =
    result?.mismatches.filter((m) => m.type === "vehicle") ?? [];
  const generalMismatches =
    result?.mismatches.filter((m) => m.type !== "vehicle") ?? [];
  const vehicleMatches =
    result?.matchedFields.filter((m) => m.type === "vehicle") ?? [];
  const generalMatches =
    result?.matchedFields.filter((m) => m.type !== "vehicle") ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <FileBadge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Verify Letter of Credit
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload the LC PDF to check it against this PI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ── Upload step ── */}
          {!result && (
            <>
              <div
                onClick={() => !processing && fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
                  ${
                    selectedFile
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/50"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  } ${processing ? "pointer-events-none opacity-60" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB · PDF
                    </p>
                    {!processing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                        className="mt-2 text-xs text-zinc-400 hover:text-red-500 transition-colors underline underline-offset-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Click to select LC PDF
                    </p>
                    <p className="text-xs text-zinc-400">PDF files only</p>
                  </div>
                )}
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {progressLabel}
                    </p>
                    <p className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {progress}%
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Result step ── */}
          {result && (
            <div className="space-y-4">
              {/* Wrong LC banner — shown when zero chassis numbers match */}
              {result.wrongLCAttached && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/10">
                  <AlertOctagon className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                      Wrong LC Attached
                    </p>
                    <p className="text-xs text-orange-600/80 dark:text-orange-500 mt-0.5">
                      None of the chassis numbers in this LC match the vehicles
                      on this Proforma Invoice. Please verify you have uploaded
                      the correct LC document.
                    </p>
                  </div>
                </div>
              )}

              {/* Overall status banner */}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                ${
                  isPassed
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                    : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30"
                }`}
              >
                {isPassed ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${isPassed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                  >
                    {isPassed
                      ? "All fields verified — LC matches PI"
                      : `${result.mismatches.length} mismatch${result.mismatches.length > 1 ? "es" : ""} found`}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isPassed ? "text-emerald-600/80 dark:text-emerald-500" : "text-red-600/80 dark:text-red-500"}`}
                  >
                    {isPassed
                      ? `${result.matchedFields.length} fields checked and matched`
                      : `${result.matchedFields.length} matched · ${result.mismatches.length} need attention`}
                  </p>
                </div>
              </div>

              {/* General mismatches */}
              {generalMismatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Document Mismatches
                  </p>
                  <div className="space-y-2">
                    {generalMismatches.map((m, i) => (
                      <MismatchCard key={i} item={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle mismatches */}
              {vehicleMismatches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Vehicle Mismatches
                    </p>
                  </div>
                  <div className="space-y-2">
                    {vehicleMismatches.map((m, i) => (
                      <MismatchCard key={i} item={m} accent="orange" />
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle matches */}
              {vehicleMatches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Vehicles Verified
                    </p>
                  </div>
                  <div className="space-y-1">
                    {vehicleMatches.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {m.field}
                          </p>
                          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500 font-mono truncate">
                            {m.piValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General matched fields (pill badges) */}
              {generalMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Matched
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generalMatches.map((m, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {m.field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {result ? (
            <>
              <button
                onClick={reset}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Upload another
              </button>
              <Button size="sm" onClick={onClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedFile || processing}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVerify();
                }}
                className="gap-2 min-w-[110px] cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify LC
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mismatch card sub-component ──────────────────────────────────────────────

const MismatchCard = ({
  item,
  accent = "red",
}: {
  item: CompareField;
  accent?: "red" | "orange";
}) => {
  const colors = {
    red: {
      wrap: "border-red-200 dark:border-red-500/30",
      header:
        "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
      icon: "text-red-500",
      title: "text-red-700 dark:text-red-400",
    },
    orange: {
      wrap: "border-orange-200 dark:border-orange-500/30",
      header:
        "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
      icon: "text-orange-500",
      title: "text-orange-700 dark:text-orange-400",
    },
  }[accent];

  return (
    <div
      className={`rounded-lg border ${colors.wrap} bg-white dark:bg-zinc-900 overflow-hidden`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 ${colors.header} border-b`}
      >
        <AlertTriangle className={`w-3.5 h-3.5 ${colors.icon} shrink-0`} />
        <p className={`text-xs font-semibold ${colors.title}`}>{item.field}</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800">
        <div className="px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1">
            PI Value
          </p>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all font-mono">
            {item.piValue || (
              <span className="italic not-italic text-zinc-400">—</span>
            )}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1">
            LC Value
          </p>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all font-mono">
            {item.lcValue || (
              <span className="italic not-italic text-zinc-400">—</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── PIDetails (main page) ────────────────────────────────────────────────────

const PIDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ProformaInvoiceAPI | null>(null);
  const [invoiceContext, setInvoiceContext] = useState<PIInvoiceContext | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [viewingLC, setViewingLC] = useState(false);
  const [showLCModal, setShowLCModal] = useState(false);
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showHBLModal, setShowHBLModal] = useState(false);

  const fetchPI = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const [piRes, invoiceRes] = await Promise.all([
        axios.get(`${apiConfig.baseURL}/proforma-invoices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        invoiceApi.getPIContext(id || ""),
      ]);
      setData(piRes.data);
      setInvoiceContext(invoiceRes);
    } catch {
      toast.error("Failed to load PI details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPI();
  }, [id]);

  const getToken = () => {
    let token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token && localStorage.getItem("user")) {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        token = u.token || u.accessToken;
      } catch {}
    }
    if (token?.startsWith('"') && token?.endsWith('"'))
      token = token.slice(1, -1);
    return token;
  };

  // const handleViewLC = async () => {
  //   try {
  //     setViewingLC(true);
  //     const res = await axios.get(`${apiConfig.baseURL}/proforma-invoices/${id}/lc/view`, {
  //       responseType: "blob",
  //       headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  //     });
  //     window.open(URL.createObjectURL(new Blob([res.data], { type: "application/pdf" })), "_blank");
  //   } catch { toast.error("Failed to open Letter of Credit"); }
  //   finally { setViewingLC(false); }
  // };

  // const handleViewLC = async () => {
  //   try {
  //     setViewingLC(true);
  //     const token = getToken();

  //     const res = await axios.get(
  //       `${apiConfig.baseURL}/proforma-invoices/${id}/lc/view`,
  //       {
  //         responseType: "blob",
  //         headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       },
  //     );

  //     // Check if we actually got a PDF
  //     if (res.data.type !== "application/pdf" && res.data.size < 100) {
  //       console.error("Received non-PDF or empty response");
  //       toast.error("Invalid PDF response from server");
  //       return;
  //     }

  //     const blobUrl = URL.createObjectURL(
  //       new Blob([res.data], { type: "application/pdf" }),
  //     );

  //     const newTab = window.open(blobUrl, "_blank");
  //     if (!newTab) {
  //       toast.warning("Popup blocked. PDF will download instead.");
  //       const a = document.createElement("a");
  //       a.href = blobUrl;
  //       a.download = "letter-of-credit.pdf"; // optional
  //       document.body.appendChild(a);
  //       a.click();
  //       a.remove();
  //     }

  //     // Optional: revoke URL after some time
  //     setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  //   } catch (err: any) {
  //     console.error("View LC Error:", err);
  //     console.error("Response data:", err.response?.data);
  //     console.error("Status:", err.response?.status);

  //     if (err.response?.status === 404) {
  //       toast.error("Letter of Credit file not found");
  //     } else if (err.response?.status === 401 || err.response?.status === 403) {
  //       toast.error("Authentication failed. Please login again.");
  //     } else {
  //       toast.error(
  //         err.response?.data?.message || "Failed to open Letter of Credit",
  //       );
  //     }
  //   } finally {
  //     setViewingLC(false);
  //   }
  // };

  const handleViewLC = () => {
    if (!id) return;
    const url = piApi.getLCViewUrl(id);
    window.open(url, "_blank"); // Direct Port 5000 link
  };

  // const handlePdfAction = async (action: "view" | "download") => {
  //   try {
  //     const res = await axios.get(
  //       `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`,
  //       {
  //         responseType: "blob",
  //         headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  //       },
  //     );
  //     const url = URL.createObjectURL(
  //       new Blob([res.data], { type: "application/pdf" }),
  //     );
  //     if (action === "view") {
  //       window.open(url, "_blank");
  //     } else {
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = `${data?.piNumber || "proforma-invoice"}.pdf`;
  //       document.body.appendChild(a);
  //       a.click();
  //       a.remove();
  //       toast.success("PDF downloaded");
  //     }
  //   } catch {
  //     toast.error("Failed to download PDF");
  //   }
  // };

  const handlePdfAction = (action: "view" | "download") => {
    if (!id) return;
    const url = piApi.getPIViewUrl(id, action === "download");

    if (action === "view") {
      window.open(url, "_blank"); // Direct Port 5000 link
    } else {
      // For direct download
      window.location.href = url;
    }
  };

  const pi = data;

  const handleInvoiceView = (
    invoiceId: string,
    type: "invoice" | "packing",
  ) => {
    window.open(
      type === "packing"
        ? invoiceApi.getPackingListViewUrl(invoiceId)
        : invoiceApi.getInvoiceViewUrl(invoiceId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleInvoiceDownload = async (
    invoiceId: string,
    type: "invoice" | "packing",
    fileName: string,
  ) => {
    try {
      await invoiceApi.downloadFile(
        type === "packing"
          ? invoiceApi.getPackingListViewUrl(invoiceId)
          : invoiceApi.getInvoiceViewUrl(invoiceId),
        fileName,
      );
      toast.success("Invoice downloaded");
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not specified";

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "pending_approval":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "lc_received":
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
      case "expired":
        return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr) return null;
    if (typeof addr === "string")
      return <p className="text-sm text-zinc-600 dark:text-zinc-400">{addr}</p>;
    return (
      <>
        {addr.houseBuilding && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {addr.houseBuilding}
          </p>
        )}
        {addr.streetArea && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {addr.streetArea}
          </p>
        )}
        {addr.cityTown && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {addr.cityTown}
          </p>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {[addr.state, addr.pincode].filter(Boolean).join(" - ")}
        </p>
        {addr.country && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {addr.country}
          </p>
        )}
      </>
    );
  };

  // NEW: opens InvoiceTypeModal — legacy form commented below
  const generateTaxInvoiceButton = (
    <Button
      onClick={() => setShowInvoiceTypeModal(true)}
      variant="outline"
      size="sm"
      className="h-9 border-blue-200 text-blue-600 hover:bg-blue-50 gap-2"
    >
      <FileText className="w-4 h-4" />
      Generate Tax Invoice
    </Button>
  );

  const handleViewHBL = () => {
    if (!id) return;
    window.open(piApi.getHBLViewUrl(id), "_blank");
  };

  return (
    <div className="bg-[#FAFAFA] dark:bg-[#0A0A0A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outline"
              size="icon"
              className="mt-1 h-10 w-10 rounded-full border-zinc-200 text-zinc-600 hover:bg-zinc-100 shrink-0"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Proforma Invoice
                </h2>
                {pi && (
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(pi.status)}`}
                  >
                    {pi.status?.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 font-medium">
                <p className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Ref:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-300">
                    {pi?.piNumber}
                  </span>
                </p>
                {(pi?.vehicleBookingIds?.length ?? 0) > 0 && (
                  <p className="flex items-center gap-1.5 border-l border-zinc-300 dark:border-zinc-700 pl-4">
                    <span className="text-zinc-400">Vehicles:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-300">
                      {pi?.vehicleBookingIds?.length ?? 0}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-center">
            {generateTaxInvoiceButton}

            {/* LC Actions */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {pi?.status === "lc_received" ? (
                <>
                  <Button
                    onClick={handleViewLC}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-2"
                  >
                    {viewingLC ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    View LC
                  </Button>

                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={() => setShowLCModal(true)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Replace & Re-verify LC
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() => setShowLCModal(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Upload LC
                </Button>
              )}
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 ml-2">
              {pi?.hblPath ? (
                <Button
                  onClick={handleViewHBL}
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 h-8 gap-2"
                >
                  <Eye className="w-4 h-4" /> View HBL
                </Button>
              ) : (
                <Button
                  onClick={() => setShowHBLModal(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                >
                  <FileUp className="w-4 h-4" /> Upload HBL
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              <Button
                onClick={() => handlePdfAction("view")}
                variant="outline"
                size="sm"
                className="h-9 border-blue-200 text-blue-600 hover:bg-blue-50 gap-2"
              >
                <Eye className="w-4 h-4" /> View PI
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2 border-zinc-200"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handlePdfAction("download")}
                    className="cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(`/proforma-invoice/edit/${id}`)}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center gap-4 bg-white/50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Loading Document
              </p>
            </div>
          </div>
        )}

        {!loading && pi && (
          <div className="bg-white dark:bg-[#0E0E10] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Exporter + Buyer */}
            <div className="p-8 sm:p-10 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-between gap-8 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Exporter Details
                </h3>
                {(pi.company_id as any)?.name ? (
                  <div className="space-y-1">
                    <p className="text-base font-medium text-zinc-900 dark:text-white">
                      {(pi.company_id as any).name}
                    </p>
                    {formatAddress((pi.company_id as any).address)}
                    {(pi.company_id as any).gstNumber && (
                      <p className="text-sm text-zinc-500 mt-2">
                        GSTIN:{" "}
                        <span className="font-mono">
                          {(pi.company_id as any).gstNumber}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Not specified</p>
                )}
              </div>
              <div className="flex-1 sm:text-right">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Billed To
                </h3>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {(pi.client_id as any)?.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {(pi.client_id as any)?.companyName}
                  </p>
                  {formatAddress(
                    (pi.client_id as any)?.address ||
                      (pi.client_id as any)?.country,
                  )}
                  <p className="text-sm text-zinc-500 mt-1">
                    Code:{" "}
                    <span className="font-mono">
                      {typeof pi.client_id === "object"
                        ? pi.client_id?.clientCode
                        : ""}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Dates & Terms */}
            <div className="px-8 sm:px-10 py-6 border-b border-zinc-100 dark:border-zinc-800/60 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                  Issue Date
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(pi.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                  Validity Date
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(pi.validityDate)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                  Payment Terms
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {pi.paymentTerms || "Not specified"}
                </p>
              </div>
              <div className="col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                    Terms of Delivery
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.termsOfDelivery || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                    Incoterm
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.incoterm || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                    Port of Loading
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.portOfLoading || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                    Port of Discharge
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.portOfDischarge || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Table */}
            <div className="p-8 sm:p-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Vehicle Invoice Tracker
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    View or download INR, USD, Commercial, and Packing List PDFs
                    per vehicle from this PI.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full min-w-[1150px] text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 text-left">VIN</th>
                      <th className="px-6 py-4 text-left">Model</th>
                      <th className="px-6 py-4 text-left">Variant</th>
                      <th className="px-6 py-4 text-right">Value</th>
                      <th className="px-6 py-4 text-left">INR Invoice</th>
                      <th className="px-6 py-4 text-left">USD Invoice</th>
                      <th className="px-6 py-4 text-left">
                        Commercial Invoice
                      </th>
                      <th className="px-6 py-4 text-left">Packing List</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {(invoiceContext?.vehicles || []).map((vehicle) => (
                      <tr
                        key={vehicle.vehicleId}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          {vehicle.chassisNo || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {vehicle.model || "—"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-mono">
                            {vehicle.make && <span>Make: {vehicle.make}</span>}
                            {vehicle.engineNo && (
                              <span>Eng: {vehicle.engineNo}</span>
                            )}
                            {vehicle.fuelType && (
                              <span>Fuel: {vehicle.fuelType}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                          {vehicle.variant || "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-medium font-mono text-zinc-900 dark:text-zinc-100">
                          USD{" "}
                          {vehicle.totalUSD.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        {(["INR", "USD", "COMMERCIAL"] as const).map(
                          (typeKey) => {
                            const invoice = vehicle.invoices[typeKey];
                            return (
                              <td key={typeKey} className="px-6 py-4">
                                {invoice ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                                      {invoice.invoiceNumber}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() =>
                                        handleInvoiceView(
                                          invoice._id,
                                          "invoice",
                                        )
                                      }
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() =>
                                        handleInvoiceDownload(
                                          invoice._id,
                                          "invoice",
                                          `${invoice.invoiceNumber}.pdf`,
                                        )
                                      }
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                            );
                          },
                        )}
                        <td className="px-6 py-4">
                          {vehicle.invoices.PACKING_LIST ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">
                                {vehicle.invoices.PACKING_LIST!.invoiceNumber}
                              </span>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  handleInvoiceView(
                                    vehicle.invoices.PACKING_LIST!._id,
                                    "packing",
                                  )
                                }
                              >
                                <Package2 className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  handleInvoiceDownload(
                                    vehicle.invoices.PACKING_LIST!._id,
                                    "packing",
                                    `${vehicle.invoices.PACKING_LIST!.invoiceNumber}-packing.pdf`,
                                  )
                                }
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-left text-sm font-medium text-zinc-500"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-widest">
                          Amount in Words
                        </span>
                        <p className="normal-case text-zinc-700 dark:text-zinc-300 mt-1">
                          {pi.amountInWords}
                        </p>
                      </td>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-right text-lg font-semibold font-mono text-zinc-900 dark:text-white"
                      >
                        USD{" "}
                        {pi.totalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bank Details */}
            {((pi.company_id as any)?.bankDetails?.bankName ||
              (pi.company_id as any)?.bankDetails?.accountNo) && (
              <div className="px-8 sm:px-10 py-6 bg-zinc-50/50 dark:bg-[#121214] border-t border-zinc-100 dark:border-zinc-800/60 rounded-b-2xl">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Bank Details
                </h3>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {(pi.company_id as any).bankDetails?.bankName && (
                    <p>
                      <span className="text-zinc-500 mr-2">Bank:</span>
                      <span className="font-medium">
                        {(pi.company_id as any).bankDetails.bankName}
                      </span>
                    </p>
                  )}
                  {(pi.company_id as any).bankDetails?.accountNo && (
                    <p>
                      <span className="text-zinc-500 mr-2">A/C No:</span>
                      <span className="font-mono font-medium">
                        {(pi.company_id as any).bankDetails.accountNo}
                      </span>
                    </p>
                  )}
                  {(pi.company_id as any).bankDetails?.branchIfsc && (
                    <p>
                      <span className="text-zinc-500 mr-2">Branch/IFSC:</span>
                      <span className="font-mono font-medium">
                        {(pi.company_id as any).bankDetails.branchIfsc}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <InvoiceTypeModal
        open={showInvoiceTypeModal}
        onOpenChange={setShowInvoiceTypeModal}
        context={invoiceContext}
      />

      {showLCModal && id && (
        <LCUploadModal
          piId={id}
          onClose={() => setShowLCModal(false)}
          onSuccess={() => {
            setShowLCModal(false);
            fetchPI();
          }}
        />
      )}

      {showHBLModal && id && (
        <HBLUploadModal
          piId={id}
          onClose={() => setShowHBLModal(false)}
          onSuccess={() => {
            setShowHBLModal(false);
            fetchPI();
          }}
        />
      )}
    </div>
  );
};

export default PIDetails;
