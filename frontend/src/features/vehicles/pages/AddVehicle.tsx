import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Car,
  DollarSign,
  Hash,
  Palette,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { vehicleManagementApi } from "../vehicleManagementApi";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/api";

/* ─── Hierarchy Types ─── */
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
interface Color {
  _id: string;
  name: string;
  variantId: string;
}

interface VehicleForm {
  brandId: string;
  modelId: string;
  variantId: string;
  colorId: string;
  commercialHsnCode: string;
  exportHsnCode: string;
  fobAmount: string;
  freight: string;
  igstRate: "5" | "18" | "40";
}

const emptyVehicle = (): VehicleForm => ({
  brandId: "",
  modelId: "",
  variantId: "",
  colorId: "",
  commercialHsnCode: "",
  exportHsnCode: "",
  fobAmount: "",
  freight: "",
  igstRate: "18",
});

const AddVehicle = () => {
  const navigate = useNavigate();
  const { isSourcingTeam } = useAuth();
  const [loading, setLoading] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleForm[]>([emptyVehicle()]);

  /* ─── Hierarchy Data ─── */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modelsMap, setModelsMap] = useState<Record<string, Model[]>>({});
  const [variantsMap, setVariantsMap] = useState<Record<string, Variant[]>>({});
  const [colorsMap, setColorsMap] = useState<Record<string, Color[]>>({});

  useEffect(() => {
    if (isSourcingTeam) return;
    fetchBrands();
  }, [isSourcingTeam]);

  const fetchBrands = async () => {
    try {
      const res = await api.get("/vehicles/brands");
      setBrands(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModels = async (brandId: string) => {
    if (modelsMap[brandId]) return; // already fetched
    try {
      const res = await api.get(`/vehicles/models?brandId=${brandId}`);
      setModelsMap((prev) => ({ ...prev, [brandId]: res.data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVariants = async (modelId: string) => {
    if (variantsMap[modelId]) return;
    try {
      const res = await api.get(`/vehicles/variants?modelId=${modelId}`);
      setVariantsMap((prev) => ({ ...prev, [modelId]: res.data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchColors = async (variantId: string) => {
    if (colorsMap[variantId]) return;
    try {
      const res = await api.get(`/vehicles/colors?variantId=${variantId}`);
      setColorsMap((prev) => ({ ...prev, [variantId]: res.data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  if (isSourcingTeam) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        You are not authorized to add vehicles.
      </div>
    );
  }

  const handleChange = (
    index: number,
    field: keyof VehicleForm,
    value: string,
  ) => {
    setVehicles((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const updated = { ...v, [field]: value };

        // Reset child dropdowns on parent change
        if (field === "brandId") {
          updated.modelId = "";
          updated.variantId = "";
          updated.colorId = "";
          if (value) fetchModels(value);
        }
        if (field === "modelId") {
          updated.variantId = "";
          updated.colorId = "";
          if (value) fetchVariants(value);
        }
        if (field === "variantId") {
          updated.colorId = "";
          if (value) fetchColors(value);
        }

        return updated;
      }),
    );
  };

  const handleNumberChange = (
    index: number,
    field: keyof VehicleForm,
    value: string,
  ) => {
    const num = parseFloat(value);
    if (value === "" || num >= 0) {
      handleChange(index, field, value);
    }
  };

  const addVehicle = () => setVehicles((prev) => [...prev, emptyVehicle()]);

  const removeVehicle = (index: number) => {
    if (vehicles.length <= 1) {
      toast.error("At least one vehicle entry is required");
      return;
    }
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (
        !v.brandId ||
        !v.modelId ||
        !v.variantId ||
        !v.colorId ||
        !v.commercialHsnCode.trim() ||
        !v.exportHsnCode.trim()
      ) {
        toast.error(`All vehicle fields are required for entry ${i + 1}`);
        return false;
      }
      const fob = parseFloat(v.fobAmount);
      if (v.fobAmount !== "" && (isNaN(fob) || fob < 0)) {
        toast.error(`FOB Amount cannot be negative for entry ${i + 1}`);
        return false;
      }
      const freight = parseFloat(v.freight);
      if (v.freight !== "" && (isNaN(freight) || freight < 0)) {
        toast.error(`Freight cannot be negative for entry ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = vehicles.map((v) => {
        const brand = brands.find((b) => b._id === v.brandId);
        const model = (modelsMap[v.brandId] || []).find(
          (m) => m._id === v.modelId,
        );
        const variant = (variantsMap[v.modelId] || []).find(
          (va) => va._id === v.variantId,
        );
        const color = (colorsMap[v.variantId] || []).find(
          (c) => c._id === v.colorId,
        );

        return {
          brandName: brand?.name || "",
          modelName: model?.name || "",
          variant: variant?.name || "",
          color: color?.name || "",
          commercialHsnCode: v.commercialHsnCode.trim(),
          exportHsnCode: v.exportHsnCode.trim(),
          fobAmount: v.fobAmount !== "" ? parseFloat(v.fobAmount) : 0,
          freight: v.freight !== "" ? parseFloat(v.freight) : 0,
          igstRate: Number(v.igstRate),
        };
      });

      await vehicleManagementApi.createVehiclesBulk(payload);

      navigate("/vehicles/list", {
        state: { success: `${vehicles.length} vehicle(s) added successfully` },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add vehicles");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const selectStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Vehicle
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create one or more dedicated vehicle list items
          </p>
        </div>

        <button
          onClick={() => navigate("/vehicles/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Vehicle List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {vehicles.map((vehicle, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 space-y-6"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  Vehicle Entry {index + 1}
                </h2>
              </div>
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVehicle(index)}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  Vehicle Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    <Car size={14} className="text-indigo-500" /> Brand Name{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={vehicle.brandId}
                    onChange={(e) =>
                      handleChange(index, "brandId", e.target.value)
                    }
                    className={selectStyle}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>
                    <Car size={14} className="text-blue-400" /> Model Name{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={vehicle.modelId}
                    onChange={(e) =>
                      handleChange(index, "modelId", e.target.value)
                    }
                    className={selectStyle}
                    disabled={!vehicle.brandId}
                  >
                    <option value="">Select Model</option>
                    {(modelsMap[vehicle.brandId] || []).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>
                    <Hash size={14} className="text-emerald-500" /> Variant{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={vehicle.variantId}
                    onChange={(e) =>
                      handleChange(index, "variantId", e.target.value)
                    }
                    className={selectStyle}
                    disabled={!vehicle.modelId}
                  >
                    <option value="">Select Variant</option>
                    {(variantsMap[vehicle.modelId] || []).map((va) => (
                      <option key={va._id} value={va._id}>
                        {va.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>
                    <Palette size={14} className="text-rose-400" /> Color{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={vehicle.colorId}
                    onChange={(e) =>
                      handleChange(index, "colorId", e.target.value)
                    }
                    className={selectStyle}
                    disabled={!vehicle.variantId}
                  >
                    <option value="">Select Color</option>
                    {(colorsMap[vehicle.variantId] || []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>
                    <Hash size={14} className="text-violet-500" /> GST Rate{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={vehicle.igstRate}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "igstRate",
                        e.target.value as VehicleForm["igstRate"],
                      )
                    }
                    className={`${selectStyle}`}
                  >
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="40">40%</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>
                    <Hash size={14} className="text-amber-500" /> Commercial HSN{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    value={vehicle.commercialHsnCode}
                    onChange={(e) =>
                      handleChange(index, "commercialHsnCode", e.target.value)
                    }
                    className={inputStyle}
                    placeholder="For PI / LC / Commercial Invoice"
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    <Hash size={14} className="text-sky-500" /> Export HSN{" "}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    value={vehicle.exportHsnCode}
                    onChange={(e) =>
                      handleChange(index, "exportHsnCode", e.target.value)
                    }
                    className={inputStyle}
                    placeholder="For Dealer Invoice / INR / USD / Packing List"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  Pricing
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    <DollarSign size={14} className="text-emerald-600" /> FOB
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehicle.fobAmount}
                    onChange={(e) =>
                      handleNumberChange(index, "fobAmount", e.target.value)
                    }
                    className={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    <DollarSign size={14} className="text-blue-600" /> Freight
                    Charges (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehicle.freight}
                    onChange={(e) =>
                      handleNumberChange(index, "freight", e.target.value)
                    }
                    className={inputStyle}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Another Vehicle Button */}
        <button
          type="button"
          onClick={addVehicle}
          className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-300 transition-all"
        >
          <Plus size={18} /> Add Another Vehicle
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/vehicles/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} /> Save Vehicle(s)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehicle;
