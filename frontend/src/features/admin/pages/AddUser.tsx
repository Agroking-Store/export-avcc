import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { userApi } from "@/services/userApi";
import type { RegisterData } from "@/types/auth.types";
import {
  User,
  Phone,
  Mail,
  UserCog,
  ArrowLeft,
  X,
  PlusCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const AddUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Phone must be 10 to 15 digits";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.role) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.name === "email" ? e.target.value.toLowerCase() : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload: RegisterData = {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.replace(/\D/g, ""),
        role: formData.role as RegisterData["role"],
        password: formData.password,
      };
      await userApi.register(payload);
      toast.success("User created successfully");
      navigate("/user-management/users");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) =>
    `w-full bg-[#F8F9FB] dark:bg-gray-800 border ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-[#F1F3F6] dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
    } rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 transition-all`;

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add User</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new system user account</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/user-management/users")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Users
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* USER DETAILS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">User Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <User size={14} className="text-indigo-500" /> Full Name *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputStyle("name")}
                placeholder="e.g. Rahul Sharma"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Phone size={14} className="text-blue-400" /> Contact Number *
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputStyle("phone")}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Mail size={14} className="text-rose-400" /> Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputStyle("email")}
                placeholder="user@company.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <UserCog size={14} className="text-amber-500" /> Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={inputStyle("role")}
              >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="sourcing_team">Sourcing Team</option>
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>
          </div>
        </div>

        {/* LOGIN CREDENTIALS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Login Credentials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Lock size={14} className="text-emerald-500" /> Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputStyle("password")} pr-11`}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Lock size={14} className="text-orange-500" /> Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${inputStyle("confirmPassword")} pr-11`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/user-management/users")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : <><PlusCircle size={18} /> Confirm & Save User</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;