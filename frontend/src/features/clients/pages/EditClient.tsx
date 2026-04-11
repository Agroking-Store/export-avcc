import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import { 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  MapPin, 
  ArrowLeft, 
  X, 
  Save 
} from "lucide-react";

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    country: "",
    email: "",
    address: "",
    companyName: "",
  });

  const [loading, setLoading] = useState(false);

  // Fetch existing client
  const fetchClient = async () => {
    try {
      const res = await axios.get(`${apiConfig.baseURL}/clients/${id}`);
      const client = res.data.client;

      setForm({
        name: client.name || "",
        phone: client.phone || "",
        country: client.country || "",
        email: client.email || "",
        address: client.address || "",
        companyName: client.companyName || "",
      });
    } catch (error) {
      console.error("Error fetching client", error);
      toast.error("Could not load client data");
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.country) {
      toast.error("Name, Contact Number and Country are required");
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${apiConfig.baseURL}/clients/${id}`, form);

      navigate("/clients/list", {
        state: { success: "Client updated successfully ✅" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating client");
    } finally {
      setLoading(false);
    }
  };

  // UI Styles to match the high-fidelity reference
  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-8 py-10 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Client</h1>
          <p className="text-sm text-gray-500 mt-1">Modify client information</p>
        </div>

        <button
          onClick={() => navigate("/clients/list")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Clients
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* CLIENT DETAILS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Client Full Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputStyle}
                placeholder="John Doe"
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelStyle}>
                <Phone size={14} className="text-blue-400" /> Contact Number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputStyle}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Country */}
            <div>
              <label className={labelStyle}>
                <Globe size={14} className="text-emerald-500" /> Country *
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className={inputStyle}
                placeholder="United Arab Emirates"
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
                onChange={handleChange}
                className={inputStyle}
                placeholder="client@company.com"
              />
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <Building2 size={14} className="text-amber-500" /> Organization / Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className={inputStyle}
                placeholder="Global Logistics Solutions Ltd."
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
                onChange={handleChange}
                rows={3}
                className={`${inputStyle} resize-none`}
                placeholder="Suite 405, Business Bay, Dubai"
              />
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/clients/list")}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard Changes
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70"
          >
            {loading ? (
              "Updating..."
            ) : (
              <>
                <Save size={18} /> Update Client Details
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditClient;