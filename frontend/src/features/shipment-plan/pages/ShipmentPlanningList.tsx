import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Filter, Plus, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDate, getShippingDetails, ShippingDetail } from "./shipmentData";

const ShipmentPlanningList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shippingDetails] = useState<ShippingDetail[]>(() => getShippingDetails());
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 5;

  useEffect(() => {
    if (location.state?.success) {
      toast.success(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const filteredDetails = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return shippingDetails;

    return shippingDetails.filter((detail) =>
      [
        detail.shippingLine,
        detail.vesselName,
        detail.sailingDate,
        detail.arrivalDate,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, shippingDetails]);

  const totalPages = Math.max(1, Math.ceil(filteredDetails.length / limit));
  const visibleDetails = filteredDetails.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

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

          <button
            onClick={() => navigate("/shipment-planning/add")}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Add Details
          </button>
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
                {["Shipping Line", "Vessel Name", "Sailing Date", "Arrival Date", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {visibleDetails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-slate-400 italic">
                    No shipping details found
                  </td>
                </tr>
              ) : (
                visibleDetails.map((detail) => (
                  <tr
                    key={detail.id}
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
                        {detail.id}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {formatDate(detail.sailingDate)}
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {formatDate(detail.arrivalDate)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => navigate(`/shipment-planning/view/${detail.id}`)}
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
