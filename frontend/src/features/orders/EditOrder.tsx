import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../config/apiConfig";
import { toast } from "react-toastify";
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  User, 
  Building2, 
  Calendar, 
  Car, 
  X, 
  Save 
} from "lucide-react";

interface Vehicle {
  name: string;
  color: string;
  quantity: number;
}

const EditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState("");
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedClientCompany, setSelectedClientCompany] = useState('');
  const [date, setDate] = useState("");

  useEffect(() => {
    if (id) {
      fetchClients();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const clientsRes = await axios.get(`${apiConfig.baseURL}/clients`);
      const clientList = clientsRes.data.data || clientsRes.data;
      setClients(clientList);
      
      if (id) {
        fetchOrder(clientList);
      }
    } catch (err) {
      console.error("Clients fetch error:", err);
    }
  };

  const fetchOrder = async (clientList: any[]) => {
    try {
      const orderRes = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const orderData = orderRes.data.order || orderRes.data;
      
      setPageLoading(false);
      
      const effectiveClientId = typeof orderData.clientId === 'object' ? (orderData.clientId as any)._id : orderData.clientId;
      const clientObj = typeof orderData.clientId === 'object' ? (orderData.clientId as any) : clientList.find((c: any) => c._id === effectiveClientId);
      
      setClientId(effectiveClientId || "");
      setSelectedClientName(clientObj?.name || 'N/A');
      setSelectedClientCompany(clientObj?.companyName || '-');

      setDate(orderData.date ? new Date(orderData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setVehicles(Array.isArray(orderData.vehicles) ? orderData.vehicles : [{ name: "", color: "", quantity: 1 }]);
    } catch (err) {
      console.error("Order fetch error:", err);
      setPageLoading(false);
    }
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
    const e: Record<string, string> = {};
    if (!date) e.date = "Date required";
    vehicles.forEach((v, i) => {
      if (!v.name.trim()) e[`name_${i}`] = "Name required";
      if (!v.color.trim()) e[`color_${i}`] = "Color required";
      if (Number(v.quantity) < 1) e[`qty_${i}`] = "Qty ≥ 1";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.put(`${apiConfig.baseURL}/orders/${id}`, {
        clientId,
        date,
        vehicles
      });
      navigate("/orders/list", {
        state: { success: "Order updated successfully ✅" },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="w-full flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const inputStyle = "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const labelStyle = "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Order</h1>
          <p className="text-sm text-gray-500 mt-1">Update existing order information</p>
        </div>

        <button
          onClick={() => navigate("/orders/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"        >
          <ArrowLeft size={18} /> Back to Orders
        </button>
      </div>

      <form className="space-y-10" onSubmit={(e) => {e.preventDefault(); handleUpdate();}}>
        
        {/* CLIENT DETAILS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Customer & Timeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Client Name (Read-only)
              </label>
              <div className={`${inputStyle} bg-slate-100 dark:bg-gray-700/50 cursor-not-allowed flex items-center`}>
                {selectedClientName}
              </div>
            </div>

            <div>
              <label className={labelStyle}>
                <Building2 size={14} className="text-amber-500" /> Company (Read-only)
              </label>
              <div className={`${inputStyle} bg-slate-100 dark:bg-gray-700/50 cursor-not-allowed flex items-center`}>
                {selectedClientCompany}
              </div>
            </div>

            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-blue-400" /> Order Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputStyle}
                required
              />
              {errors.date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.date}</p>}
            </div>
          </div>
        </div>

        {/* VEHICLES SECTION */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
              <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Vehicles In Order ({vehicles.length})</h2>
            </div>
            <button 
              type="button"
              onClick={addVehicle}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"            >
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {vehicles.map((v, i) => (
              <div key={i} className="group bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 p-6 rounded-[1.5rem] transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100 dark:border-gray-600">
                    <Car size={12} className="text-indigo-400" /> Vehicle #{i + 1}
                  </span>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(i)}
                      className="cursor-pointer text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Vehicle Name *</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVehicleChange(i, "name", e.target.value)}
                      className={inputStyle}
                      placeholder="Model"
                      required
                    />
                    {errors[`name_${i}`] && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors[`name_${i}`]}</p>}
                  </div>

                  <div>
                    <label className={labelStyle}>Color *</label>
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) => handleVehicleChange(i, "color", e.target.value)}
                      className={inputStyle}
                      placeholder="Color"
                      required
                    />
                    {errors[`color_${i}`] && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors[`color_${i}`]}</p>}
                  </div>

                  <div>
                    <label className={labelStyle}>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={v.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleVehicleChange(i, "quantity", val === "" ? "" : parseInt(val));
                      }}
                      className={inputStyle}
                      placeholder="1"
                      required
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
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"          >
            <X size={16} /> Discard Changes
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"          >
            {loading ? "Updating..." : <><Save size={18} /> Update Order</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditOrder;