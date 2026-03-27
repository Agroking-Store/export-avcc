import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import toast, { Toaster } from "react-hot-toast";

const PIDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
      <Toaster position="top-right" />
  
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

        <button
          onClick={() => navigate("/proforma-invoice")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to PIs
        </button>
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
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">PI Information</h3>

            <div className="grid md:grid-cols-3 gap-4">

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">PI Number</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{pi.piNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Status</p>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(pi.status)}`}>
                  {pi.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Validity Date</p>
                <p>{formatDate(pi.validityDate)}</p>
              </div>

            </div>
          </div>

          {/* CLIENT DETAILS */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Client Details</h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Name</p>
                <p className="text-gray-800 dark:text-gray-100">{pi.client_id?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Client Code</p>
                <p className="text-gray-800 dark:text-gray-100">{pi.client_id?.clientCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Country</p>
                <p className="text-gray-800 dark:text-gray-100">{pi.client_id?.country}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Contact</p>
                <p className="text-gray-800 dark:text-gray-100">{pi.client_id?.phone}</p>
              </div>

            </div>
          </div>

          {/* VEHICLE DETAILS */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Vehicle Details</h3>

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
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{v.model}</td>
                      <td className="px-4 py-2 text-center">{v.quantity}</td>
                      <td className="px-4 py-2 text-center">${v.unitPrice}</td>
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
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Summary</h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  ${pi.totalAmount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">Created At</p>
                <p className="text-gray-800 dark:text-gray-100">{formatDate(pi.createdAt)}</p>
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