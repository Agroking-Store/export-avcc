import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Keep Label for other fields
import { companyApi } from "../components/companyApi";
import {
  CreateCompanyForm,
  UpdateCompanyForm,
  IAddressDetails,
} from "../components/company.types";
import {
  validateCreateCompanyForm,
  validateUpdateCompanyForm,
} from "../components/companyValidation";

const defaultAddress: IAddressDetails = {
  houseBuilding: "",
  streetArea: "",
  cityTown: "",
  state: "",
  pincode: "",
  country: "",
};
const defaultCreateForm: CreateCompanyForm = {
  name: "",
  email: "",
  phone: "",
  // country: "", // Removed as it's part of address now
  address: { ...defaultAddress },
  gstNumber: "",
};

const CreateCompany: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // 'id' will be present for edit mode

  const [form, setForm] = useState<CreateCompanyForm | UpdateCompanyForm>(
    defaultCreateForm
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCompany = async () => {
        setLoading(true);
        try {
          const companyData = await companyApi.getCompanyById(id);
          setForm({
            name: companyData.name || "",
            email: companyData.email || "", // Ensure email is handled
            phone: companyData.phone || "", // Ensure phone is handled
            address: {
              ...defaultAddress,
              ...(companyData.address || {}),
            },
            gstNumber: companyData.gstNumber || "",
          });
        } catch (error) {
          console.error("Failed to fetch company details:", error);
          toast.error("Failed to load company details.");
          navigate("/companies"); // Redirect if company not found or error
        } finally {
          setLoading(false);
        }
      };
      fetchCompany();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error for this field if it exists
    if (errors[name] || errors[name.replace("address.", "address_")]) {
      // Handle nested address errors
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    let validationResult;
    if (isEditMode) {
      validationResult = validateUpdateCompanyForm(form as UpdateCompanyForm);
    } else {
      validationResult = validateCreateCompanyForm(form as CreateCompanyForm);
    }

    setErrors(validationResult.errors);
    if (!validationResult.isValid) {
      toast.error("Please correct the form errors.");
    }
    return validationResult.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && id) {
        await companyApi.updateCompany(id, form as UpdateCompanyForm);
        toast.success("Company updated successfully!");
      } else {
        await companyApi.createCompany(form as CreateCompanyForm);
        toast.success("Company created successfully!");
      }
      navigate("/companies");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Failed to save company.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Loading Company...
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={() => navigate("/companies")}
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {isEditMode ? "Edit Company" : "Create New Company"}
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="address.houseBuilding">House/Building</Label>
            <Input
              id="address.houseBuilding"
              name="address.houseBuilding"
              value={form.address?.houseBuilding || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address.streetArea">Street/Area</Label>
            <Input
              id="address.streetArea"
              name="address.streetArea"
              value={form.address?.streetArea || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address.cityTown">City/Town</Label>
            <Input
              id="address.cityTown"
              name="address.cityTown"
              value={form.address?.cityTown || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address.state">State</Label>
            <Input
              id="address.state"
              name="address.state"
              value={form.address?.state || ""}
              onChange={handleChange}
              className={errors.address_state ? "border-red-500" : ""}
            />
            {errors.address_state && (
              <p className="text-red-500 text-xs mt-1">
                {errors.address_state}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="address.pincode">Pincode</Label>
            <Input
              id="address.pincode"
              name="address.pincode"
              value={form.address?.pincode || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address.country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address.country"
              name="address.country"
              value={form.address?.country || ""}
              onChange={handleChange}
              className={errors.address_country ? "border-red-500" : ""}
            />
            {errors.address_country && (
              <p className="text-red-500 text-xs mt-1">
                {errors.address_country}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input
              id="gstNumber"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/companies")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Company"
              : "Create Company"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompany;
