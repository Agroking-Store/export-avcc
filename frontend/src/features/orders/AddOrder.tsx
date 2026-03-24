import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Download } from "lucide-react";
import { apiConfig } from "../../config/apiConfig";

interface Vehicle {
  slNo: number;
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
  quantity: number;
}

const emptyVehicle = (): Vehicle => ({
  slNo: 1,
  hsnCode: "8703.21.69",
  vehicleName: "",
  exteriorColour: "",
  chassisNo: "",
  engineNo: "",
  engineCapacity: "998cc",
  fuelType: "Petrol",
  countryOfOrigin: "INDIA",
  yom: new Date().getFullYear(),
  fobAmount: 0,
  freight: 300,
  quantity: 1,
});

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function helper(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + helper(n%100) : "");
    if (n < 100000) return helper(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + helper(n%1000) : "");
    if (n < 10000000) return helper(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + helper(n%100000) : "");
    return helper(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + helper(n%10000000) : "");
  }
  return helper(Math.round(num));
}

const AddOrder = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [form, setForm] = useState({
    clientId: "",
    incoterm: "CFR",
    portOfLoading: "Any Port in India",
    portOfDischarge: "Any Port in Sri Lanka",
    paymentTerms: "",
    buyerRef: "",
    date: new Date().toISOString().split("T")[0],
    bankName: "IDFC FIRST BANK",
    accountNo: "10247939579",
    branch: "KARVE NAGAR",
    ifscCode: "IDFB0041359",
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([emptyVehicle()]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    axios.get(`${apiConfig.baseURL}/clients`).then((res) => {
      setClients(res.data.data || res.data);
    });
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const client = clients.find((c) => c._id === id);
    setForm({ ...form, clientId: id });
    setSelectedClient(client || null);
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { ...emptyVehicle(), slNo: vehicles.length + 1 }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter((_, i) => i !== index).map((v, i) => ({ ...v, slNo: i + 1 })));
  };

  const calcRate = (v: Vehicle) => v.fobAmount + v.freight;
  const calcAmount = (v: Vehicle) => calcRate(v) * v.quantity;

  const grandTotal = vehicles.reduce((sum, v) => sum + calcAmount(v), 0);
  const totalFOB = vehicles.reduce((sum, v) => sum + v.fobAmount * v.quantity, 0);
  const totalFreight = vehicles.reduce((sum, v) => sum + v.freight * v.quantity, 0);

  const validate = () => {
    const e: any = {};
    if (!form.clientId) e.clientId = "Please select a client";
    if (vehicles.length === 0) e.vehicles = "Add at least one vehicle";
    vehicles.forEach((v, i) => {
      if (!v.chassisNo) e[`chassis_${i}`] = "Required";
      if (!v.engineNo) e[`engine_${i}`] = "Required";
      if (!v.vehicleName) e[`name_${i}`] = "Required";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status: string) => ({
    ...form,
    status,
    vehicles: vehicles.map((v) => ({
      ...v,
      ratePerUnit: calcRate(v),
      totalAmount: calcAmount(v),
    })),
    grandTotal,
    grandTotalInWords: numberToWords(grandTotal),
  });

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post(`${apiConfig.baseURL}/orders`, buildPayload("Draft"));
      alert("Order saved as Draft ✅");
      navigate("/orders");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving order");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await axios.post(`${apiConfig.baseURL}/orders`, buildPayload("Confirmed"));
      const orderId = res.data._id || res.data.order?._id;
      if (orderId) {
        const pdfRes = await axios.get(`${apiConfig.baseURL}/orders/${orderId}/pdf`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `PI_${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      navigate("/orders");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-blue-600">Add Order</h1>
          <p className="text-sm text-gray-500">Create a new export order</p>
        </div>
        <button onClick={() => navigate("/orders")} className="text-gray-500 hover:text-black">
          ← Back to Orders
        </button>
      </div>

      {/* SECTION 1 — Client */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-base font-semibold mb-4">Client Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Select Client *</label>
            <select
              name="clientId"
              value={form.clientId}
              onChange={handleClientChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientCode} — {c.name} {c.companyName ? `(${c.companyName})` : ""}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
          </div>

          {selectedClient && (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">Company</p>
                <p className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                  {selectedClient.companyName || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Country</p>
                <p className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                  {selectedClient.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Contact</p>
                <p className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                  {selectedClient.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                  {selectedClient.email || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                  {selectedClient.address || "-"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2 — Order Details */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-base font-semibold mb-4">Order Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block text-sm mb-1">Date *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Incoterm</label>
            <select
              name="incoterm"
              value={form.incoterm}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {["CFR", "FOB", "CIF", "EXW"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Port of Loading</label>
            <input
              type="text"
              name="portOfLoading"
              value={form.portOfLoading}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Port of Discharge</label>
            <input
              type="text"
              name="portOfDischarge"
              value={form.portOfDischarge}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Payment Terms</label>
            <input
              type="text"
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleFormChange}
              placeholder="e.g. T/T in advance"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Buyer's Reference</label>
            <input
              type="text"
              name="buyerRef"
              value={form.buyerRef}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

        </div>
      </div>

      {/* SECTION 3 — Vehicles */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold">Vehicle Details</h2>
          <button
            type="button"
            onClick={addVehicle}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {errors.vehicles && <p className="text-red-500 text-xs mb-3">{errors.vehicles}</p>}

        <div className="space-y-4">
          {vehicles.map((v, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 relative">

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-blue-600">Vehicle #{v.slNo}</span>
                {vehicles.length > 1 && (
                  <button
                    onClick={() => removeVehicle(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    value={v.vehicleName}
                    onChange={(e) => handleVehicleChange(i, "vehicleName", e.target.value)}
                    placeholder="e.g. Maruti Fronx Turbo Smart Hybrid Alpha 1.0L"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors[`name_${i}`] ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors[`name_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`name_${i}`]}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={v.hsnCode}
                    onChange={(e) => handleVehicleChange(i, "hsnCode", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Exterior Colour</label>
                  <input
                    type="text"
                    value={v.exteriorColour}
                    onChange={(e) => handleVehicleChange(i, "exteriorColour", e.target.value)}
                    placeholder="e.g. Candy White"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chassis No *</label>
                  <input
                    type="text"
                    value={v.chassisNo}
                    onChange={(e) => handleVehicleChange(i, "chassisNo", e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors[`chassis_${i}`] ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors[`chassis_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`chassis_${i}`]}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Engine No *</label>
                  <input
                    type="text"
                    value={v.engineNo}
                    onChange={(e) => handleVehicleChange(i, "engineNo", e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors[`engine_${i}`] ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors[`engine_${i}`] && <p className="text-red-500 text-xs mt-0.5">{errors[`engine_${i}`]}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Engine Capacity</label>
                  <input
                    type="text"
                    value={v.engineCapacity}
                    onChange={(e) => handleVehicleChange(i, "engineCapacity", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fuel Type</label>
                  <select
                    value={v.fuelType}
                    onChange={(e) => handleVehicleChange(i, "fuelType", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {["Petrol", "Diesel", "Electric", "Hybrid"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Country of Origin</label>
                  <input
                    type="text"
                    value={v.countryOfOrigin}
                    onChange={(e) => handleVehicleChange(i, "countryOfOrigin", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year of Manufacture</label>
                  <input
                    type="number"
                    value={v.yom}
                    onChange={(e) => handleVehicleChange(i, "yom", parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">FOB Amount (USD)</label>
                  <input
                    type="number"
                    value={v.fobAmount}
                    onChange={(e) => handleVehicleChange(i, "fobAmount", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Freight (USD)</label>
                  <input
                    type="number"
                    value={v.freight}
                    onChange={(e) => handleVehicleChange(i, "freight", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={v.quantity}
                    min={1}
                    onChange={(e) => handleVehicleChange(i, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

              </div>

              {/* Auto-calc */}
              <div className="mt-4 flex gap-6 bg-blue-50 rounded-lg px-4 py-3 text-sm">
                <span className="text-gray-500">Rate: <strong className="text-gray-800">USD {calcRate(v).toLocaleString()}</strong></span>
                <span className="text-gray-500">Amount: <strong className="text-blue-700">USD {calcAmount(v).toLocaleString()}</strong></span>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — Summary */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-base font-semibold mb-4">Order Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
            <p className="text-lg font-bold text-gray-800">{vehicles.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total FOB</p>
            <p className="text-lg font-bold text-gray-800">USD {totalFOB.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Freight</p>
            <p className="text-lg font-bold text-gray-800">USD {totalFreight.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Grand Total</p>
            <p className="text-lg font-bold text-blue-600">USD {grandTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Amount in Words</p>
          <p className="text-sm font-medium text-gray-700">USD {numberToWords(grandTotal)} Only</p>
        </div>
      </div>

      {/* SECTION 5 — Bank Details */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-base font-semibold mb-4">Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block text-sm mb-1">Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={form.bankName}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Account No</label>
            <input
              type="text"
              name="accountNo"
              value={form.accountNo}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Branch</label>
            <input
              type="text"
              name="branch"
              value={form.branch}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">IFS Code</label>
            <input
              type="text"
              name="ifscCode"
              value={form.ifscCode}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={loading}
          className="px-6 py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          {loading ? "Saving..." : "Save as Draft"}
        </button>

        <button
          type="button"
          onClick={handleSaveAndDownload}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Download size={16} />
          {loading ? "Processing..." : "Save & Download PI"}
        </button>
      </div>

    </div>
  );
};

export default AddOrder;