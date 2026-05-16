
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Landmark, 
  CreditCard, 
  Activity, 
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { companyApi } from "../components/companyApi";
import {
  CreateCompanyForm,
  UpdateCompanyForm,
  IAddressDetails,
  defaultBankDetails,
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
  address: { ...defaultAddress },
  bankDetails: { ...defaultBankDetails },
  gstNumber: "",
  isActive: true,
};

const CreateCompany: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [form, setForm] = useState<CreateCompanyForm | UpdateCompanyForm>(defaultCreateForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const address = form.address ?? defaultAddress;
  const bankDetails = form.bankDetails ?? defaultBankDetails;

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCompany = async () => {
        setLoading(true);
        try {
          const companyData = await companyApi.getCompanyById(id);
          setForm({
            ...companyData,
            address: { ...defaultAddress, ...(companyData.address || {}) },
            bankDetails: { ...defaultBankDetails, ...(companyData.bankDetails || {}) },
          });
        } catch (error) {
          toast.error("Failed to load company details.");
          navigate("/companies/list");
        } finally {
          setLoading(false);
        }
      };
      fetchCompany();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const field = name.split(".")[1] as keyof IAddressDetails;
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
      setErrors((prev) => ({ ...prev, [`address_${field}`]: "" }));
    } else if (name.startsWith("bankDetails.")) {
      const field = name.split(".")[1] as keyof typeof defaultBankDetails;
      setForm((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [field]: value },
      }));
      setErrors((prev) => ({ ...prev, [`bankDetails_${field}`]: "" }));
    } else {
      const val = name === "isActive" ? value === "true" : value;
      setForm((prev) => ({ ...prev, [name]: val }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = isEditMode 
      ? validateUpdateCompanyForm(form as UpdateCompanyForm) 
      : validateCreateCompanyForm(form as CreateCompanyForm);

    setErrors(validation.errors);
    if (!validation.isValid) {
      toast.error("Please correct the form errors.");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && id) {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          bankDetails: form.bankDetails,
          gstNumber: form.gstNumber,
          isActive: form.isActive,
        };
      
        await companyApi.updateCompany(id, payload);
      
        sessionStorage.setItem(
          "companySuccessMessage",
          "Company updated successfully ✅"
        );
        navigate("/companies/list");
      
      } else {
        await companyApi.createCompany(form as CreateCompanyForm);
      
      sessionStorage.setItem(
        "companySuccessMessage",
        "Company created successfully ✅"
      );
      navigate("/companies/list");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save company.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const labelStyle = "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2";
  const errorStyle = "text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1";

  if (loading && isEditMode) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Company...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit Company" : "Add New Company"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage corporate entities and banking profiles</p>
        </div>

        <button
          onClick={() => navigate("/companies/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Companies
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* SECTION 1: BASIC INFO */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-tight">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}><Building2 size={14} className="text-indigo-500"/> Company Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputStyle} placeholder="e.g. Acme Corp" />
              {errors.name && <p className={errorStyle}><AlertCircle size={10}/> {errors.name}</p>}
            </div>

            <div>
              <label className={labelStyle}><Mail size={14} className="text-blue-500"/> Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputStyle} placeholder="contact@company.com" />
              {errors.email && <p className={errorStyle}><AlertCircle size={10}/> {errors.email}</p>}
            </div>

            <div>
              <label className={labelStyle}><Phone size={14} className="text-emerald-500"/> Contact Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputStyle} placeholder="+91 ..." />
              {errors.phone && <p className={errorStyle}><AlertCircle size={10}/> {errors.phone}</p>}
            </div>

            <div>
              <label className={labelStyle}><CreditCard size={14} className="text-amber-500"/> GST Number</label>
              <input name="gstNumber" value={form.gstNumber} onChange={handleChange} className={inputStyle} placeholder="GSTIN..." />
            </div>

            <div>
              <label className={labelStyle}><Activity size={14} className="text-rose-500"/> Account Status *</label>
              <select 
                name="isActive" 
                value={form.isActive ? "true" : "false"} 
                onChange={handleChange} 
                className={inputStyle}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ADDRESS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-tight">Address Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}><MapPin size={14} className="text-blue-500"/> House / Building</label>
              <input
                name="address.houseBuilding"
                value={address.houseBuilding}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. 12, Shanti Nagar"
              />
            </div>
            <div>
              <label className={labelStyle}><MapPin size={14} className="text-blue-500"/> Street / Area</label>
              <input
                name="address.streetArea"
                value={address.streetArea}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. Residency Road"
              />
            </div>
            <div>
              <label className={labelStyle}><Globe size={14} className="text-indigo-500"/> City</label>
              <input
                name="address.cityTown"
                value={address.cityTown}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div>
              <label className={labelStyle}><Globe size={14} className="text-indigo-500"/> State</label>
              <input
                name="address.state"
                value={address.state}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. Maharashtra"
              />
              {errors.address_state && <p className={errorStyle}><AlertCircle size={10}/> {errors.address_state}</p>}
            </div>
            <div>
              <label className={labelStyle}><MapPin size={14} className="text-blue-500" /> Pincode</label>
              <input
                name="address.pincode"
                value={address.pincode}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. 400001"
              />
            </div>
            <div>
              <label className={labelStyle}><Globe size={14} className="text-indigo-500"/> Country *</label>
              <input
                name="address.country"
                value={address.country}
                onChange={handleChange}
                className={inputStyle}
                placeholder="e.g. India"
              />
              {errors.address_country && <p className={errorStyle}><AlertCircle size={10}/> {errors.address_country}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 3: BANK DETAILS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-tight">Banking Profile</h2>
          </div>

          <div className="p-6 bg-[#F8F9FB] rounded-[1.5rem] border border-[#F1F3F6] grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}><Landmark size={14} className="text-emerald-500" /> Bank Name</label>
              <input
                name="bankDetails.bankName"
                value={bankDetails.bankName}
                onChange={handleChange}
                className={inputStyle + " bg-white"}
                placeholder="e.g. State Bank of India"
              />
              {errors.bankDetails_bankName && <p className={errorStyle}>{errors.bankDetails_bankName}</p>}
            </div>
            <div>
              <label className={labelStyle}><CreditCard size={14} className="text-emerald-500" /> Account No</label>
              <input
                name="bankDetails.accountNo"
                value={bankDetails.accountNo}
                onChange={handleChange}
                className={inputStyle + " bg-white"}
                placeholder="e.g. 1234567890"
              />
              {errors.bankDetails_accountNo && <p className={errorStyle}>{errors.bankDetails_accountNo}</p>}
            </div>
            <div>
              <label className={labelStyle}><Activity size={14} className="text-emerald-500" /> Branch / IFSC</label>
              <input
                name="bankDetails.branchIfsc"
                value={bankDetails.branchIfsc}
                onChange={handleChange}
                className={inputStyle + " bg-white"}
                placeholder="e.g. HDFC0001234"
              />
              {errors.bankDetails_branchIfsc && <p className={errorStyle}>{errors.bankDetails_branchIfsc}</p>}
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate("/companies/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
          >
            {loading ? "Saving..." : (
              <>
                <CheckCircle2 size={18} /> 
                {isEditMode ? "Update Company" : "Confirm & Save Company"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompany;