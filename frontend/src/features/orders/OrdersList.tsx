import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, FilePenLine, Search, Filter, Plus, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

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

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const limit = 5;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/orders`, {
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

  const getAllowedNextStatus = (currentStatus?: string) => {
    const currentIndex = orderStatuses.indexOf(currentStatus || "Sourced");
  
    if (currentIndex === -1) return orderStatuses[0];
  
    return orderStatuses[currentIndex + 1] || currentStatus;
  };
  
  const updateStatus = async () => {
    if (!selectedOrder) return;
  
    try {
      await axios.patch(
        `${API_URL}/api/v1/orders/${selectedOrder._id}/status`,
        { status: newStatus }
      );
  
      toast.success("Status updated successfully");
      setShowStatusModal(false);
      fetchOrders();
  
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

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
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:from-[#4a56ff] hover:to-[#2a37ff] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Create New Order
          </button>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        {/* TOOLBAR: FILTERS & SEARCH */}
        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            {/* STYLIZED WHITE FILTER BUTTON */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
                <Filter size={16} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-11 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-blue-600 text-sm font-bold rounded-2xl outline-none transition-all hover:bg-slate-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <option value="All">All Orders</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="PI Generated">PI Generated</option>
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {order.status || "To be Sourced"}
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
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => navigate(`/orders/edit/${order._id}`)}
                          className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="Edit Order"
                        >
                          <FilePenLine size={18} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status || "");
                            setShowStatusModal(true);
                          }}
                          className="cursor-pointer p-2.5 text-emerald-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="Change Status"
                        >
                          <Zap size={18} />
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
            {showStatusModal && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-[420px] p-6 shadow-2xl animate-in zoom-in-95">
      
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Change Order Status
          </h3>
      
          <p className="text-sm text-slate-500 mb-4">
            Do you want to change status for{" "}
            <span className="font-bold text-blue-600">
              {selectedOrder?.orderId}
            </span> ?
          </p>
      
    <div className="relative mb-6 group">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">
        Select New Status
      </label>
      
      <div className="relative">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="cursor-pointer appearance-none w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 shadow-sm"
          >
            {orderStatuses.map((status, index) => {
              const currentIndex = orderStatuses.indexOf(selectedOrder?.status || "Sourced");
              const isNext = index === currentIndex + 1;
              const isCurrent = index === currentIndex;
      
              return (
                <option
                  key={status}
                  value={status}
                  disabled={!isNext && !isCurrent}
                  className="py-2 font-semibold"
                >
                  {isCurrent ? "📍 " : ""}
                  {status}
                  {isNext && newStatus !== status
                    ? " — (Recommended Next Step)"
                    : ""}
                </option>
              );
            })}
          </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-slate-100 shadow-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="transition-transform group-focus-within:rotate-180">
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            
            <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Only the current stage and the immediate next step can be selected.
            </p>
          </div>
      
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="cursor-pointer px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
      
            <button
              onClick={updateStatus}
              className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-95 shadow-md transition-all"
            >
              Update
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default OrdersList;