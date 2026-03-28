import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Check, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { apiConfig } from "../../../config/apiConfig";
import DealerNav from "../components/DealerNav";

interface Vehicle {
  hsnCode: string;
  vehicleName: string;
  exteriorColour: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  countryOfOrigin: string;
  yom: number;
  fobAmount: number;
  freight: number;
}

interface SavedVehicle extends Vehicle { saved: boolean; }

const emptyVehicle: SavedVehicle = {
  hsnCode: "", vehicleName: "", exteriorColour: "",
  chassisNo: "", engineNo: "", engineCapacity: "",
  fuelType: "", countryOfOrigin: "", yom: 0,
  fobAmount: 0, freight: 0, saved: false,
};

const fieldPlaceholders: Record<string, string> = {
  hsnCode: "e.g. 87032319",
  vehicleName: "e.g. Suzuki Alto",
  exteriorColour: "e.g. Pearl White",
  chassisNo: "e.g. MA3ERLF1S00123456",
  engineNo: "e.g. K10B1234567",
  engineCapacity: "e.g. 998cc",
  fuelType: "e.g. Petrol",
  countryOfOrigin: "e.g. Japan",
  yom: "e.g. 2023",
  fobAmount: "e.g. 8000",
  freight: "e.g. 500",
};

const DealerOrders = () => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<any[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([{ ...emptyVehicle }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    axios.get(`${apiConfig.baseURL}/dealers`).then((res) => setDealers(res.data.data || []));
  }, []);

  const savedCount = vehicles.filter((v) => v.saved).length;

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const handleSaveVehicle = (index: number) => {
    const v = vehicles[index];
    const newErrors: any = {};
    if (!v.vehicleName.trim()) newErrors[`vehicleName_${index}`] = "Required";
    if (!v.chassisNo.trim()) newErrors[`chassisNo_${index}`] = "Required";
    if (!v.engineNo.trim()) newErrors[`engineNo_${index}`] = "Required";
    if (!v.engineCapacity.trim()) newErrors[`engineCapacity_${index}`] = "Required";
    if (!v.fuelType.trim()) newErrors[`fuelType_${index}`] = "Required";
    if (!v.countryOfOrigin.trim()) newErrors[`countryOfOrigin_${index}`] = "Required";
    if (!v.yom) newErrors[`yom_${index}`] = "Required";
    if (!v.fobAmount) newErrors[`fobAmount_${index}`] = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors({ ...errors, ...newErrors });
      return;
    }
    const updated = [...vehicles];
    updated[index] = { ...updated[index], saved: true };
    setVehicles(updated);
    setErrors({});
    toast.success(`Vehicle ${index + 1} saved!`);
  };

  const handleEditVehicle = (index: number) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], saved: false };
    setVehicles(updated);
  };

  const addVehicle = () => setVehicles([...vehicles, { ...emptyVehicle }]);

  const removeVehicle = (index: number) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!dealerId) { toast.error("Select a dealer!"); return; }
    if (vehicles.some((v) => !v.saved)) { toast.error("Save all vehicles first!"); return; }
    try {
      setLoading(true);
      const payload = {
        dealerId,
        date,
        vehicles: vehicles.map(({ saved, ...v }) => v),
      };
      await axios.post(`${apiConfig.baseURL}/orders`, payload);
      toast.success("Order created successfully!");
      navigate("/dealers/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error creating order");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (disabled: boolean) =>
    `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 text-black dark:text-white ${
      disabled ? "bg-gray-100 dark:bg-gray-700 text-gray-500" : "bg-white dark:bg-gray-800"
    }`;

  return (
    <div className="space-y-6">
      <DealerNav />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Dealer Order</h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
            Total Vehicles Saved: <span className="font-bold text-blue-600">{savedCount}</span>
          </p>
        </div>
        <button onClick={() => navigate("/dealers/orders")}
          className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
          ← Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dealer</label>
            <select value={dealerId} onChange={(e) => setDealerId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select Dealer</option>
              {dealers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Date
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Vehicles ({savedCount} saved / {vehicles.length} total)
            </h3>
            <button onClick={addVehicle}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm">
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          <div className="space-y-4">
            {vehicles.map((v, i) => (
              <div key={i} className={`p-6 rounded-lg border ${v.saved ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                    Vehicle {i + 1}
                    {v.saved && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Saved ✓</span>}
                  </h4>
                  {!v.saved && vehicles.length > 1 && (
                    <button onClick={() => removeVehicle(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "HSN Code", field: "hsnCode", type: "text" },
                    { label: "Vehicle Name", field: "vehicleName", type: "text" },
                    { label: "Exterior Colour", field: "exteriorColour", type: "text" },
                    { label: "Chassis No", field: "chassisNo", type: "text" },
                    { label: "Engine No", field: "engineNo", type: "text" },
                    { label: "Engine Capacity", field: "engineCapacity", type: "text" },
                    { label: "Fuel Type", field: "fuelType", type: "text" },
                    { label: "Country of Origin", field: "countryOfOrigin", type: "text" },
                    { label: "Year of Manufacture", field: "yom", type: "number" },
                    { label: "FOB Amount (USD)", field: "fobAmount", type: "number" },
                    { label: "Freight (USD)", field: "freight", type: "number" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        type={type}
                        value={(v as any)[field] || ""}
                        disabled={v.saved}
                        placeholder={v.saved ? "" : fieldPlaceholders[field] || ""}
                        onChange={(e) => handleVehicleChange(i, field as keyof Vehicle, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                        className={inputClass(v.saved)}
                      />
                      {errors[`${field}_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`${field}_${i}`]}</p>}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  {!v.saved ? (
                    <button onClick={() => handleSaveVehicle(i)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                      <Check size={16} /> Save Vehicle
                    </button>
                  ) : (
                    <button onClick={() => handleEditVehicle(i)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg">
                      <Pencil size={16} /> Edit Vehicle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-gray-700">
          <button onClick={() => navigate("/dealers/orders")}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSubmitOrder} disabled={loading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerOrders;