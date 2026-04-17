import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  User, Phone, Mail, MapPin, Hash,
  ArrowLeft, X, Save 
} from "lucide-react";

const EditDealer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", contact: "", email: "", address: "", gstNumber: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/v1/dealers/${id}`)
      .then(res => setForm(res.data.data))
      .catch(console.error);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact) {
      toast.error("Name and Contact are required!"); return;
    }
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/v1/dealers/${id}`, form);
      toast.success("Dealer updated successfully!");
      navigate("/dealers/list");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // UI Styles to match the client module reference
  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Dealer</h1>
          <p className="text-sm text-gray-500 mt-1">Modify dealer information</p>
        </div>

        <button
          onClick={() => navigate("/dealers/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dealers
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* DEALER DETAILS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Dealer Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputStyle}
                placeholder="John Motors"
              />
            </div>

            {/* Contact */}
            <div>
              <label className={labelStyle}>
                <Phone size={14} className="text-blue-400" /> Contact Number *
              </label>
              <input
                name="contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className={inputStyle}
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelStyle}>
                <Mail size={14} className="text-rose-400" /> Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputStyle}
                placeholder="dealer@company.com"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-emerald-500" /> GST Number
              </label>
              <input
                name="gstNumber"
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className={inputStyle}
                placeholder="27ACEFA0695F1ZH"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <MapPin size={14} className="text-purple-500" /> Physical Business Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className={`${inputStyle} resize-none`}
                placeholder="Full dealer address"
              />
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/dealers/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard Changes
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Updating..."
            ) : (
              <>
                <Save size={18} /> Update Dealer Details
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditDealer;