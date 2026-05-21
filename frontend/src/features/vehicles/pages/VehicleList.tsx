import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { VehicleListItem, vehicleManagementApi } from "../vehicleManagementApi";

import { useAuth } from "../../../hooks/useAuth";
import { useAppSelector } from "@/app/hooks";

const VehicleList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam } = useAuth();
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role?.toLowerCase();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalVehicles, setTotalVehicles] = useState(0);

  const lastToastMessage = useRef<string | null>(null);

  const limit = 10;

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleManagementApi.getVehicleList({
        search,
        page: currentPage,
        limit,
      });
      setVehicles(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalVehicles(res.totalCount || res.total || 0);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vehicle? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await vehicleManagementApi.deleteVehicleListItem(id);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    }
  };
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              Vehicle Database
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Maintain a dedicated vehicle database
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold text-sm">
              {totalVehicles} Vehicles
            </span>
            {role === "admin" && (
              <button
                onClick={() => navigate("/vehicles/add")}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                Add Vehicle
              </button>
            )}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
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
                {[
                  "Brand Name",
                  "Model Name",
                  "Variant",
                  "Color",
                  "Actions",
                ].map((head) => (
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
                    colSpan={5}
                    className="text-center py-20 text-slate-400 italic"
                  >
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-20 text-slate-400 italic"
                  >
                    No vehicles found
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                        {vehicle.brandName}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                        {vehicle.modelName}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {vehicle.variant}
                    </td>
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {vehicle.color}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() =>
                            navigate(`/vehicles/list/${vehicle._id}`)
                          }
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          title="View Vehicle"
                        >
                          <Eye size={18} />
                        </button>
                        {!isSourcingTeam && (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/vehicles/edit/${vehicle._id}`)
                              }
                              className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                              title="Edit Vehicle"
                            >
                              <FilePenLine size={18} />
                            </button>

                            <button
                              onClick={() => handleDelete(vehicle._id)}
                              className="cursor-pointer p-2.5 text-red-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-red-700 hover:border-red-300 hover:bg-red-50 hover:scale-110 transition-all duration-200"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
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

export default VehicleList;
