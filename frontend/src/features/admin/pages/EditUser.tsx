import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { userApi } from "@/services/userApi";
import type { RegisterData } from "@/types/auth.types";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Phone must be 10 to 15 digits";

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.role) newErrors.role = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await userApi.getUserDetails(id);
        setUser(res.data);
        setFormData({
          name: res.data?.name || "",
          email: res.data?.email || "",
          password: "",
          confirmPassword: "",
          phone: res.data?.phone || "",
          role: res.data?.role || "",
        });
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      e.target.name === "email" ? e.target.value.toLowerCase() : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      if (!id) return;
      const payload: any = {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.replace(/\D/g, ""),
        role: formData.role as RegisterData["role"],
        password: formData.password,
      };

      await userApi.updateUser(id, payload);
      toast.success("User updated successfully");
      navigate("/user-management/users");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
    }
  };

  if (loading) {
    return <div className="p-6 bg-gray-50 min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
        <p className="text-sm text-gray-500">Update user details</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Phone *
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.phone ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@company.com"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

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
            <option value="accountant">Accountant</option>
            <option value="sourcing_team">Sourcing Team</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-500 mt-1">{errors.role}</p>
          )}
        </div>

        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Password *
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.password ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            Confirm Password *
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
          )}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

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

export default EditUser;


