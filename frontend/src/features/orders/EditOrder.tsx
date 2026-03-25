import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { apiConfig } from "../../config/apiConfig";

interface Vehicle {
  name: string;
  color: string;
  quantity: number;
}

const EditOrder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errors, setErrors] = useState<any>({});
  const [clientId, setClientId] = useState("");
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedClientCompany, setSelectedClientCompany] = useState('');
  const [clientObj, setClientObj] = useState<any>(null);
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
      
      // Pre-fill all fields - clients already loaded
      const effectiveClientId = typeof orderData.clientId === 'object' ? (orderData.clientId as any)._id : orderData.clientId;
      const clientObj = typeof orderData.clientId === 'object' ? (orderData.clientId as any) : clientList.find((c: any) => c._id === effectiveClientId);
      
      setClientId(effectiveClientId || "");
      setClientObj(clientObj || null);
      setSelectedClientName(clientObj?.name || 'N/A');
      setSelectedClientCompany(clientObj?.companyName || '-');



      setDate(orderData.date ? new Date(orderData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setVehicles(Array.isArray(orderData.vehicles) ? orderData.vehicles : [{ name: "", color: "", quantity: 1 }]);
      
      console.log("EditOrder COMPLETE LOAD:", {
        clientId: effectiveClientId,
        clientObj,
        vehicles: orderData.vehicles,
        date: orderData.date
      });
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
    const e: any = {};
    if (!date) e.date = "Date required";
    vehicles.forEach((v, i) => {
      if (!v.name.trim()) e[`name_${i}`] = "Name required";
      if (!v.color.trim()) e[`color_${i}`] = "Color required";
      if (v.quantity < 1) e[`qty_${i}`] = "Qty ≥ 1";
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
      alert("✅ Updated!");
      navigate("/orders");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Order</h2>
          <p className="text-sm text-slate-500">Client (read-only) + Vehicles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg" onClick={() => navigate("/orders")}>
          <ArrowLeft size={18} />
          Orders
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Client</label>
              <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm"><strong>Name:</strong> {selectedClientName}</p>
                <p className="text-sm"><strong>Company:</strong> {selectedClientCompany}</p>
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Vehicles ({vehicles.length})</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={addVehicle}>
              <Plus size={16} />
              Add
            </button>
          </div>
          
          <div className="space-y-4">
            {vehicles.map((v, i) => (
              <div key={i} className="p-6 bg-slate-50 border rounded-lg">
                <div className="flex justify-between mb-4">
                  <h4 className="font-medium">Vehicle {i+1}</h4>
                  {vehicles.length > 1 && <button onClick={() => removeVehicle(i)} className="text-red-500 p-1"><Trash2 size={16} /></button>}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Name *</label>
                    <input value={v.name} onChange={(e) => handleVehicleChange(i, "name", e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Color *</label>
                    <input value={v.color} onChange={(e) => handleVehicleChange(i, "color", e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Qty *</label>
                    <input type="number" min="1" value={v.quantity} onChange={(e) => handleVehicleChange(i, "quantity", Number(e.target.value))} className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <button className="px-6 py-2 border rounded-lg" onClick={() => navigate("/orders")}>Cancel</button>
          <button className="px-8 py-2 bg-blue-600 text-white rounded-lg" onClick={handleUpdate} disabled={loading}>
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;

