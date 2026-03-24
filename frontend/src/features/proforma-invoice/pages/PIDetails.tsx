import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";

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
      console.error("Error fetching PI", err);
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
        return "bg-green-100 text-green-700";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            PI Details
          </h2>
          <p className="text-sm text-slate-500">
            {pi?.piNumber}
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice")}
          className="text-gray-500 hover:text-black"
        >
          ← Back to PIs
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          Loading...
        </div>
      )}

      {!loading && pi && (
        <>
          {/* PI INFO */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">PI Information</h3>

            <div className="grid md:grid-cols-3 gap-4">

              <div>
                <p className="text-sm text-gray-500">PI Number</p>
                <p className="font-medium">{pi.piNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(pi.status)}`}>
                  {pi.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Validity Date</p>
                <p>{formatDate(pi.validityDate)}</p>
              </div>

            </div>
          </div>

          {/* CLIENT DETAILS */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Client Details</h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p>{pi.client_id?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Client Code</p>
                <p>{pi.client_id?.clientCode}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p>{pi.client_id?.country}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p>{pi.client_id?.phone}</p>
              </div>

            </div>
          </div>

          {/* VEHICLE DETAILS */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Vehicle Details</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Model</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-center">Unit Price</th>
                    <th className="px-4 py-2 text-center">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {pi.vehicleDetails?.map((v: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{v.model}</td>
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
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Summary</h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold">
                  ${pi.totalAmount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p>{formatDate(pi.createdAt)}</p>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PIDetails;