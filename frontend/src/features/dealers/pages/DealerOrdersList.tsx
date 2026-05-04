import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Search,
  Filter,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

interface Order {
  _id: string;
  orderId: string;
  clientName?: string;
  companyName?: string;
  clientId?: string;
  clientCountry?: string;
  vehicles?: any[];
  grandTotal?: number;
  status?: string;
  date?: string;
  createdAt?: string;
  dealerName?: string;
}

const DealerOrdersList = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders`, {
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
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, currentPage]);

  const orderStatuses = [
    "Sourced",
    "Booked",
    "VIN Received",
    "PI Issued",
    "LC Received",
    "BV Received",
    "HBL Received",
    "Bank Submission Done",
    "Shipped",
  ];

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "Sourced":
        return "bg-slate-100 text-slate-700";

      case "Booked":
        return "bg-blue-100 text-blue-700";

      case "VIN Received":
        return "bg-violet-100 text-violet-700";

      case "PI Issued":
        return "bg-cyan-100 text-cyan-700";

      case "LC Received":
        return "bg-amber-100 text-amber-700";

      case "BV Received":
        return "bg-pink-100 text-pink-700";

      case "HBL Received":
        return "bg-purple-100 text-purple-700";

      case "Bank Submission Done":
        return "bg-emerald-100 text-emerald-700";

      case "Shipped":
        return "bg-indigo-100 text-indigo-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
      {/* TOP SECTION */}
      <div className="px-8 py-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
            Dealer Orders
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Manage and track all vehicle export orders
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold">
            {orders.length} Orders
          </span>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-gray-800" />

      {/* TOOLBAR */}
      <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
              <Filter size={16} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer appearance-none pl-11 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-blue-600 text-sm font-bold rounded-2xl outline-none transition-all hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              <option value="All">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search order ID or client..."
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
              {[
                "Order ID",
                "Client",
                "Vehicles",
                "Status",
                "Date",
                "Actions",
              ].map((head, idx) => (
                <th
                  key={head}
                  className={`px-8 py-4 text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider ${
                    idx === 5 ? "text-right" : "text-center"
                  }`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-20 text-slate-400 italic"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading orders...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-20 text-slate-400 italic"
                >
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order._id}
                  className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                >
                  <td className="px-8 py-5 text-center">
                    <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                      {order.orderId}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                      {order.clientName || "N/A"}
                    </div>
                    {(order.companyName || order.clientCountry) && (
                      <div className="text-xs text-slate-400 dark:text-gray-500">
                        {[order.companyName, order.clientCountry]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                        <Car size={14} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-gray-200">
                        {order.vehicles
                          ?.filter(Boolean)
                          .reduce((sum, v) => sum + (v?.quantity ?? 0), 0) ||
                          order.vehicles?.length ||
                          0}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusStyle(
                        order.status,
                      )}`}
                    >
                      {order.status || "To be Sourced"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-medium text-slate-500 dark:text-gray-400">
                    {order.date
                      ? new Date(order.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "-"}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => navigate(`/dealers/orders/${order._id}`)}
                      className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="px-8 py-5 flex justify-between items-center bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Page{" "}
            <span className="text-[#0f172a] dark:text-white">
              {currentPage}
            </span>{" "}
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
      )}
    </div>
  );
};

export default DealerOrdersList;
