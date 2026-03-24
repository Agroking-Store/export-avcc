import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { Eye, Pencil, Trash2, Search, Filter, FilePlus } from "lucide-react";

const PIList = () => {
  const navigate = useNavigate();

  const [pis, setPis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const fetchPIs = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices`,
        {
          params: {
            search,
            page: currentPage,
            limit,
          },
        }
      );

      setPis(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPIs();
  }, [search, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "sent_to_buyer":
        return "bg-blue-100 text-blue-700";
      case "lc_received":
        return "bg-purple-100 text-purple-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PI?")) return;

    try {
      await axios.delete(
        `${apiConfig.baseURL}/proforma-invoices/${id}`
      );
      fetchPIs();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Proforma Invoices
          </h2>
          <p className="text-sm text-slate-500">
            Manage all proforma invoices
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <FilePlus size={18} />
          Create PI
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter size={16} />
            Filter: All PIs
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search PI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">PI No</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-center">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Date</th>
                <th className="px-4 py-3 text-center w-[120px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {pis.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No PIs found
                  </td>
                </tr>
              ) : (
                pis.map((pi) => (
                  <tr key={pi._id} className="border-t hover:bg-slate-50">

                    <td className="px-6 py-4 font-medium">
                      {pi.piNumber}
                    </td>

                    <td className="px-6 py-4">
                      {pi.client_id?.name}
                      <div className="text-xs text-gray-500">
                        {pi.client_id?.clientCode}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">
                      ${pi.totalAmount}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${getStatusColor(pi.status)}`}
                      >
                        {pi.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {pi.validityDate
                        ? new Date(pi.validityDate).toISOString().split("T")[0]
                        : "-"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-4 text-center w-[120px]">
                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() =>
                            navigate(`/proforma-invoice/${pi._id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/proforma-invoice/edit/${pi._id}`)
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(pi._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PIList;