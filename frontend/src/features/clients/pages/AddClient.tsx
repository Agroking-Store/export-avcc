import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  PlusCircle 
} from "lucide-react";

const AddClient = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    companyName: "",
    address: {
      houseBuilding: "",
      streetArea: "",
      cityTown: "",
      state: "",
      pincode: "",
      country: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      address: { ...form.address, [e.target.name]: e.target.value },
    });
  };

  const validate = () => {
    if (!form.name.trim()) return "Client name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.companyName.trim()) return "Company name is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) return toast.error(error);

    try {
      setLoading(true);
      await axios.post(`${apiConfig.baseURL}/clients/add`, form);
      navigate("/clients/list", {
        state: { success: "Client added successfully ✅" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding client");
    } finally {
      setLoading(false);
    }
  };

  // UI Styles to match the reference
  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add Client</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new client profile</p>
        </div>

        <button
          onClick={() => navigate("/clients/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Clients
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* CLIENT DETAILS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Client Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Client Full Name
              </label>
              <input name="name" value={form.name} onChange={handleChange} className={inputStyle} placeholder="John Doe" />
            </div>

            <div>
              <label className={labelStyle}>
                <Phone size={14} className="text-blue-400" /> Contact Number
              </label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputStyle} placeholder="+1 (555) 000-0000" />
            </div>

            <div>
              <label className={labelStyle}>
                <Globe size={14} className="text-emerald-500" /> Region / Country
              </label>
              <input name="country" value={form.country} onChange={handleChange} className={inputStyle} placeholder="United Arab Emirates" />
            </div>

            <div>
              <label className={labelStyle}>
                <Mail size={14} className="text-rose-400" /> Professional Email
              </label>
              <input name="email" value={form.email} onChange={handleChange} className={inputStyle} placeholder="client@company.com" />
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>
                <Building2 size={14} className="text-amber-500" /> Organization / Company Name
              </label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className={inputStyle} placeholder="Global Logistics Solutions Ltd." />
            </div>
          </div>
        </div>

        {/* SHIPPING ADDRESS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-purple-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Shipping Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <MapPin size={14} className="text-purple-500" /> House / Building No.
              </label>
              <input name="houseBuilding" value={form.address.houseBuilding} onChange={handleAddressChange} className={inputStyle} placeholder="Suite 405, Business Bay" />
            </div>

            <div>
              <label className={labelStyle}>Street / Area</label>
              <input name="streetArea" value={form.address.streetArea} onChange={handleAddressChange} className={inputStyle} placeholder="Main Street" />
            </div>

            <div>
              <label className={labelStyle}>City / Town</label>
              <input name="cityTown" value={form.address.cityTown} onChange={handleAddressChange} className={inputStyle} placeholder="Dubai" />
            </div>

            <div>
              <label className={labelStyle}>State / Province</label>
              <input name="state" value={form.address.state} onChange={handleAddressChange} className={inputStyle} placeholder="Dubai" />
            </div>

            <div>
              <label className={labelStyle}>Pincode / ZIP</label>
              <input name="pincode" value={form.address.pincode} onChange={handleAddressChange} className={inputStyle} placeholder="00000" />
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/clients/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"          >
            {loading ? "Saving..." : <><PlusCircle size={18} /> Confirm & Save Client</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddClient;