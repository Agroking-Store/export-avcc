import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import {
  Download,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PIDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPI = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/${id}`
      );

      setData(res.data);
    } catch (err) {
      toast.error("Failed to load PI details ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPI();
  }, [id]);

  const handlePdfAction = async (action: "view" | "download") => {
    try {
      setDownloading(true);
      let token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token && localStorage.getItem("user")) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "{}");
          token = userObj.token || userObj.accessToken;
        } catch (e) {}
      }
      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`,
        {
          responseType: "blob", // Important for receiving binary data
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      // Tag the blob explicitly as a PDF so the browser's native viewer takes over
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      if (action === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${data?.piNumber || "proforma-invoice"}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        toast.success("PDF Downloaded successfully!");
      }
    } catch (error) {
      console.error("PDF Download error", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const pi = data;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "pending_approval":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "draft":
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
      case "expired":
        return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "pending_approval":
        return <Clock className="w-3.5 h-3.5" />;
      case "expired":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr) return null;
    // Handle legacy string addresses
    if (typeof addr === "string")
      return <p className="text-sm text-zinc-600 dark:text-zinc-400">{addr}</p>;

    // Handle new address object
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/proforma-invoice")}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                Proforma Invoice
                {pi && (
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full border flex items-center gap-1.5 font-medium ${getStatusColor(
                      pi.status
                    )}`}
                  >
                    {getStatusIcon(pi.status)}
                    <span className="capitalize">
                      {pi.status?.replace("_", " ")}
                    </span>
                  </span>
                )}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Ref:{" "}
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {pi?.piNumber}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate(`/proforma-invoice/edit/${id}`)}
              variant="outline"
              className="h-10 px-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit PI
            </Button>
            <Button
              onClick={() => handlePdfAction("view")}
              disabled={!pi || downloading}
              variant="outline"
              className="h-10 px-4 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950/30 cursor-pointer transition-colors shadow-sm"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {downloading ? "Loading..." : "View PDF"}
            </Button>
            <Button
              onClick={() => handlePdfAction("download")}
              disabled={!pi || downloading}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer transition-colors shadow-sm"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center gap-4 bg-white/50 dark:bg-zinc-900/50 p-8 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-500 animate-spin" />
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Loading Document
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Fetching proforma invoice details...
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && pi && (
          <div className="bg-white dark:bg-[#0E0E10] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 overflow-hidden">
            {/* TOP DOCUMENT INFO */}
            <div className="p-8 sm:p-10 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-between gap-8 bg-zinc-50/50 dark:bg-zinc-900/20">
              {/* From/Exporter Info */}
              <div className="flex-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Exporter Details
                </h3>
                {pi.dealerDetails?.name ? (
                  <div className="space-y-1">
                    <p className="text-base font-medium text-zinc-900 dark:text-white">
                      {pi.dealerDetails.name}
                    </p>
                    {formatAddress(pi.dealerDetails.address)}
                    {pi.dealerDetails.gstin && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                        GSTIN:{" "}
                        <span className="font-mono">
                          {pi.dealerDetails.gstin}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Not specified</p>
                )}
              </div>

              {/* To/Client Info */}
              <div className="flex-1 sm:text-right">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Billed To
                </h3>
                <div>
                  <p className="text-base font-medium text-zinc-900 dark:text-white">
                    {pi.clientDetails?.name || pi.client_id?.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {pi.clientDetails?.companyName || pi.client_id?.companyName}
                  </p>
                  {formatAddress(pi.clientDetails?.address)}
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                    Code:{" "}
                    <span className="font-mono">
                      {pi.client_id?.clientCode}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* DATES & TERMS */}
            <div className="px-8 sm:px-10 py-6 border-b border-zinc-100 dark:border-zinc-800/60 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                  Issue Date
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(pi.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                  Validity Date
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(pi.validityDate)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                  Payment Terms
                </p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {pi.paymentTerms || "Not specified"}
                </p>
              </div>
              <div className="col-span-2 md:col-span-3 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                    Terms of Delivery
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.termsOfDelivery || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                    Incoterm
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.incoterm || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                    Port of Loading
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.portOfLoading || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                    Port of Discharge
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pi.portOfDischarge || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* VEHICLE DETAILS */}
            <div className="p-8 sm:p-10">
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        Description / Model
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Qty
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Rate
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {pi.vehicleDetails?.map((v: any, i: number) => {
                      const rate =
                        (Number(v.fob) || 0) + (Number(v.freight) || 0);
                      const amount = v.quantity * rate;
                      return (
                        <tr
                          key={i}
                          className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {v.model}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {v.chassisNo && <span>VIN: {v.chassisNo}</span>}
                              {v.engineNo && <span>Eng: {v.engineNo}</span>}
                              {v.color && <span>Clr: {v.color}</span>}
                              {v.engineCapacity && (
                                <span>Cap: {v.engineCapacity}cc</span>
                              )}
                              {v.fuelType && <span>Fuel: {v.fuelType}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-zinc-700 dark:text-zinc-300">
                            {v.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-700 dark:text-zinc-300 font-mono">
                            $
                            {rate.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100 font-mono">
                            $
                            {amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-widest">
                          Amount in Words
                        </span>
                        <p className="font-sans normal-case text-zinc-700 dark:text-zinc-300 mt-1">
                          {pi.amountInWords}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Grand Total
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-semibold text-zinc-900 dark:text-white font-mono tracking-tight">
                        $
                        {pi.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* BANK DETAILS FOOTER */}
            {(pi.bankDetails?.bankName || pi.bankDetails?.accountNo) && (
              <div className="px-8 sm:px-10 py-6 bg-zinc-50/50 dark:bg-[#121214] border-t border-zinc-100 dark:border-zinc-800/60 rounded-b-2xl">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Bank Details
                </h3>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {pi.bankDetails.bankName && (
                    <p>
                      <span className="text-zinc-500 mr-2">Bank:</span>
                      <span className="font-medium">
                        {pi.bankDetails.bankName}
                      </span>
                    </p>
                  )}
                  {pi.bankDetails.accountNo && (
                    <p>
                      <span className="text-zinc-500 mr-2">A/C No:</span>
                      <span className="font-mono font-medium">
                        {pi.bankDetails.accountNo}
                      </span>
                    </p>
                  )}
                  {pi.bankDetails.branchIfsc && (
                    <p>
                      <span className="text-zinc-500 mr-2">Branch/IFSC:</span>
                      <span className="font-mono font-medium">
                        {pi.bankDetails.branchIfsc}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PIDetails;
