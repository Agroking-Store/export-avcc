import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calendar, ArrowLeft } from "lucide-react";
import { apiConfig } from "../../config/apiConfig";

interface Vehicle {
  name: string;
  color: string;
  quantity: number;
}

const AddOrder = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ name: "", color: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    axios.get(`${apiConfig.baseURL}/clients`).then((res) => {
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
      if (v.quantity < 1) e[`qty_${i}`] = "Quantity ≥ 1";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    clientId,
    date,
    vehicles
  });

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post(`${apiConfig.baseURL}/orders`, buildPayload());
      alert("Order saved ✅");
      navigate("/orders");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Add New Order
          </h2>
          <p className="text-sm text-slate-500">
            Client + Vehicles (name, color, qty)
          </p>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
        >
          <ArrowLeft size={18} />
          Orders
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Client & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
              <select
                value={clientId}
                onChange={handleClientChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Client Info */}
          {selectedClient && (
            <div className="p-6 bg-slate-50 rounded-lg border">
              <h3 className="font-medium text-slate-800 mb-3">{selectedClient.name}</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <div>{selectedClient.companyName}</div>
                <div>{selectedClient.country} • {selectedClient.phone}</div>
              </div>
            </div>
          )}

          {/* Vehicles */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                Vehicles ({vehicles.length})
              </h3>
              <button
                type="button"
                onClick={addVehicle}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add Vehicle
              </button>
            </div>

            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-slate-800">Vehicle {i + 1}</h4>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleVehicleChange(i, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Vehicle model"
                      />
                      {errors[`name_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`name_${i}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Color</label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleVehicleChange(i, "color", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Red, Blue..."
                      />
                      {errors[`color_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`color_${i}`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={v.quantity}
                        min="1"
                        onChange={(e) => handleVehicleChange(i, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {errors[`qty_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`qty_${i}`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Saving..." : "Save Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOrder;

