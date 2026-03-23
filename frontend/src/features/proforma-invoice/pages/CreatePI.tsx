import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";

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
    vehicleDetails: [
      { model: "", quantity: 1, unitPrice: 0 },
    ],
  });

  // 🔹 Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      const res = await axios.get(
        `${apiConfig.baseURL}/clients`,
        {
          params: {
            limit: 1000,
          },
        }
      );
      setClients(res.data.data || res.data);
    };

    fetchClients();
  }, []);

  // 🔹 Handle vehicle change
  const handleVehicleChange = (
    index: number,
    field: keyof Vehicle,
    value: any
  ) => {
    const updated: Vehicle[] = [...form.vehicleDetails];
    (updated[index] as any)[field] = value;
    setForm({ ...form, vehicleDetails: updated });
  };

  // 🔹 Add new vehicle row
  const addVehicle = () => {
    setForm({
      ...form,
      vehicleDetails: [
        ...form.vehicleDetails,
        { model: "", quantity: 1, unitPrice: 0 },
      ],
    });
  };

  // 🔹 Remove vehicle
  const removeVehicle = (index: number) => {
    const updated = form.vehicleDetails.filter((_, i) => i !== index);
    setForm({ ...form, vehicleDetails: updated });
  };

  // 🔹 Calculate total
  const totalAmount = form.vehicleDetails.reduce(
    (sum, v) => sum + v.quantity * v.unitPrice,
    0
  );

  // 🔹 Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.post(
        `${apiConfig.baseURL}/proforma-invoices`,
        {
          ...form,
          totalAmount,
        }
      );

      alert("PI Created Successfully ✅");
      navigate("/proforma-invoice");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creating PI");
    } finally {
      setLoading(false);
    }
  };

  const noSpinnerStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

  return (
    <div className="p-6">
        <style>{noSpinnerStyle}</style>
      {/* Header */}

      <button
        onClick={() => navigate("/proforma-invoice")}
        className="text-blue-500 mb-2"
      >
        ← Back to PIs
      </button>
      
      <h1 className="text-2xl font-semibold mb-4">
        Create Proforma Invoice
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-6"
      >
        {/* Client */}
        <div>
          <label className="block mb-1">Client *</label>
          <select
            value={form.client_id}
            onChange={(e) =>
              setForm({ ...form, client_id: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.clientCode})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Terms */}
        <div>
          <label>Payment Terms</label>
          <input
            value={form.paymentTerms}
            onChange={(e) =>
              setForm({ ...form, paymentTerms: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Validity */}
        <div>
          <label>Validity Date</label>
          <input
            type="date"
            value={form.validityDate}
            onChange={(e) =>
              setForm({ ...form, validityDate: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Vehicles */}
        <div>
          <h2 className="font-semibold mb-2">Vehicle Details</h2>

          {form.vehicleDetails.map((v, index) => (
  <div
    key={index}
    className="grid grid-cols-4 gap-4 mb-4 items-end"
  >
    {/* Model */}
    <div>
      <label className="text-sm text-gray-600">Model</label>
      <input
        type="text"
        value={v.model}
        onChange={(e) =>
          handleVehicleChange(index, "model", e.target.value)
        }
        className="w-full border px-3 py-2 rounded"
      />
    </div>

    {/* Quantity */}
    <div>
      <label className="text-sm text-gray-600">Quantity</label>
      <input
        type="number"
        value={v.quantity}
        onChange={(e) =>
          handleVehicleChange(index, "quantity", Number(e.target.value))
        }
        className="w-full border px-3 py-2 rounded"
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
    </div>

    {/* Unit Price */}
    <div>
      <label className="text-sm text-gray-600">Unit Price</label>
      <input
        type="number"
        value={v.unitPrice}
        onChange={(e) =>
          handleVehicleChange(index, "unitPrice", Number(e.target.value))
        }
        className="w-full border px-3 py-2 rounded"
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
    </div>

    {/* Remove */}
    <div>
      {form.vehicleDetails.length > 1 && (
        <button
          type="button"
          onClick={() => removeVehicle(index)}
          className="text-red-500 mt-5"
        >
          Remove
        </button>
      )}
    </div>
  </div>
))}

          <button
            type="button"
            onClick={addVehicle}
            className="text-blue-500"
          >
            + Add Vehicle
          </button>
        </div>

        {/* Total */}
        <div>
          <p className="font-semibold">
            Total: ${totalAmount}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create PI"}
        </button>
      </form>
    </div>
  );
};

export default CreatePI;