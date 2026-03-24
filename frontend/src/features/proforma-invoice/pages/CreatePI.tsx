import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { Plus } from "lucide-react";

type Vehicle = {
  model: string;
  quantity: number;
  unitPrice: number;
};

type PIForm = {
  client_id: string;
  paymentTerms: string;
  validityDate: string;
  vehicleDetails: Vehicle[];
};

const CreatePI = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<PIForm>({
    client_id: "",
    paymentTerms: "",
    validityDate: "",
    vehicleDetails: [{ model: "", quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    const fetchClients = async () => {
      const res = await axios.get(`${apiConfig.baseURL}/clients`, {
        params: { limit: 1000 },
      });
      setClients(res.data.data || res.data);
    };
    fetchClients();
  }, []);

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: any) => {
    const updated = [...form.vehicleDetails];
    (updated[index] as any)[field] = value;
    setForm({ ...form, vehicleDetails: updated });
  };

  const addVehicle = () => {
    setForm({
      ...form,
      vehicleDetails: [...form.vehicleDetails, { model: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeVehicle = (index: number) => {
    setForm({
      ...form,
      vehicleDetails: form.vehicleDetails.filter((_, i) => i !== index),
    });
  };

  const totalAmount = form.vehicleDetails.reduce(
    (sum, v) => sum + v.quantity * v.unitPrice,
    0
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${apiConfig.baseURL}/proforma-invoices`, {
        ...form,
        totalAmount,
      });
      alert("PI Created ✅");
      navigate("/proforma-invoice");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Create Proforma Invoice
          </h2>
          <p className="text-sm text-slate-500">
            Create new PI entry
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice")}
          className="text-gray-500 hover:text-black"
        >
          ← Back to PIs
        </button>
      </div>

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
      >

        {/* CLIENT DETAILS */}
        <div className="bg-slate-50 p-6 rounded-xl border">
          <h3 className="font-semibold mb-4">Client Details</h3>

          <div className="grid md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm">Client *</label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.clientCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">Payment Terms</label>
              <input
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm">Validity Date</label>
              <input
                type="date"
                value={form.validityDate}
                onChange={(e) =>
                  setForm({ ...form, validityDate: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="bg-slate-50 p-6 rounded-xl border">
          <h3 className="font-semibold mb-4">Vehicle Details</h3>

          {form.vehicleDetails.map((v, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 mb-3">

              <input
                placeholder="Model"
                value={v.model}
                onChange={(e) =>
                  handleVehicleChange(index, "model", e.target.value)
                }
                className="border px-3 py-2 rounded-md"
              />

              <input
                type="number"
                value={v.quantity}
                onChange={(e) =>
                  handleVehicleChange(index, "quantity", Number(e.target.value))
                }
                className="border px-3 py-2 rounded-md appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                value={v.unitPrice}
                onChange={(e) =>
                  handleVehicleChange(index, "unitPrice", Number(e.target.value))
                }
                className="border px-3 py-2 rounded-md appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {form.vehicleDetails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVehicle(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              )}

            </div>
          ))}

          <button
            type="button"
            onClick={addVehicle}
            className="flex items-center gap-2 text-blue-600 mt-2"
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        </div>

        {/* TOTAL */}
        <div className="text-right font-semibold text-lg">
          Total: ${totalAmount}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 border-t pt-4">
          
          <button
            type="button"
            onClick={() => navigate("/proforma-invoice")}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            {loading ? "Creating..." : "Create PI"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default CreatePI;