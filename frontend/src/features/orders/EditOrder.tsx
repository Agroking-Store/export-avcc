import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2} from "lucide-react";
import { apiConfig } from "../../config/apiConfig";
import { toast } from "react-toastify";

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

  const handleVehicleChange = (
    index: number,
    field: keyof Vehicle,
    value: any
  ) => {
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
      if (Number(v.quantity) < 1)
        e[`qty_${i}`] = "Qty ≥ 1";
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
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Edit Order
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Update order details
          </p>
        </div>

        <button
          onClick={() => navigate("/orders/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to Orders
        </button>
      </div>

      {/* Form */}
      <form className="space-y-6" onSubmit={(e) => {e.preventDefault(); handleUpdate();}}>
        
        {/* Client Details Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Client Details (read-only)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Client Name
              </label>
              <input
                value={selectedClientName}
                readOnly
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 bg-slate-100 dark:bg-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <input
                value={selectedClientCompany}
                readOnly
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 bg-slate-100 dark:bg-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Date Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Date
          </h2>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Order Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Vehicles Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              Vehicles
            </h2>
            <button 
              type="button"
              onClick={addVehicle}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 
                           dark:bg-emerald-500 dark:hover:bg-emerald-600 
                           text-white rounded-lg transition"
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          </div>

          <div className="space-y-4">
            {vehicles.map((v, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white">
                    Vehicle {i + 1}
                  </h4>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(i)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVehicleChange(i, "name", e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 
                                 text-black dark:text-white 
                                 placeholder-gray-400 dark:placeholder-gray-300
                                 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter vehicle name"
                      required
                    />
                    {errors[`name_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`name_${i}`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) => handleVehicleChange(i, "color", e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 
                                 text-black dark:text-white 
                                 placeholder-gray-400 dark:placeholder-gray-300
                                 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Red, Blue, Black..."
                      required
                    />
                    {errors[`color_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`color_${i}`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={v.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleVehicleChange(
                          i,
                          "quantity",
                          value === "" ? "" : parseInt(value)
                        );
                      }}
                      style={{ MozAppearance: "textfield" }}
                      className="w-full border border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 
                                 text-black dark:text-white 
                                 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none
                                 appearance-none 
                                 [&::-webkit-inner-spin-button]:appearance-none 
                                 [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="1"
                      required
                    />
                    {errors[`qty_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`qty_${i}`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/orders/list")}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-700 dark:text-white 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 
                       text-white rounded-lg transition"
          >
            {loading ? "Updating..." : "Update Order"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditOrder;

