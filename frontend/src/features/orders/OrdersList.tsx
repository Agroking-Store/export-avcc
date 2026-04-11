import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, FilePenLine, Search, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Order {
  _id: string;
  orderId: string;
  clientName?: string;
  companyName?: string;
  clientId?: string;
  clientCountry?: string;
  vehicles?: any[];
  status?: string;
  date?: string;
  createdAt?: string;
}

const OrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/v1/orders", {
        params: {
          search,
          status: statusFilter === "All" ? undefined : statusFilter,
          page: currentPage,
          limit,
        },
      });
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    if (location.state?.success) {
      toast.success(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* MAIN CARD CONTAINER */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        
        {/* TOP SECTION: TITLE */}
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Orders</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage all your export orders</p>
          </div>
          
          <button
            onClick={() => navigate("/orders/add")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:from-[#4a56ff] hover:to-[#2a37ff] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Create New Order
          </button>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        {/* TOOLBAR: FILTERS & SEARCH */}
        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 text-slate-400">
              <Filter size={18} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 outline-none w-32 focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search order ID or client name..."
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
                {["Order ID", "Client Name", "No. of Vehicles", "Status", "Date", "Actions"].map((head) => (
                  <th key={head} className="px-8 py-4 text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400 italic">No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/30 dark:hover:bg-gray-800/30 transition-colors">
                    
                    <td className="px-8 py-5 text-center">
                      <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        {order.orderId}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">{order.clientName}</div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">{order.companyName || order.clientCountry}</div>
                    </td>

                    <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-gray-300">
                      {order.vehicles ? order.vehicles.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0) : 0}
                    </td>

                    <td className="px-8 py-5 text-center">
                      <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#64748b] dark:text-slate-400 px-3 py-1 rounded text-xs font-medium">
                        {order.status || "Draft"}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-sm text-slate-600 dark:text-gray-300">
                      {order.date ? new Date(order.date).toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-")}
                    </td>

                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => navigate(`/orders/edit/${order._id}`)}
                          className="p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm active:scale-95"
                          title="Edit Order"
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

        {/* BOTTOM SECTION: PAGINATION */}
        <div className="px-8 py-5 flex justify-between items-center bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Page <span className="text-[#0f172a] dark:text-white">{currentPage}</span> of {totalPages}
          </span>

          <div className="flex gap-6">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-sm font-bold text-[#0f172a] hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersList;