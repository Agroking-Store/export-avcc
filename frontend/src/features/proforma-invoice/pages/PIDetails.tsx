import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import { Download, Eye } from "lucide-react";

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
    new Date(date).toISOString().split("T")[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "pending_approval":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "draft":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
      case "expired":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      default:
        return "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300";
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen p-4 rounded">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              PI Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-300">
              {pi?.piNumber}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePdfAction("view")}
              disabled={!pi || downloading}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-300 dark:border-gray-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Eye size={16} /> {downloading ? "Loading..." : "View PDF"}
            </button>
            <button
              onClick={() => handlePdfAction("download")}
              disabled={!pi || downloading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Download size={16} />{" "}
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={() => navigate("/proforma-invoice")}
              className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-300">
            Loading...
          </div>
        )}

        {!loading && pi && (
          <>
            {/* PI INFO */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">
                PI Information
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    PI Number
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {pi.piNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Status
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded ${getStatusColor(
                      pi.status
                    )}`}
                  >
                    {pi.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Validity Date
                  </p>
                  <p>{formatDate(pi.validityDate)}</p>
                </div>
              </div>
            </div>

            {/* CLIENT DETAILS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">
                Client Details
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Name
                  </p>
                  <p className="text-gray-800 dark:text-gray-100">
                    {pi.client_id?.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Client Code
                  </p>
                  <p className="text-gray-800 dark:text-gray-100">
                    {pi.client_id?.clientCode}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Country
                  </p>
                  <p className="text-gray-800 dark:text-gray-100">
                    {pi.client_id?.country}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Contact
                  </p>
                  <p className="text-gray-800 dark:text-gray-100">
                    {pi.client_id?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* VEHICLE DETAILS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">
                Vehicle Details
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-gray-700 text-xs uppercase text-slate-500 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Model</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-center">Unit Price</th>
                      <th className="px-4 py-2 text-center">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pi.vehicleDetails?.map((v: any, i: number) => (
                      <tr
                        key={i}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                          {v.model}
                        </td>
                        <td className="px-4 py-2 text-center">{v.quantity}</td>
                        <td className="px-4 py-2 text-center">
                          ${v.unitPrice}
                        </td>
                        <td className="px-4 py-2 text-center font-medium">
                          ${v.quantity * v.unitPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">
                Summary
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Total Amount
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    $
                    {pi.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Created At
                  </p>
                  <p className="text-gray-800 dark:text-gray-100">
                    {formatDate(pi.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PIDetails;
