import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  Filter,
  Trash2,
  X,
  Layers,
} from "lucide-react";
import { toast } from "react-toastify";
import { VehicleListItem, vehicleManagementApi } from "../vehicleManagementApi";
import { useAuth } from "../../../hooks/useAuth";
import { useAppSelector } from "@/app/hooks";
import api from "../../../services/api";

/* ─── Types for Hierarchy ─── */
interface Brand {
  _id: string;
  name: string;
}
interface Model {
  _id: string;
  name: string;
  brandId: string;
}
interface Variant {
  _id: string;
  name: string;
  modelId: string;
}

type ModalType = "brand" | "model" | "variant" | "color" | null;

const VehicleList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam } = useAuth();
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role?.toLowerCase();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const lastToastMessage = useRef<string | null>(null);
  const limit = 10;

  /* ─── Modal & Hierarchy State ─── */
  const [modalType, setModalType] = useState<ModalType>(null);
  const [newItemName, setNewItemName] = useState("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [savingModal, setSavingModal] = useState(false);

  /* ─── Data Fetchers ─── */
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleManagementApi.getVehicleList({
        search,
        status: statusFilter === "All" ? undefined : statusFilter,
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

  const fetchBrands = async () => {
    try {
      const res = await api.get("/vehicles/brands");
      setBrands(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModels = async (brandId: string) => {
    if (!brandId) return setModels([]);
    try {
      const res = await api.get(`/vehicles/models?brandId=${brandId}`);
      setModels(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVariants = async (modelId: string) => {
    if (!modelId) return setVariants([]);
    try {
      const res = await api.get(`/vehicles/variants?modelId=${modelId}`);
      setVariants(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

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

  useEffect(() => {
    fetchBrands();
  }, []);

  /* ─── Modal Handlers ─── */
  const openModal = (type: ModalType) => {
    setModalType(type);
    setNewItemName("");
    setSelectedBrandId("");
    setSelectedModelId("");
    setSelectedVariantId("");
    setModels([]);
    setVariants([]);
  };

  const closeModal = () => {
    setModalType(null);
    setNewItemName("");
  };

  const handleModalSave = async () => {
    if (!newItemName.trim()) {
      return toast.error("Name is required");
    }
    setSavingModal(true);
    try {
      if (modalType === "brand") {
        await api.post("/vehicles/brands", { name: newItemName.trim() });
        toast.success("Brand added");
      } else if (modalType === "model") {
        if (!selectedBrandId) return toast.error("Please select a brand");
        await api.post("/vehicles/models", {
          name: newItemName.trim(),
          brandId: selectedBrandId,
        });
        toast.success("Model added");
      } else if (modalType === "variant") {
        if (!selectedModelId) return toast.error("Please select a model");
        await api.post("/vehicles/variants", {
          name: newItemName.trim(),
          modelId: selectedModelId,
        });
        toast.success("Variant added");
      } else if (modalType === "color") {
        if (!selectedVariantId) return toast.error("Please select a variant");
        await api.post("/vehicles/colors", {
          name: newItemName.trim(),
          variantId: selectedVariantId,
        });
        toast.success("Color added");
      }
      closeModal();
      fetchBrands(); // refresh hierarchy
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add");
    } finally {
      setSavingModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this vehicle? This action cannot be undone.",
      )
    )
      return;
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
      {/* ─── Modal ─── */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Layers size={20} className="text-indigo-500" />
              Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h3>

            <div className="space-y-3">
              {modalType === "model" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Select Brand
                  </label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      setSelectedBrandId(e.target.value);
                      fetchModels(e.target.value);
                      setSelectedModelId("");
                      setSelectedVariantId("");
                    }}
                    className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === "variant" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Select Brand
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => {
                        setSelectedBrandId(e.target.value);
                        fetchModels(e.target.value);
                        setSelectedModelId("");
                      }}
                      className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Select Model
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => {
                        setSelectedModelId(e.target.value);
                        fetchVariants(e.target.value);
                      }}
                      className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Select Model --</option>
                      {models.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {modalType === "color" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Select Brand
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => {
                        setSelectedBrandId(e.target.value);
                        fetchModels(e.target.value);
                        setSelectedModelId("");
                      }}
                      className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Select Model
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => {
                        setSelectedModelId(e.target.value);
                        fetchVariants(e.target.value);
                      }}
                      className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Select Model --</option>
                      {models.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Select Variant
                    </label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Select Variant --</option>
                      {variants.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {modalType} Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${modalType} name`}
                  className="w-full border border-slate-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={savingModal}
                className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {savingModal ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              Vehicle Database
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Maintain a dedicated vehicle database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold text-sm">
              {totalVehicles} Vehicles
            </span>

            {/* Hierarchy Buttons */}
            {role === "admin" && (
              <>
                <button
                  onClick={() => openModal("brand")}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  <Plus size={16} /> Brand
                </button>
                <button
                  onClick={() => openModal("model")}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  <Plus size={16} /> Model
                </button>
                <button
                  onClick={() => openModal("variant")}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  <Plus size={16} /> Variant
                </button>
                <button
                  onClick={() => openModal("color")}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-50 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  <Plus size={16} /> Colour
                </button>
              </>
            )}

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
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
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
                {[
                  "Brand Name",
                  "Model Name",
                  "Variant",
                  "Color",
                  "Status",
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
                    colSpan={6}
                    className="text-center py-20 text-slate-400 italic"
                  >
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          vehicle.status === "Available"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {vehicle.status}
                      </span>
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
