import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import DealerNav from "../components/DealerNav";

const AddDealer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", contact: "", email: "", address: "", gstNumber: "" });
  const [loading, setLoading] = useState(false);

  const validateGST = (gst: string) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact || !form.gstNumber) {
      toast.error("Name, Contact and GST Number are required!"); return;
    }
    if (!validateGST(form.gstNumber)) {
      toast.error("Invalid GST Number format!"); return;
    }
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/v1/dealers", form);
      toast.success("Dealer added successfully!");
      navigate("/dealers");
    } catch {
      toast.error("Failed to add dealer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DealerNav />
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/dealers")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Dealer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Register a new dealer</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dealer Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="Enter dealer name" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Number *</label>
            <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="Enter contact number" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="Enter email" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">GST Number *</label>
            <input type="text" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="e.g. 27ACEFA0695F1ZH" />
            <p className="text-xs text-slate-400 mt-1">Format: 27ACEFA0695F1ZH</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="Enter address" rows={3} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            {loading ? "Saving..." : "Save Dealer"}
          </button>
          <button onClick={() => navigate("/dealers")}
            className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDealer;