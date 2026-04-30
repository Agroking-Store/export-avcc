import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { User, Mail, Phone, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { register } from "@/features/auth/authSlice";
import { authApi } from "@/services/authApi";


const AddUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "", // ✅ added
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const res = await authApi.register(formData);

    console.log("User created:", res);

    navigate("/user-management/users");
  } catch (error) {
    console.error("Registration failed:", error);
  }
};

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

      {/* Header */}
      <div className="px-6 py-5 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          Add User
        </h2>
        <p className="text-sm text-gray-500">
          Create a new user account
        </p>
      </div>

      {/* Section */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
          <h3 className="text-sm font-semibold text-gray-700">
            User Details
          </h3>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Name */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <User size={14} className="text-indigo-500" />
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Phone size={14} className="text-blue-500" />
            Phone *
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.phone ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Mail size={14} className="text-red-500" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Lock size={14} className="text-purple-500" />
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.password ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Role (NEW - minimal addition) */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Role *
          </label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.role ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          >
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="dealer">Dealer</option>
            <option value="client">Client</option>
            <option value="accountant">Accountant</option>
            <option value="sourcing_team">Sourcing Team</option>
          </select>

          {errors.role && (
            <p className="text-xs text-red-500 mt-1">{errors.role}</p>
          )}
        </div>

      </div>

      {/* Buttons */}
      <div className="px-6 pb-6 flex justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center gap-2"
        >
          ✕ Discard
        </button>

        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-500 shadow-md hover:brightness-110 flex items-center gap-2"
        >
          ＋ Confirm & Save
        </button>
      </div>

    </div>
  );
};

export default AddUser;