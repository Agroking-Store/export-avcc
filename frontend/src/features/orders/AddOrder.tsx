import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calendar, ArrowLeft, X, ShoppingBag, User } from "lucide-react";
import { toast } from "react-toastify";

interface Vehicle {
  name: string;
  color: string;
  quantity: number | "";
}

const AddOrder = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { name: "", color: "", quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    api.get("/clients?limit=1000").then((res) => {
      setClients(res.data.data || res.data);
    });
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const client = clients.find((c) => c._id === id);
    setClientId(id);
    setSelectedClient(client || null);
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { name: "", color: "", quantity: 1 }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e: any = {};
    if (!clientId) e.clientId = "Select client";
    vehicles.forEach((v, i) => {
      if (!v.name.trim()) e[`name_${i}`] = "Name required";
      if (!v.color.trim()) e[`color_${i}`] = "Color required";
      if (v.quantity === "" || Number(v.quantity) < 1) e[`qty_${i}`] = "Quantity ≥ 1";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({ clientId, date, vehicles });

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post("/orders", buildPayload());
      navigate("/orders/list", { state: { success: "Order created successfully ✅" } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving order");
    } finally {
      setLoading(false);
    }
  };

  // Reusable UI Styles
  const inputStyle = "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const labelStyle = "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Order</h1>
          <p className="text-sm text-gray-500 mt-1">Initialize a new vehicle delivery order</p>
        </div>

        <button
          onClick={() => navigate("/orders/list")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>
      </div>

      <form className="space-y-10">
        {/* CLIENT & DATE SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Select Client
              </label>
              <select
                value={clientId}
                onChange={handleClientChange}
                className={inputStyle}
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.clientId}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-blue-400" /> Order Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputStyle}
              />
            </div>

            {/* Quick Preview of selected client */}
            {selectedClient && (
              <div className="lg:col-span-1 bg-[#F0F7FF] dark:bg-gray-800/50 p-4 rounded-xl border border-blue-100 dark:border-gray-700 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300">{selectedClient.name}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-medium">{selectedClient.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VEHICLES SECTION */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
              <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Vehicles ({vehicles.length})</h2>
            </div>
            <button
              type="button"
              onClick={addVehicle}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {vehicles.map((v, i) => (
              <div key={i} className="group relative bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 p-6 rounded-[1.5rem] transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100 dark:border-gray-600">
                    Vehicle #{i + 1}
                  </span>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(i)}
                      className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Model Name</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVehicleChange(i, "name", e.target.value)}
                      className={inputStyle}
                      placeholder="e.g. Hilux"
                    />
                    {errors[`name_${i}`] && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors[`name_${i}`]}</p>}
                  </div>
                  <div>
                    <label className={labelStyle}>Color</label>
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) => handleVehicleChange(i, "color", e.target.value)}
                      className={inputStyle}
                      placeholder="e.g. White"
                    />
                    {errors[`color_${i}`] && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors[`color_${i}`]}</p>}
                  </div>
                  <div>
                    <label className={labelStyle}>Quantity</label>
                    <input
                      type="number"
                      value={v.quantity}
                      onChange={(e) => handleVehicleChange(i, "quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                      className={inputStyle}
                      placeholder="1"
                    />
                    {errors[`qty_${i}`] && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors[`qty_${i}`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/orders/list")}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70"
          >
            {loading ? "Saving..." : <><ShoppingBag size={18} /> Confirm & Save Order</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrder;