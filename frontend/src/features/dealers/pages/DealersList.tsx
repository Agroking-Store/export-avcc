import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  FilePenLine,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

const DealersList = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/dealers`, {
        params: { search, page: currentPage, limit },
      });
      setDealers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch dealers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [search, currentPage]);

  useEffect(() => {
    if (location.state?.success) {
      toast.success(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
      {/* TOP SECTION: TITLE & ADD BUTTON */}
      <div className="px-8 py-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
            Dealers
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage all your dealers
          </p>
        </div>

        <button
          onClick={() => navigate("/dealers/add")}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Add Dealer
        </button>
      </div>

      <hr className="border-slate-100 dark:border-gray-800" />

      {/* TOOLBAR: FILTERS & SEARCH */}
      <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
            <Filter size={16} className="text-blue-500" />
            Filter: All Dealers
          </button>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search dealer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-y border-slate-100 dark:border-gray-800">
            <tr>
              {["Dealer ID", "Name", "Contact", "Email", "Actions"].map(
                (head) => (
                  <th
                    key={head}
                    className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {dealers.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-20 text-slate-400 italic"
                >
                  No dealers found
                </td>
              </tr>
            ) : (
              dealers.map((dealer) => (
                <tr
                  key={dealer._id}
                  className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                >
                  <td className="px-8 py-5 text-center">
                    <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                      {dealer.dealerId || dealer._id.slice(-4)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                      {dealer.name}
                    </div>

                    <div className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                      {dealer.representativeName || "-"}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                    {dealer.contact}
                  </td>
                  <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                    {dealer.email || "-"}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => navigate(`/dealers/${dealer._id}`)}
                        className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/dealers/edit/${dealer._id}`)}
                        className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                        title="Edit Dealer"
                      >
                        <FilePenLine size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION SECTION */}
      <div className="px-8 py-5 flex justify-between items-center bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
        <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
          Page{" "}
          <span className="text-[#0f172a] dark:text-white">{currentPage}</span>{" "}
          of {totalPages}
        </span>

        <div className="flex gap-6">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 hover:-translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer flex items-center gap-1 text-sm font-bold text-[#0f172a] hover:text-blue-600 hover:translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealersList;
