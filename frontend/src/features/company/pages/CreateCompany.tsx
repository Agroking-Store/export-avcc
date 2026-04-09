import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react"; // Added AlertCircle for error messages
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button"; // Keep Button for other fields
import { companyApi } from "../components/companyApi";
import {
  CreateCompanyForm,
  UpdateCompanyForm,
  IAddressDetails,
  defaultBankDetails, // Import defaultBankDetails
} from "../components/company.types";
import {
  validateCreateCompanyForm,
  validateUpdateCompanyForm,
} from "../components/companyValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // Added phone to defaultCreateForm as it's part of CreateCompanyForm
  // country: "", // Removed as it's part of address now
  address: { ...defaultAddress },
  bankDetails: { ...defaultBankDetails }, // Add bankDetails to default form
  gstNumber: "",
  isActive: true, // Default to active for new companies
};

const CreateCompany: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // 'id' will be present for edit mode

  const [form, setForm] = useState<CreateCompanyForm | UpdateCompanyForm>(
    defaultCreateForm as CreateCompanyForm
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
              // Ensure address is handled
              ...defaultAddress,
              ...(companyData.address || {}), // Use spread to merge with defaultAddress
            },
            bankDetails: {
              ...defaultBankDetails,
              ...(companyData.bankDetails || {}), // Populate bankDetails
            },
            gstNumber: companyData.gstNumber || "",
            isActive: companyData.isActive, // Populate isActive status
          });
        } catch (error) {
          console.error("Failed to fetch company details:", error); // Consolidated catch block
          toast.error("Failed to load company details."); // Consolidated toast
          navigate("/companies"); // Redirect if company not found or error // Consolidated navigation
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
      const addressField = name.split(".")[1] as keyof IAddressDetails; // Type assertion for addressField
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
      setErrors((prev) => ({ ...prev, [`address_${addressField}`]: "" })); // Clear specific address error
    } else if (name.startsWith("bankDetails.")) {
      const bankField = name.split(".")[1] as keyof typeof defaultBankDetails;
      setForm((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [bankField]: value },
      }));
      setErrors((prev) => ({ ...prev, [`bankDetails_${bankField}`]: "" })); // Clear specific bankDetails error
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error for this field if it exists
    if (errors[name]) {
      // Clear direct field error
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

    console.log("Validation Result:", validationResult); // Debugging log
    setErrors(validationResult.errors);
    if (!validationResult.isValid) {
      toast.error("Please correct the form errors.");
      console.log("Form validation failed. Errors:", validationResult.errors); // Debugging log
    }
    return validationResult.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called."); // Debugging log
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
      toast.error("Failed to save company. Check console for details."); // Added a more generic toast for API errors
      toast.error(error.response?.data?.message || "Failed to save company.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    // Only show skeleton for edit mode initial load
    return (
      // Loading skeleton for a better UX
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

  const inputClass = // Re-used from PIFormFields.tsx for consistency
    "w-full h-12 px-4 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base shadow-sm"; // Re-used from CreatePI.tsx for consistency
  const getInputClass = (
    errKey?: string // Re-used from PIFormFields.tsx for consistency
  ) =>
    `w-full h-12 px-4 bg-white border ${
      errKey && errors[errKey]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
    } rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all text-base shadow-sm`; // Re-used from CreatePI.tsx for consistency
  const labelClass = "block text-sm font-medium text-gray-700 mb-2"; // Re-used from PIFormFields.tsx for consistency
  const sectionTitleClass = "text-xl font-medium text-gray-900 mb-6"; // Re-used from PIFormFields.tsx for consistency
  const divider = <hr className="border-gray-200 my-10" />; // Re-used from PIFormFields.tsx for consistency

  return (
    <div className="bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/companies")}
              variant="outline"
              size="default" // Changed to default to allow custom sizing
              className="h-12 w-12 rounded-full border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {isEditMode ? "Edit Company" : "Create New Company"}
            </h1>
          </div>
        </div>
        {/* Form */} {/* Consistent spacing for form sections */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* COMPANY DETAILS */}
          <div className="space-y-6">
            {" "}
            {/* Added space-y-6 for consistent section spacing */}
            <h3 className={sectionTitleClass}>Company Details</h3>{" "}
            {/* Re-used sectionTitleClass */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Company Name <span className="text-red-500">*</span>
                </label>{" "}
                {/* Consistent label styling */}
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={getInputClass("name")} // Apply getInputClass for error styling
                />
                {errors.name && (
                  <>
                    {" "}
                    {/* Wrap multiple elements in a Fragment */}
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={getInputClass("email")} // Apply getInputClass for error styling
                />
                {errors.email && (
                  <>
                    {" "}
                    {/* Wrap multiple elements in a Fragment */}
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={getInputClass("phone")} // Apply getInputClass for error styling
                />
                {errors.phone && (
                  <>
                    {" "}
                    {/* Wrap multiple elements in a Fragment */}
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label htmlFor="gstNumber" className={labelClass}>
                  GST Number {/* No asterisk as it's not required */}
                </label>
                {/* No specific error styling for gstNumber as it's not validated in companyValidation.ts */}
                {/* If validation is added, use getInputClass("gstNumber") */}
                <input
                  id="gstNumber"
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                  className={inputClass} // Use inputClass
                />
              </div>
            </div>
            {/* Status Field */}
            <div className="mt-6">
              <label htmlFor="isActive" className={labelClass}>
                Status <span className="text-red-500">*</span>
              </label>
              <div className="max-w-xs">
                <Select
                  value={form.isActive ? "true" : "false"}
                  onValueChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      isActive: value === "true", // Convert string "true" or "false" to boolean
                    }));
                    setErrors((prev) => ({ ...prev, isActive: "" })); // Clear error for isActive
                  }}
                >
                  <SelectTrigger className={getInputClass("isActive")}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-70"
                    side="bottom"
                    align="start"
                    position="popper"
                  >
                    <SelectItem className="text-base" value="true">
                      Active
                    </SelectItem>
                    <SelectItem className="text-base" value="false">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.isActive && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.isActive}
                </p>
              )}
            </div>
          </div>
          {divider} {/* Re-used divider */}
          {/* ADDRESS DETAILS */}
          <div className="space-y-6">
            {" "}
            {/* Added space-y-6 for consistent section spacing */}
            <h3 className={sectionTitleClass}>Address Details</h3>{" "}
            {/* Re-used sectionTitleClass */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address.houseBuilding" className={labelClass}>
                  House/Building
                </label>
                <input
                  id="address.houseBuilding"
                  name="address.houseBuilding"
                  value={form.address?.houseBuilding || ""}
                  onChange={handleChange}
                  className={getInputClass("address_houseBuilding")} // Apply getInputClass for error styling
                />
              </div>
              <div>
                <label htmlFor="address.streetArea" className={labelClass}>
                  Street/Area
                </label>
                <input
                  id="address.streetArea"
                  name="address.streetArea"
                  value={form.address?.streetArea || ""}
                  onChange={handleChange}
                  className={getInputClass("address_streetArea")} // Apply getInputClass for error styling
                />
              </div>
              <div>
                <label htmlFor="address.cityTown" className={labelClass}>
                  City/Town
                </label>
                <input
                  id="address.cityTown"
                  name="address.cityTown"
                  value={form.address?.cityTown || ""}
                  onChange={handleChange}
                  className={getInputClass("address_cityTown")} // Apply getInputClass for error styling
                />
              </div>
              <div>
                <label htmlFor="address.state" className={labelClass}>
                  State
                </label>
                <input
                  id="address.state"
                  name="address.state"
                  value={form.address?.state || ""}
                  onChange={handleChange}
                  className={getInputClass("address_state")} // Apply getInputClass for error styling
                />
                {errors.address_state && (
                  <>
                    {" "}
                    {/* Wrap multiple elements in a Fragment */}
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address_state}
                    </p>
                  </>
                )}
              </div>
              <div>
                <label htmlFor="address.pincode" className={labelClass}>
                  Pincode
                </label>
                <input
                  id="address.pincode"
                  name="address.pincode"
                  value={form.address?.pincode || ""}
                  onChange={handleChange}
                  className={getInputClass("address_pincode")} // Apply getInputClass for error styling
                />
              </div>
              <div>
                <label htmlFor="address.country" className={labelClass}>
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  id="address.country"
                  name="address.country"
                  value={form.address?.country || ""}
                  onChange={handleChange}
                  className={getInputClass("address_country")} // Apply getInputClass for error styling
                />
                {errors.address_country && (
                  <>
                    {" "}
                    {/* Wrap multiple elements in a Fragment */}
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address_country}
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* Bank Details */}
            <div className="space-y-6 mt-10">
              <h3 className={sectionTitleClass}>Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="bankDetails.bankName" className={labelClass}>
                    Bank Name
                  </label>
                  <input
                    id="bankDetails.bankName"
                    name="bankDetails.bankName"
                    value={form.bankDetails?.bankName || ""}
                    onChange={handleChange}
                    className={getInputClass("bankDetails_bankName")}
                  />
                  {errors.bankDetails_bankName && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bankDetails_bankName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="bankDetails.accountNo" className={labelClass}>
                    Account Number
                  </label>
                  <input
                    id="bankDetails.accountNo"
                    name="bankDetails.accountNo"
                    value={form.bankDetails?.accountNo || ""}
                    onChange={handleChange}
                    className={getInputClass("bankDetails_accountNo")}
                  />
                  {errors.bankDetails_accountNo && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bankDetails_accountNo}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="bankDetails.branchIfsc"
                    className={labelClass}
                  >
                    Branch/IFSC
                  </label>
                  <input
                    id="bankDetails.branchIfsc"
                    name="bankDetails.branchIfsc"
                    value={form.bankDetails?.branchIfsc || ""}
                    onChange={handleChange}
                    className={getInputClass("bankDetails_branchIfsc")}
                  />
                  {errors.bankDetails_branchIfsc && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bankDetails_branchIfsc}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Form Actions - Moved inside the form */}
            <div className="flex items-center justify-end gap-3 mt-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/companies")}
                className="h-12 px-6 text-gray-600 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Company"
                  : "Create Company"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompany;
