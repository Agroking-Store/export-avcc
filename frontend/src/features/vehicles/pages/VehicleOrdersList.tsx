import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Eye,
  FilePenLine,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  VehicleOrderItem,
  vehicleManagementApi,
} from "../vehicleManagementApi";

const statuses = ["All", "Pending", "Confirmed", "Completed"];

const getStatusStyle = (status: VehicleOrderItem["status"]) => {
  switch (status) {
    case "Confirmed":
      return "bg-blue-100 text-blue-700";
    case "Completed":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<VehicleOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const lastToastMessage = useRef<string | null>(null);

  const limit = 5;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await vehicleManagementApi.getVehicleOrders({
        search,
        status,
        page: currentPage,
        limit,
      });

      setOrders(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  useEffect(() => {
    if (location.state?.success) {
      const message = location.state.success as string;
      if (lastToastMessage.current !== message) {
        lastToastMessage.current = message;
        toast.success(message);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              Required Vehicles
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Create and track required vehicles from your dedicated vehicle
              list
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold text-sm">
              {orders.length} Orders
            </span>
            <button
              onClick={() => navigate("/vehicles/orders/add")}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Add Required Vehicle
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
                <Filter size={16} />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="cursor-pointer appearance-none pl-11 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-blue-600 text-sm font-bold rounded-2xl outline-none transition-all hover:bg-slate-50 dark:hover:bg-gray-800"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Statuses" : item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-y border-slate-100 dark:border-gray-800">
              <tr>
                {["Vehicle", "Quantity", "Status", "Actions"].map((head) => (
                  <th
                    key={head}
                    className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider"
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
                    colSpan={4}
                    className="text-center py-20 text-slate-400 italic"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-20 text-slate-400 italic"
                  >
                    No required vehicles found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                  >
                    {/* <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                        {order.vehicleSnapshot.brandName}{" "}
                        {order.vehicleSnapshot.modelName}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">
                        {order.vehicleSnapshot.variant} - {order.vehicleSnapshot.color}
                      </div>
                    </td> */}

                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                        {order.vehicleSnapshot?.brandName || "Unknown"}{" "}
                        {order.vehicleSnapshot?.modelName || "Model"}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">
                        {order.vehicleSnapshot?.variant || "N/A"} -{" "}
                        {order.vehicleSnapshot?.color || "N/A"}
                      </div>
                    </td>

                    <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600 dark:text-gray-300">
                      {order.quantity}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() =>
                            navigate(`/vehicles/orders/${order._id}`)
                          }
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="View Order"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/vehicles/orders/edit/${order._id}`)
                          }
                          className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
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
      </div>
    </div>
  );
};

export default VehicleOrdersList;
