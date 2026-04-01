import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Search, Filter, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
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

      const res = await axios.get(
        "http://localhost:5000/api/v1/orders",
        {
          params: {
            search,
            status: statusFilter === "All" ? undefined : statusFilter,
            page: currentPage,
            limit,
          },
        }
      );

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
  
      // clear state so it doesn't repeat on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "PI Generated": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 bg-gray-100 dark:bg-gray-900 min-h-screen p-2 rounded-xl">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Orders
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
            Manage all your export orders
          </p>
        </div>

        <button
          onClick={() => navigate("/orders/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create New Order
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-300">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >

              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>

            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Search order ID or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-200 text-xs uppercase">
              <tr>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">ORDER ID</th>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">Client Name</th>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">No. of Vehicles</th>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">Status</th>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">Date</th>
                <th className="border border-slate-200 dark:border-gray-700 px-6 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-300">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium">
                        {order.orderId}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-gray-800 dark:text-white">
                        {order.clientName}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        {order.companyName || order.clientCountry}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {order.vehicles
                        ? order.vehicles.reduce((sum, v) => sum + v.quantity, 0)
                        : 0}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status || "")}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {order.date
                        ? new Date(order.date).toLocaleDateString()
                        : order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/orders/edit/${order._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        >
                          <Pencil size={18} />
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
              className="px-3 py-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600"
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;

