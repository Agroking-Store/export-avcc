import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Car,
  Hash,
  Palette,
  Save,
  X,
} from "lucide-react";
import { vehicleManagementApi } from "../vehicleManagementApi";

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brandName: "",
    modelName: "",
    variant: "",
    color: "",
  });

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const data = await vehicleManagementApi.getVehicleById(id as string);
        setForm({
          brandName: data.brandName || "",
          modelName: data.modelName || "",
          variant: data.variant || "",
          color: data.color || "",
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load vehicle");
      }
    };

    if (id) loadVehicle();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await vehicleManagementApi.updateVehicle(id as string, {
        ...form,
      });

      navigate("/vehicles/list", {
        state: { success: "Vehicle updated successfully" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update vehicle");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Vehicle</h1>
          <p className="text-sm text-gray-500 mt-1">Update vehicle inventory data</p>
        </div>

        <button
          onClick={() => navigate("/vehicles/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Vehicle List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Vehicle Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}><Car size={14} className="text-indigo-500" /> Brand Name</label>
              <input name="brandName" value={form.brandName} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}><Car size={14} className="text-blue-400" /> Model Name</label>
              <input name="modelName" value={form.modelName} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}><Hash size={14} className="text-emerald-500" /> Variant</label>
              <input name="variant" value={form.variant} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}><Palette size={14} className="text-rose-400" /> Color</label>
              <input name="color" value={form.color} onChange={handleChange} className={inputStyle} />
            </div>

          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/vehicles/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard Changes
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVehicle;
