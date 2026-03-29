import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  Edit2,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { updateProfile } from "../authSlice";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-gradient-to-r from-red-500 to-pink-500";
      case "manager":
        return "bg-gradient-to-r from-blue-500 to-indigo-500";
      default:
        return "bg-gradient-to-r from-green-500 to-teal-500";
    }
  };

  const validateForm = () => {
    const newErrors = { name: "", email: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setErrors({ name: "", email: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await dispatch(
        updateProfile({
          name: formData.name.trim(),
          email: formData.email.trim(),
        })
      ).unwrap();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error || "Update failed");
      console.error("Profile update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="animate-fade-in p-4 lg:p-8 min-h-screen">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-fit hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Header Card */}
      <div className="group bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)] opacity-75" />

        <div className="relative flex items-center gap-6">
          <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-8 ring-white/20 shadow-2xl transition-all duration-300 group-hover:scale-105">
            <User className="w-14 h-14 text-white drop-shadow-lg" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl lg:text-3xl font-black bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent mb-3 leading-tight">
              {formData.name || "Admin User"}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-blue-100">
                <Mail className="w-5 h-5" />
                <span className="font-medium truncate">
                  {formData.email || "admin@vehicleexport.com"}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg ${getRoleBadgeColor(
                  user?.role || "admin"
                )}`}
              >
                <Shield className="w-4 h-4" />
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Admin"}
              </span>
            </div>
          </div>

          {!isEditing && (
            <Button
              className="border-white/30! bg-white/10! backdrop-blur! hover:bg-white/20! text-white! font-semibold! shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 px-8 py-3 rounded-2xl flex items-center gap-2"
              onClick={handleEdit}
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form or Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 dark:border-slate-700/60 p-8 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-2xl font-black bg-linear-to-r from-gray-900 dark:from-slate-200 to-slate-900 dark:to-slate-200 bg-clip-text text-transparent mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            Personal Information
          </h2>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="text-lg font-semibold"
                  error={errors.name}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  error={errors.email}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-linear-to-r! from-blue-600! to-indigo-600! !hover:from-blue-700 !hover:to-indigo-700 !px-8 !py-3 !font-bold !shadow-xl !hover:shadow-2xl !transition-all !duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="!px-8 !py-3 !font-semibold !border-gray-300 dark:border-gray-600! text-gray-700! dark:!text-gray-200 hover:!bg-gray-50 dark:hover:!bg-gray-800 hover:!text-gray-900 dark:hover:!text-white"
                  disabled={loading}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-100/50 dark:border-blue-900/50 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Full Name
                  </label>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {user?.name || "Admin User"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/50 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Email Address
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 break-all">
                    {user?.email || "admin@vehicleexport.com"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Details */}
        <div className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 dark:border-slate-700/60 p-8 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 dark:from-slate-200 to-slate-900 dark:to-slate-200 bg-clip-text text-transparent mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            Account Details
          </h2>

          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-100/50 dark:border-purple-900/50 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Role
              </label>
              <span
                className={`inline-block px-6 py-3 rounded-2xl font-bold text-lg shadow-lg ${getRoleBadgeColor(
                  user?.role || "admin"
                )}`}
              >
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Admin"}
              </span>
            </div>
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/50 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Account Status
              </label>
              <span className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-lg font-bold shadow-lg ring-2 ring-emerald-200/50 dark:ring-emerald-800/50">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg" />
                Active Account
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
