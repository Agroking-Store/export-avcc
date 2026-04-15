import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Eye, FilePenLine } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClientsList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/v1/clients", {
        params: { search, page: currentPage, limit },
      });
      setClients(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, currentPage]);

  useEffect(() => {
    if (location.state?.success) {
      toast.success(location.state.success);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        
        {/* TOP SECTION: TITLE & ADD BUTTON */}
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Clients</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage all your export clients</p>
          </div>
          
          <button
            onClick={() => navigate("/clients/add")}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Add Client
          </button>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        {/* TOOLBAR: FILTERS & SEARCH */}
        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
              <Filter size={16} className="text-blue-500" />
              Filter: All Clients
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search client..."
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
                {["Client ID", "Name", "Country", "Contact", "Orders", "Last Order", "Actions"].map((head) => (
                  <th key={head} className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {clients.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400 italic">No clients found</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40">
                    <td className="px-8 py-5 text-center">
                      <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                        {client.clientCode || `CL-${client._id.slice(-3).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">{client.name}</div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">{client.companyName || "-"}</div>
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">{client.country}</td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">{client.phone}</td>
                    <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600 dark:text-gray-300">{client.totalOrders || 0}</td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {client.lastTransaction ? new Date(client.lastTransaction).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() => navigate(`/clients/${client._id}`)}
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/clients/edit/${client._id}`)}
                          className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="Edit Client"
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
            Page <span className="text-[#0f172a] dark:text-white">{currentPage}</span> of {totalPages}
          </span>

          <div className="flex gap-6">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="cursor-pointer flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="cursor-pointer flex items-center gap-1 text-sm font-bold text-[#0f172a] hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientsList;