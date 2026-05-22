import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Hash,
  Landmark,
  CreditCard,
} from "lucide-react";
import { authApi } from "@/services/authApi";
import type { RegisterData } from "@/types/auth.types";
import { toast } from "react-toastify";

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
  const [clientProfile, setClientProfile] = useState({
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
  const [dealerProfile, setDealerProfile] = useState({
    address: "",
    gstNumber: "",
    bankDetails: {
      bankName: "",
      accountNo: "",
      branchIfsc: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<any>({});

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

  const handleClientAddressChange = (field: string, value: string) => {
    setClientProfile((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleDealerBankChange = (
    field: "bankName" | "accountNo" | "branchIfsc",
    value: string,
  ) => {
    setDealerProfile((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  const validateGST = (gst: string) =>
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);

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

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.role) newErrors.role = "Role is required";

    if (formData.role === "client") {
      if (!clientProfile.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!clientProfile.address.country.trim()) {
        newErrors.country = "Country is required";
      }
    }

    if (formData.role === "dealer") {
      if (!dealerProfile.gstNumber.trim()) {
        newErrors.gstNumber = "GST number is required";
      } else if (!validateGST(dealerProfile.gstNumber)) {
        newErrors.gstNumber = "Invalid GST number format";
      }
      if (!dealerProfile.bankDetails.bankName.trim()) {
        newErrors.bankName = "Bank name is required";
      }
      if (!dealerProfile.bankDetails.accountNo.trim()) {
        newErrors.accountNo = "Account number is required";
      }
      if (!dealerProfile.bankDetails.branchIfsc.trim()) {
        newErrors.branchIfsc = "Branch / IFSC is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const submitData: RegisterData = {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ""),
        role: formData.role as RegisterData["role"],
      };
      const payload = {
        ...submitData,
        ...(formData.role === "client" ? { clientProfile } : {}),
        ...(formData.role === "dealer" ? { dealerProfile } : {}),
      };
      const res = await authApi.register(payload);

      console.log("User created:", res);
      toast.success("User and linked profile created successfully");
      navigate("/user-management/users");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(
        error.response?.data?.message ||
          "User create failed. Please check the details and try again.",
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Add User</h2>
        <p className="text-sm text-gray-500">Create a new user account</p>
      </div>

      {/* Section */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
          <h3 className="text-sm font-semibold text-gray-700">User Details</h3>
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
              placeholder="Enter full name"
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
              placeholder="9876543210"
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
              placeholder="user@company.com"
            className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
              ${errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Role */}
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

        {/* Password */}
        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Lock size={14} className="text-purple-500" />
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                ${errors.password ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Lock size={14} className="text-orange-500" />
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* {formData.role === "client" && (
          <>
            <div className="md:col-span-2 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Client Profile
                </h3>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <Building2 size={14} className="text-emerald-500" />
                Company Name *
              </label>
              <input
                value={clientProfile.companyName}
                onChange={(e) =>
                  setClientProfile({
                    ...clientProfile,
                    companyName: e.target.value,
                  })
                }
                placeholder="Client company name"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.companyName ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <MapPin size={14} className="text-emerald-500" />
                Country *
              </label>
              <input
                value={clientProfile.address.country}
                onChange={(e) =>
                  handleClientAddressChange("country", e.target.value)
                }
                placeholder="India"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.country ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.country && (
                <p className="text-xs text-red-500 mt-1">{errors.country}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                House / Building
              </label>
              <input
                value={clientProfile.address.houseBuilding}
                onChange={(e) =>
                  handleClientAddressChange("houseBuilding", e.target.value)
                }
                placeholder="Flat 12B, Sai Residency"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                Street / Area
              </label>
              <input
                value={clientProfile.address.streetArea}
                onChange={(e) =>
                  handleClientAddressChange("streetArea", e.target.value)
                }
                placeholder="MG Road"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                City / Town
              </label>
              <input
                value={clientProfile.address.cityTown}
                onChange={(e) =>
                  handleClientAddressChange("cityTown", e.target.value)
                }
                placeholder="Mumbai"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                State
              </label>
              <input
                value={clientProfile.address.state}
                onChange={(e) =>
                  handleClientAddressChange("state", e.target.value)
                }
                placeholder="Maharashtra"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                Pincode / ZIP
              </label>
              <input
                value={clientProfile.address.pincode}
                onChange={(e) =>
                  handleClientAddressChange("pincode", e.target.value)
                }
                placeholder="400001"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )} */}

        {formData.role === "dealer" && (
          <>
            <div className="md:col-span-2 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Dealer Profile
                </h3>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <Hash size={14} className="text-orange-500" />
                GST Number *
              </label>
              <input
                value={dealerProfile.gstNumber}
                onChange={(e) =>
                  setDealerProfile({
                    ...dealerProfile,
                    gstNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="27ACEFA0695F1ZH"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.gstNumber ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.gstNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.gstNumber}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <MapPin size={14} className="text-orange-500" />
                Address
              </label>
              <input
                value={dealerProfile.address}
                onChange={(e) =>
                  setDealerProfile({ ...dealerProfile, address: e.target.value })
                }
                placeholder="Full dealer address"
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <Landmark size={14} className="text-emerald-500" />
                Bank Name *
              </label>
              <input
                value={dealerProfile.bankDetails.bankName}
                onChange={(e) =>
                  handleDealerBankChange("bankName", e.target.value)
                }
                placeholder="HDFC Bank"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.bankName ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.bankName && (
                <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <CreditCard size={14} className="text-blue-500" />
                Account Number *
              </label>
              <input
                value={dealerProfile.bankDetails.accountNo}
                onChange={(e) =>
                  handleDealerBankChange("accountNo", e.target.value)
                }
                placeholder="1234567890"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.accountNo ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.accountNo && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.accountNo}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                <Hash size={14} className="text-violet-500" />
                Branch / IFSC *
              </label>
              <input
                value={dealerProfile.bankDetails.branchIfsc}
                onChange={(e) =>
                  handleDealerBankChange(
                    "branchIfsc",
                    e.target.value.toUpperCase(),
                  )
                }
                placeholder="HDFC0001234"
                className={`mt-1 w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 
                  ${errors.branchIfsc ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
              />
              {errors.branchIfsc && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.branchIfsc}
                </p>
              )}
            </div>
          </>
        )}
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
