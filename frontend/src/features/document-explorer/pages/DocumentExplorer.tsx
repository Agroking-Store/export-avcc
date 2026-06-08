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

const getDocumentColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("invoice_usd") || t.includes("invoice_commercial")) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/50",
      iconBg: "from-emerald-500 to-emerald-600",
    };
  }
  if (t.includes("invoice_inr")) {
    return {
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-100 dark:border-green-900/50",
      iconBg: "from-green-500 to-green-600",
    };
  }
  if (t.includes("proforma")) {
    return {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-100 dark:border-rose-900/50",
      iconBg: "from-rose-500 to-rose-600",
    };
  }
  if (t.includes("letter_of_credit") || t.includes("lc")) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/50",
      iconBg: "from-amber-500 to-amber-600",
    };
  }
  if (t.includes("packing_list")) {
    return {
      bg: "bg-teal-50 dark:bg-teal-950/30",
      text: "text-teal-600 dark:text-teal-400",
      border: "border-teal-100 dark:border-teal-900/50",
      iconBg: "from-teal-500 to-teal-600",
    };
  }
  if (t.includes("correction")) {
    return {
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/50",
      iconBg: "from-indigo-500 to-indigo-600",
    };
  }
  if (t.includes("quotation")) {
    return {
      bg: "bg-slate-50 dark:bg-slate-800/40",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-100 dark:border-slate-700/50",
      iconBg: "from-slate-500 to-slate-600",
    };
  }
  // Sourcing fields form20, form21, form22 etc.
  return {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/50",
    iconBg: "from-blue-500 to-blue-600",
  };

};

 // Format document display name with vehicle identifier
 const formatDisplayName = (doc: UnifiedDocument) => {
   const name = doc.fileName.replace(/_/g, " ");
   return doc.relatedEntity ? `${doc.relatedEntity} – ${name}` : name;
 };

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

  // Debounce search input
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
    if (doc.relatedEntityType === "vehicle_booking" && (doc as any).bookingOrderId) {
      navigate(
        `/vehicles/orders/${(doc as any).bookingOrderId}/unit-view/${
          (doc as any).bookingVehicleIndex ?? 0
        }`
      );
    } else if (doc.relatedEntityType === "proforma_invoice" && (doc as any).piId) {
      navigate(`/proforma-invoice/${(doc as any).piId}`);
    } else if (doc.relatedEntityType === "invoice" && (doc as any).piId) {
      navigate(`/proforma-invoice/${(doc as any).piId}`);
    }
  };

  const getStats = () => {
    const totalCount = totalDocs;
    const tradeCount = documents.filter((d) =>
      ["proforma_invoice", "letter_of_credit", "invoice_usd", "invoice_inr", "invoice_commercial", "packing_list"].includes(
        d.documentType
      )
    ).length;
    const registrationCount = documents.filter((d) =>
      ["form20", "form21", "form22", "tempRegCert", "bvCertificate", "dealerInvoice", "shippingBill"].includes(
        d.documentType
      )
    ).length;
    const correctionCount = documents.filter((d) => d.documentType === "clientCorrection").length;

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
                Centralized access, search, and validation of all trade, registration, and invoicing documents.
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : card.val}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient}`}>
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
              {/* Document Type Dropdown */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none text-sm text-slate-700 dark:text-gray-300 outline-none pr-6 cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="proforma_invoice">Proforma Invoice</option>
                  <option value="letter_of_credit">Letter of Credit</option>
                  <option value="hbl_document">House Bill of Lading</option>
                  <option value="form20">Form 20</option>
                  <option value="form21">Form 21</option>
                  <option value="form22">Form 22</option>
                  <option value="tempRegCert">Temp Registration</option>
                  <option value="bvCertificate">BV Certificate</option>
                  <option value="dealerInvoice">Dealer Invoice</option>
                  <option value="shippingBill">Shipping Bill</option>
                  <option value="quotation">Quotation</option>
                  <option value="clientCorrection">Client Correction</option>
                  <option value="invoice_usd">USD Invoice</option>
                  <option value="invoice_inr">INR Invoice</option>
                  <option value="invoice_commercial">Commercial Invoice</option>
                  <option value="packing_list">Packing List</option>
                </select>
              </div>

              {/* Entity Type Dropdown */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none text-sm text-slate-700 dark:text-gray-300 outline-none pr-6 cursor-pointer"
                >
                  <option value="">All Entities</option>
                  <option value="proforma_invoice">Proforma Invoice</option>
                  <option value="vehicle_booking">Vehicle Booking</option>
                  <option value="invoice">Invoice</option>
                </select>
              </div>

              {/* Reset button */}
              {(docType || entityType || search) && (
                <button
                  onClick={handleReset}
                  className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-700 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right: Search, Sorting & Grid Toggle */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search file, entity or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Sorting */}
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
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  title="Toggle order direction"
                >
                  {sortOrder === "asc" ? "ASC" : "DESC"}
                </button>
              </div>

              {/* Grid/List View Toggles */}
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
            <p className="text-slate-500 text-sm font-medium">Scanning trade files...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl">
            <FolderOpen className="w-16 h-16 text-slate-300 dark:text-gray-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">No documents found</h3>
            <p className="text-slate-500 text-sm mt-1">Try refining your filter criteria or search keyword.</p>
            <button
              onClick={handleReset}
              className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* MAIN CONTENT VIEW */
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
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-40">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {documents.map((doc) => {
                        const style = getDocumentColor(doc.documentType);
                        return (
                          <tr
                            key={doc.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition duration-150"
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

                            {/* Type */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                              >
                                {doc.documentTypeName}
                              </span>
                            </td>

                            {/* Related Entity */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{doc.relatedEntity}</span>
                                {["vehicle_booking", "proforma_invoice", "invoice"].includes(
                                  doc.relatedEntityType
                                ) && (
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
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                            </td>

                            {/* Size */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-600 dark:text-gray-400">
                              {formatBytes(doc.fileSize)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => handleViewFile(doc)}
                                  className="cursor-pointer p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                  title="View File Inline"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(doc)}
                                  className="cursor-pointer p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
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
                  const style = getDocumentColor(doc.documentType);
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Top header decoration matching file color */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${style.iconBg} absolute top-0 left-0`} />

                      <div className="mt-2">
                        {/* File details */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                          >
                            <FileText size={18} />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {doc.documentTypeName}
                          </span>
                        </div>

                        {/* File Name */}
                        <h4
                          onClick={() => handleViewFile(doc)}
                          className="text-sm font-semibold text-slate-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer mt-3 leading-snug truncate"
                          title={doc.fileName}
                        >
                          {formatDisplayName(doc)}
                        </h4>

                        {/* Meta information */}
                        <div className="space-y-1 mt-3 text-xs text-slate-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Info size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{doc.relatedEntity}</span>
                            {["vehicle_booking", "proforma_invoice", "invoice"].includes(
                              doc.relatedEntityType
                            ) && (
                              <button
                                onClick={() => handleNavigateToSource(doc)}
                                className="cursor-pointer text-blue-500 hover:text-blue-700 transition"
                              >
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400 flex-shrink-0" />
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

                      {/* Card actions */}
                      <div className="flex gap-2 items-center justify-end border-t border-slate-100 dark:border-gray-800 mt-4 pt-3">
                        <button
                          onClick={() => handleViewFile(doc)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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

        {/* PAGINATION PANEL */}
        {documents.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-5 mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">
              Showing page{" "}
              <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of{" "}
              <span className="font-bold">{totalPages}</span> ({totalDocs} documents total)
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
