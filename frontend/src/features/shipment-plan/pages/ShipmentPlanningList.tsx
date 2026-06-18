import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, FilePenLine, Filter, Plus, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDate, ShippingDetail } from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";
import { useAuth } from "../../../hooks/useAuth";

const ShipmentPlanningList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isClient } = useAuth();
  const [shippingDetails, setShippingDetails] = useState<ShippingDetail[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const lastToastMessage = useRef<string | null>(null);

  const limit = 5;

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const result = await shipmentApi.list({
        search,
        page: currentPage,
        limit,
      });
      setShippingDetails(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [search, currentPage]);

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
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              Shipping Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Manage line, vessel and sailing schedule information
            </p>
          </div>

          {!isClient && (
            <button
              onClick={() => navigate("/shipment-planning/add")}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Add Details
            </button>
          )}
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
            <Filter size={16} className="text-blue-500" />
            Filter: All Shipments
          </button>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search shipment..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-y border-slate-100 dark:border-gray-800">
              <tr>
                {["Shipping Line", "Vessel Name", "Sailing Date", "Arrival Date", "Vehicles", "Actions"].map((head) => (
                  <th key={head} className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400 italic">
                    Loading shipping details...
                  </td>
                </tr>
              ) : shippingDetails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400 italic">
                    No shipping details found
                  </td>
                </tr>
              ) : (
                shippingDetails.map((detail) => (
                  <tr
                    key={detail._id}
                    className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-8 py-5 text-center">
                      <span className="bg-[#f1f5f9] dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                        {detail.shippingLine || "-"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                        {detail.vesselName || "-"}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">
                        {detail._id.slice(-6).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {formatDate(detail.sailingDate)}
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {formatDate(detail.arrivalDate)}
                    </td>
<td className="px-8 py-5 text-center">
                      {detail.vehicleBookingIds?.length ?? 0}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/shipment-planning/view/${detail._id}`)}
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/shipment-planning/edit/${detail._id}`)}
                          className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Edit Details"
                          disabled={isClient}
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
            Page <span className="text-[#0f172a] dark:text-white">{currentPage}</span> of {totalPages}
          </span>

          <div className="flex gap-6">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 hover:-translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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

export default ShipmentPlanningList;
