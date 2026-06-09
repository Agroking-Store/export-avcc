import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Download,
  ExternalLink,
  Grid,
  List,
  FolderOpen,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Info,
  Calendar,
  User,
  HardDrive,
  CheckSquare,
  ChevronDown,
} from "lucide-react";
import { documentApi, UnifiedDocument } from "../../../services/documentApi";
import { authStorage } from "../../../utils/authStorage";
import { apiConfig } from "../../../config/apiConfig";
import { motion, AnimatePresence } from "framer-motion";

const baseOrigin = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");

const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    dot: string; // Tailwind bg class for the colored dot
    bg: string;
    text: string;
    border: string;
    iconBg: string;
    rowBg: string; // subtle row highlight
  }
> = {
  invoice_commercial: {
    label: "Commercial Invoice",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900/50",
    iconBg: "from-emerald-500 to-emerald-600",
    rowBg: "bg-emerald-50/40 dark:bg-emerald-950/10",
  },
  invoice_usd: {
    label: "USD Invoice",
    dot: "bg-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-900/50",
    iconBg: "from-teal-500 to-teal-600",
    rowBg: "bg-teal-50/40 dark:bg-teal-950/10",
  },
  invoice_inr: {
    label: "INR Invoice",
    dot: "bg-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-900/50",
    iconBg: "from-green-500 to-green-600",
    rowBg: "bg-green-50/40 dark:bg-green-950/10",
  },
  proforma_invoice: {
    label: "Proforma Invoice",
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900/50",
    iconBg: "from-rose-500 to-rose-600",
    rowBg: "bg-rose-50/40 dark:bg-rose-950/10",
  },
  letter_of_credit: {
    label: "Letter of Credit",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/50",
    iconBg: "from-amber-500 to-amber-600",
    rowBg: "bg-amber-50/40 dark:bg-amber-950/10",
  },
  packing_list: {
    label: "Packing List",
    dot: "bg-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-900/50",
    iconBg: "from-cyan-500 to-cyan-600",
    rowBg: "bg-cyan-50/40 dark:bg-cyan-950/10",
  },
  hbl_document: {
    label: "House Bill of Lading",
    dot: "bg-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-900/50",
    iconBg: "from-violet-500 to-violet-600",
    rowBg: "bg-violet-50/40 dark:bg-violet-950/10",
  },
  shippingBill: {
    label: "Shipping Bill",
    dot: "bg-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-900/50",
    iconBg: "from-purple-500 to-purple-600",
    rowBg: "bg-purple-50/40 dark:bg-purple-950/10",
  },
  clientCorrection: {
    label: "Client Correction",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-900/50",
    iconBg: "from-indigo-500 to-indigo-600",
    rowBg: "bg-indigo-50/40 dark:bg-indigo-950/10",
  },
  quotation: {
    label: "Quotation",
    dot: "bg-slate-500",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700/50",
    iconBg: "from-slate-500 to-slate-600",
    rowBg: "bg-slate-50/40 dark:bg-slate-800/20",
  },
  form20: {
    label: "Form 20",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900/50",
    iconBg: "from-blue-500 to-blue-600",
    rowBg: "bg-blue-50/40 dark:bg-blue-950/10",
  },
  form21: {
    label: "Form 21",
    dot: "bg-sky-500",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-900/50",
    iconBg: "from-sky-500 to-sky-600",
    rowBg: "bg-sky-50/40 dark:bg-sky-950/10",
  },
  form22: {
    label: "Form 22",
    dot: "bg-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-600 dark:text-blue-300",
    border: "border-blue-100 dark:border-blue-900/30",
    iconBg: "from-blue-400 to-blue-500",
    rowBg: "bg-blue-50/30 dark:bg-blue-950/10",
  },
  tempRegCert: {
    label: "Temp Registration",
    dot: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-900/50",
    iconBg: "from-orange-500 to-orange-600",
    rowBg: "bg-orange-50/40 dark:bg-orange-950/10",
  },
  bvCertificate: {
    label: "BV Certificate",
    dot: "bg-lime-500",
    bg: "bg-lime-50 dark:bg-lime-950/30",
    text: "text-lime-700 dark:text-lime-400",
    border: "border-lime-200 dark:border-lime-900/50",
    iconBg: "from-lime-500 to-lime-600",
    rowBg: "bg-lime-50/40 dark:bg-lime-950/10",
  },
  dealerInvoice: {
    label: "Dealer Invoice",
    dot: "bg-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-900/50",
    iconBg: "from-pink-500 to-pink-600",
    rowBg: "bg-pink-50/40 dark:bg-pink-950/10",
  },
};

const DEFAULT_STYLE = {
  label: "Document",
  dot: "bg-gray-400",
  bg: "bg-gray-50 dark:bg-gray-800/40",
  text: "text-gray-600 dark:text-gray-400",
  border: "border-gray-200 dark:border-gray-700/50",
  iconBg: "from-gray-400 to-gray-500",
  rowBg: "",
};

const getDocumentStyle = (type: string) => {
  const t = type.toLowerCase();
  // exact match first
  if (CATEGORY_CONFIG[type]) return CATEGORY_CONFIG[type];
  // partial match fallback
  for (const [key, cfg] of Object.entries(CATEGORY_CONFIG)) {
    if (t.includes(key.toLowerCase())) return cfg;
  }
  return DEFAULT_STYLE;
};

// ─── Custom Dropdown ─────────────────────────────────────────────────────────
interface DropdownOption {
  value: string;
  label: string;
  dotClass?: string;
}

interface ColorDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  placeholder: string;
}

const ColorDropdown: React.FC<ColorDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex items-center gap-2 bg-slate-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm text-slate-700 dark:text-gray-300 hover:border-blue-400 transition min-w-[170px] justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          {selected ? (
            <>
              {selected.dotClass && (
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dotClass}`}
                />
              )}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.13 }}
              className="absolute left-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[200px] max-h-72 overflow-y-auto"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition hover:bg-slate-50 dark:hover:bg-gray-800 ${
                    value === opt.value
                      ? "bg-blue-50 dark:bg-blue-950/30 font-semibold"
                      : ""
                  }`}
                >
                  {opt.dotClass ? (
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dotClass}`}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-transparent border border-slate-300" />
                  )}
                  <span className="text-slate-700 dark:text-gray-300">
                    {opt.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Doc type options ─────────────────────────────────────────────────────────
const DOC_TYPE_OPTIONS: DropdownOption[] = [
  { value: "", label: "All Types" },
  {
    value: "proforma_invoice",
    label: "Proforma Invoice",
    dotClass: CATEGORY_CONFIG.proforma_invoice.dot,
  },
  {
    value: "letter_of_credit",
    label: "Letter of Credit",
    dotClass: CATEGORY_CONFIG.letter_of_credit.dot,
  },
  {
    value: "hbl_document",
    label: "House Bill of Lading",
    dotClass: CATEGORY_CONFIG.hbl_document.dot,
  },
  { value: "form20", label: "Form 20", dotClass: CATEGORY_CONFIG.form20.dot },
  { value: "form21", label: "Form 21", dotClass: CATEGORY_CONFIG.form21.dot },
  { value: "form22", label: "Form 22", dotClass: CATEGORY_CONFIG.form22.dot },
  {
    value: "tempRegCert",
    label: "Temp Registration",
    dotClass: CATEGORY_CONFIG.tempRegCert.dot,
  },
  {
    value: "bvCertificate",
    label: "BV Certificate",
    dotClass: CATEGORY_CONFIG.bvCertificate.dot,
  },
  {
    value: "dealerInvoice",
    label: "Dealer Invoice",
    dotClass: CATEGORY_CONFIG.dealerInvoice.dot,
  },
  {
    value: "shippingBill",
    label: "Shipping Bill",
    dotClass: CATEGORY_CONFIG.shippingBill.dot,
  },
  {
    value: "quotation",
    label: "Quotation",
    dotClass: CATEGORY_CONFIG.quotation.dot,
  },
  {
    value: "clientCorrection",
    label: "Client Correction",
    dotClass: CATEGORY_CONFIG.clientCorrection.dot,
  },
  {
    value: "invoice_usd",
    label: "USD Invoice",
    dotClass: CATEGORY_CONFIG.invoice_usd.dot,
  },
  {
    value: "invoice_inr",
    label: "INR Invoice",
    dotClass: CATEGORY_CONFIG.invoice_inr.dot,
  },
  {
    value: "invoice_commercial",
    label: "Commercial Invoice",
    dotClass: CATEGORY_CONFIG.invoice_commercial.dot,
  },
  {
    value: "packing_list",
    label: "Packing List",
    dotClass: CATEGORY_CONFIG.packing_list.dot,
  },
];

const ENTITY_TYPE_OPTIONS: DropdownOption[] = [
  // { value: "", label: "All Entities" },
  {
    value: "proforma_invoice",
    label: "Proforma Invoice",
    dotClass: "bg-rose-400",
  },
  {
    value: "vehicle_booking",
    label: "Vehicle Booking",
    dotClass: "bg-blue-400",
  },
  { value: "invoice", label: "Invoice", dotClass: "bg-emerald-400" },
];

// ─── Format display name ──────────────────────────────────────────────────────
const formatDisplayName = (doc: UnifiedDocument) => {
  const name = doc.fileName.replace(/_/g, " ");
  return doc.relatedEntity ? `${doc.relatedEntity} – ${name}` : name;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DocumentExplorer = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [docType, setDocType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await documentApi.fetchDocuments({
        search: debouncedSearch,
        docType,
        entityType,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: 12,
      });
      setDocuments(res.data);
      setTotalDocs(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [debouncedSearch, docType, entityType, sortBy, sortOrder, currentPage]);

  const handleReset = () => {
    setSearch("");
    setDocType("");
    setEntityType("");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleViewFile = (doc: UnifiedDocument) => {
    const token = authStorage.getToken();
    const separator = doc.viewUrl.includes("?") ? "&" : "?";
    const fullUrl = `${baseOrigin}${doc.viewUrl}${separator}token=${token}`;
    window.open(fullUrl, "_blank");
  };

  const handleDownloadFile = (doc: UnifiedDocument) => {
    const token = authStorage.getToken();
    const separator = doc.downloadUrl.includes("?") ? "&" : "?";
    const fullUrl = `${baseOrigin}${doc.downloadUrl}${separator}token=${token}&download=true`;
    window.open(fullUrl, "_blank");
  };

  const handleNavigateToSource = (doc: UnifiedDocument) => {
    if (
      doc.relatedEntityType === "vehicle_booking" &&
      (doc as any).bookingOrderId
    ) {
      navigate(
        `/vehicles/orders/${(doc as any).bookingOrderId}/unit-view/${
          (doc as any).bookingVehicleIndex ?? 0
        }`,
      );
    } else if (
      doc.relatedEntityType === "proforma_invoice" &&
      (doc as any).piId
    ) {
      navigate(`/proforma-invoice/${(doc as any).piId}`);
    } else if (doc.relatedEntityType === "invoice" && (doc as any).piId) {
      navigate(`/proforma-invoice/${(doc as any).piId}`);
    }
  };

  const getStats = () => {
    const totalCount = totalDocs;
    const tradeCount = documents.filter((d) =>
      [
        "proforma_invoice",
        "letter_of_credit",
        "invoice_usd",
        "invoice_inr",
        "invoice_commercial",
        "packing_list",
      ].includes(d.documentType),
    ).length;
    const registrationCount = documents.filter((d) =>
      [
        "form20",
        "form21",
        "form22",
        "tempRegCert",
        "bvCertificate",
        "dealerInvoice",
        "shippingBill",
      ].includes(d.documentType),
    ).length;
    const correctionCount = documents.filter(
      (d) => d.documentType === "clientCorrection",
    ).length;
    return { totalCount, tradeCount, registrationCount, correctionCount };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center justify-between border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none flex-shrink-0">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Document Explorer
              </h1>
              <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
                Centralized access, search, and validation of all trade,
                registration, and invoicing documents.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="cursor-pointer p-3 text-slate-500 hover:text-blue-600 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Refresh documents"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "All Documents",
              val: stats.totalCount,
              icon: <HardDrive size={22} className="text-blue-500" />,
              gradient: "from-blue-500/10 to-indigo-500/10",
            },
            {
              label: "Trade & Invoices",
              val: stats.tradeCount,
              icon: <FileSpreadsheet size={22} className="text-emerald-500" />,
              gradient: "from-emerald-500/10 to-teal-500/10",
            },
            {
              label: "Registration / Custom",
              val: stats.registrationCount,
              icon: <CheckSquare size={22} className="text-purple-500" />,
              gradient: "from-purple-500/10 to-pink-500/10",
            },
            {
              label: "Client Corrections",
              val: stats.correctionCount,
              icon: <FileCode size={22} className="text-amber-500" />,
              gradient: "from-amber-500/10 to-orange-500/10",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : (
                    card.val
                  )}
                </h3>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient}`}
              >
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Left: filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <ColorDropdown
                value={docType}
                onChange={(val) => {
                  setDocType(val);
                  setCurrentPage(1);
                }}
                options={DOC_TYPE_OPTIONS}
                placeholder="All Types"
              />
              {/* <ColorDropdown
                value={entityType}
                onChange={(val) => { setEntityType(val); setCurrentPage(1); }}
                options={ENTITY_TYPE_OPTIONS}
                placeholder="All Entities"
              />
              {(docType || entityType || search) && (
                <button
                  onClick={handleReset}
                  className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-700 transition"
                >
                  Clear Filters
                </button>
              )} */}
            </div>

            {/* Right: Search, Sorting & Grid Toggle */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search file, entity or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-sm text-slate-700 dark:text-gray-300 outline-none cursor-pointer pr-3"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                  }
                  className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  title="Toggle order direction"
                >
                  {sortOrder === "asc" ? "ASC" : "DESC"}
                </button>
              </div>

              <div className="flex bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`cursor-pointer p-1.5 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`cursor-pointer p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Grid size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING OR EMPTY STATE */}
        {loading && documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              Scanning trade files...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl">
            <FolderOpen className="w-16 h-16 text-slate-300 dark:text-gray-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">
              No documents found
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Try refining your filter criteria or search keyword.
            </p>
            <button
              onClick={handleReset}
              className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-1/3">
                          File Name
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                          Related Entity
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        {/* <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                          Size
                        </th> */}
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-40">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {documents.map((doc) => {
                        const style = getDocumentStyle(doc.documentType);
                        return (
                          <tr
                            key={doc.id}
                            className={`transition duration-150 hover:brightness-95 dark:hover:brightness-110 ${style.rowBg}`}
                          >
                            {/* File Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                                >
                                  <FileText size={18} />
                                </div>
                                <div className="max-w-xs md:max-w-md truncate">
                                  <div
                                    onClick={() => handleViewFile(doc)}
                                    className="text-sm font-semibold text-slate-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                                    title={doc.fileName}
                                  >
                                    {formatDisplayName(doc)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-gray-500 truncate mt-0.5">
                                    Buyer: {doc.buyerName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Type Badge */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`}
                                />
                                {doc.documentTypeName}
                              </span>
                            </td>

                            {/* Related Entity */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">
                                  {doc.relatedEntity}
                                </span>
                                {[
                                  "vehicle_booking",
                                  "proforma_invoice",
                                  "invoice",
                                ].includes(doc.relatedEntityType) && (
                                  <button
                                    onClick={() => handleNavigateToSource(doc)}
                                    className="cursor-pointer text-blue-500 hover:text-blue-700 transition"
                                    title="Go to source module"
                                  >
                                    <ExternalLink size={13} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Upload Date */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-slate-500 dark:text-gray-500">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                <span>
                                  {new Date(
                                    doc.uploadDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </td>

                            {/* Size */}
                            {/* <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-600 dark:text-gray-400">
                              {formatBytes(doc.fileSize)}
                            </td> */}

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => handleViewFile(doc)}
                                  className="cursor-pointer p-2 text-slate-600 hover:text-blue-600 hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition"
                                  title="View File Inline"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(doc)}
                                  className="cursor-pointer p-2 text-slate-600 hover:text-emerald-600 hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition"
                                  title="Download File"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {documents.map((doc) => {
                  const style = getDocumentStyle(doc.documentType);
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={`border border-slate-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${style.rowBg || "bg-white dark:bg-gray-900"}`}
                    >
                      <div
                        className={`h-1.5 w-full bg-gradient-to-r ${style.iconBg} absolute top-0 left-0`}
                      />

                      <div className="mt-2">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                          >
                            <FileText size={18} />
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`}
                            />
                            {doc.documentTypeName}
                          </span>
                        </div>

                        <h4
                          onClick={() => handleViewFile(doc)}
                          className="text-sm font-semibold text-slate-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer mt-3 leading-snug truncate"
                          title={doc.fileName}
                        >
                          {formatDisplayName(doc)}
                        </h4>

                        <div className="space-y-1 mt-3 text-xs text-slate-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Info
                              size={12}
                              className="text-slate-400 flex-shrink-0"
                            />
                            <span className="truncate">
                              {doc.relatedEntity}
                            </span>
                            {[
                              "vehicle_booking",
                              "proforma_invoice",
                              "invoice",
                            ].includes(doc.relatedEntityType) && (
                              <button
                                onClick={() => handleNavigateToSource(doc)}
                                className="cursor-pointer text-blue-500 hover:text-blue-700 transition"
                              >
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              size={12}
                              className="text-slate-400 flex-shrink-0"
                            />
                            <span>
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User
                              size={12}
                              className="text-slate-400 flex-shrink-0"
                            />
                            <span>By: {doc.uploadedBy}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-gray-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Size: {formatBytes(doc.fileSize)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 truncate">
                              Buyer: {doc.buyerName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center justify-end border-t border-slate-100 dark:border-gray-800 mt-4 pt-3">
                        <button
                          onClick={() => handleViewFile(doc)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white/80 dark:hover:bg-slate-800 transition"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-600 hover:bg-white/80 dark:hover:bg-slate-800 transition"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* PAGINATION */}
        {documents.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-5 mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">
              Showing page{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {currentPage}
              </span>{" "}
              of <span className="font-bold">{totalPages}</span> ({totalDocs}{" "}
              documents total)
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="cursor-pointer inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loading}
                className="cursor-pointer inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-800 dark:text-gray-200 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentExplorer;
