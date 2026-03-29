import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { Plus } from "lucide-react";

type Vehicle = {
  model: string;
  quantity: number;
  unitPrice: number;
};

const EditPI = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    paymentTerms: "",
    validityDate: "",
    vehicleDetails: [{ model: "", quantity: 1, unitPrice: 0 }],
  });

  // 🔹 Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      const res = await axios.get(`${apiConfig.baseURL}/clients`, {
        params: { limit: 1000 },
      });
      setClients(res.data.data || res.data);
    };
    fetchClients();
  }, []);

  // 🔹 Fetch PI data
  useEffect(() => {
    const fetchPI = async () => {
      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/proforma-invoices/${id}`
        );

        const pi = res.data;

        setForm({
          client_id: pi.client_id?._id || "",
          paymentTerms: pi.paymentTerms || "",
          validityDate: pi.validityDate
            ? pi.validityDate.split("T")[0]
            : "",
          vehicleDetails:
            pi.vehicleDetails?.length > 0
              ? pi.vehicleDetails
              : [{ model: "", quantity: 1, unitPrice: 0 }],
        });
      } catch (err) {
        console.error("Error fetching PI", err);
      }
    };

    if (id) fetchPI();
  }, [id]);

  const handleVehicleChange = (
    index: number,
    field: keyof Vehicle,
    value: any
  ) => {
    const updated = [...form.vehicleDetails];
    (updated[index] as any)[field] = value;
    setForm({ ...form, vehicleDetails: updated });
  };

  const addVehicle = () => {
    setForm({
      ...form,
      vehicleDetails: [
        ...form.vehicleDetails,
        { model: "", quantity: 1, unitPrice: 0 },
      ],
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

      await axios.put(
        `${apiConfig.baseURL}/proforma-invoices/${id}`,
        {
          ...form,
          totalAmount,
        }
      );

      alert("PI Updated ✅");
            navigate("/proforma-invoice", {
        state: { success: "PI updated successfully ✏️" },
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Error updating PI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen p-4 rounded">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Edit Proforma Invoice
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
            Update PI details
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to PIs
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 space-y-6"
      >

        {/* CLIENT DETAILS */}
        <div className="bg-slate-50 dark:bg-gray-700 p-6 rounded-xl border border-slate-200 dark:border-gray-600">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">Client Details</h3>

          <div className="grid md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Client *</label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600
           focus:ring-2 focus:ring-blue-500"
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
              <label className="text-sm text-gray-700 dark:text-gray-300">Payment Terms</label>
              <input
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600
           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Validity Date</label>
              <input
                type="date"
                value={form.validityDate}
                onChange={(e) =>
                  setForm({ ...form, validityDate: e.target.value })
                }
                className="w-full mt-1 border rounded-md px-3 py-2 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-gray-300 dark:border-gray-600
           focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="bg-slate-50 dark:bg-gray-700 p-6 rounded-xl border border-slate-200 dark:border-gray-600">
          <h3 className="font-semibold mb-4">Vehicle Details</h3>

          {form.vehicleDetails.map((v, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 mb-3">

              <input
                placeholder="Model"
                value={v.model}
                onChange={(e) =>
                  handleVehicleChange(index, "model", e.target.value)
                }
                className="border px-3 py-2 rounded-md 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600"
              />

              <input
                type="number"
                value={v.quantity}
                onChange={(e) =>
                  handleVehicleChange(index, "quantity", Number(e.target.value))
                }
                className="border px-3 py-2 rounded-md 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600
           appearance-none 
           [&::-webkit-inner-spin-button]:appearance-none 
           [&::-webkit-outer-spin-button]:appearance-none"
              />

              <input
                type="number"
                value={v.unitPrice}
                onChange={(e) =>
                  handleVehicleChange(index, "unitPrice", Number(e.target.value))
                }
                className="border px-3 py-2 rounded-md 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600
           appearance-none 
           [&::-webkit-inner-spin-button]:appearance-none 
           [&::-webkit-outer-spin-button]:appearance-none"
              />

              {form.vehicleDetails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVehicle(index)}
                  className="text-red-500 dark:text-red-400"
                >
                  Remove
                </button>
              )}

            </div>
          ))}

          <button
            type="button"
            onClick={addVehicle}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-2"
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        </div>

        {/* TOTAL */}
        <div className="text-right font-semibold text-lg text-gray-800 dark:text-white">
          Total: ${totalAmount}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 border-t border-slate-200 dark:border-gray-700 pt-4">
          
          <button
            type="button"
            onClick={() => navigate("/proforma-invoice")}
            className="px-4 py-2 border rounded-md 
           bg-white dark:bg-gray-700 
           text-black dark:text-white 
           border-slate-300 dark:border-gray-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 
           dark:bg-blue-500 dark:hover:bg-blue-600 
           text-white rounded-md"
          >
            {loading ? "Updating..." : "Update PI"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default EditPI;