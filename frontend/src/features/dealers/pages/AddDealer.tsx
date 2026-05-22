import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Landmark,
  CreditCard,
  ArrowLeft,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";

const AddDealer = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    gstNumber: "",
    bankDetails: {
      bankName: "",
      accountNo: "",
      branchIfsc: "",
    },
  });
  const [loading, setLoading] = useState(false);

  const validateGST = (gst: string) => {
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only Dealer Name and Contact are mandatory now
    if (!form.name || !form.contact) {
      toast.error("Dealer name and contact number are required!");
      return;
    }

    if (!/^[0-9]{10,15}$/.test(form.contact.replace(/\D/g, ""))) {
      toast.error("Contact must be 10 to 15 digits");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter valid email address");
      return;
    }
    if (form.gstNumber.trim() && !validateGST(form.gstNumber)) {
      toast.error("Invalid GST Number format!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name,
        contact: form.contact.replace(/\D/g, ""),
        email: form.email.toLowerCase().trim(),
        address: form.address,
        gstNumber: form.gstNumber,
        // Only send bankDetails if at least one field is filled, otherwise send empty object
        bankDetails:
          form.bankDetails.bankName ||
          form.bankDetails.accountNo ||
          form.bankDetails.branchIfsc
            ? form.bankDetails
            : {},
      };
      await axios.post(`${API_URL}/dealers`, payload);
      navigate("/dealers/list", {
        state: { success: "Dealer profile created successfully" },
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Dealer create failed. Please check the details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  const handleBankDetailChange = (
    field: "bankName" | "accountNo" | "branchIfsc",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Dealer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new dealer profile
          </p>
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
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Dealer Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className={labelStyle}>
                <Mail size={14} className="text-rose-400" /> Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value.toLowerCase() })
                }
                className={inputStyle}
                type="email"
                placeholder="dealer@company.com"
              />
            </div>

            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-emerald-500" /> GST Number
              </label>
              <input
                name="gstNumber"
                value={form.gstNumber}
                onChange={(e) =>
                  setForm({ ...form, gstNumber: e.target.value.toUpperCase() })
                }
                className={inputStyle}
                placeholder="e.g. 27ACEFA0695F1ZH"
              />
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Format: 27ACEFA0695F1ZH
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>
                <MapPin size={14} className="text-purple-500" /> Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${inputStyle} resize-none`}
                placeholder="Full dealer address"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* BANK DETAILS SECTION - Removed asterisks (*) from labels here */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Bank Details{" "}
              <span className="text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}>
                <Landmark size={14} className="text-emerald-500" /> Bank Name
              </label>
              <input
                value={form.bankDetails.bankName}
                onChange={(e) =>
                  handleBankDetailChange("bankName", e.target.value)
                }
                className={inputStyle}
                placeholder="HDFC Bank"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <CreditCard size={14} className="text-blue-500" /> Account
                Number
              </label>
              <input
                value={form.bankDetails.accountNo}
                onChange={(e) =>
                  handleBankDetailChange("accountNo", e.target.value)
                }
                className={inputStyle}
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-violet-500" /> Branch / IFSC
              </label>
              <input
                value={form.bankDetails.branchIfsc}
                onChange={(e) =>
                  handleBankDetailChange(
                    "branchIfsc",
                    e.target.value.toUpperCase(),
                  )
                }
                className={inputStyle}
                placeholder="HDFC0001234"
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
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <PlusCircle size={18} /> Confirm & Save Dealer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDealer;
