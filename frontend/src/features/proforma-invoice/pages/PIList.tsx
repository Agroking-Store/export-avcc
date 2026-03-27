import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { Eye, Pencil, Trash2, Search, Filter, FilePlus } from "lucide-react";
import { useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const PIList = () => {
  const navigate = useNavigate();

  const [pis, setPis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();

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

  useEffect(() => {
    if (location.state?.success) {
      toast.success(location.state.success);
  
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200";
      case "pending_approval":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200";
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200";
      case "sent_to_buyer":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200";
      case "lc_received":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200";
      case "expired":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PI?")) return;
  
    try {
      await axios.delete(
        `${apiConfig.baseURL}/proforma-invoices/${id}`
      );
  
      toast.success("PI deleted successfully 🗑️"); 
  
      fetchPIs();
    } catch {
      toast.error("Delete failed ❌"); 
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
            Proforma Invoices
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">

        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 flex justify-between items-center">
          
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-300">
            <Filter size={16} />
            Filter: All PIs
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Search PI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-md 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600
           placeholder-gray-400 dark:placeholder-gray-300
           focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-200 text-xs uppercase">
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
                  <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-300">
                    No PIs found
                  </td>
                </tr>
              ) : (
                pis.map((pi) => (
                 <tr key={pi._id} className="border-t border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">

                    <td className="px-6 py-4 text-gray-800 dark:text-gray-100">
                      {pi.piNumber}
                    </td>

                    <td className="px-6 py-4">
                      {pi.client_id?.name}
                      <div className="text-xs text-gray-500 dark:text-gray-300">
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

                    <td className="px-6 py-4 text-center text-gray-800 dark:text-gray-100">
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
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/proforma-invoice/edit/${pi._id}`)
                          }
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(pi._id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
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
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded 
           bg-white dark:bg-gray-700 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600"
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded 
           bg-white dark:bg-gray-700 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default PIList;