import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import { 
  ArrowLeft, Edit, Building2, Mail, Phone, MapPin, 
  Globe, Landmark, CreditCard, Activity, Calendar, 
  ClipboardList, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Company } from "../components/company.types";

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get<Company>(`${apiConfig.baseURL}/companies/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("accessToken")}`,
          },
        });
        setCompany(res.data);
      } catch (err: any) {
        toast.error("Failed to load company details.");
        navigate("/companies/list");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCompanyDetails();
  }, [id, navigate]);

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const InfoBox = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-blue-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-[#005A9C]">
        {Icon && <Icon size={12} className="transition-colors group-hover:text-[#005A9C]" />} {label}
      </p>
      <p className="text-sm font-semibold text-[#2D3748] transition-colors group-hover:text-[#005A9C]">{value || "-"}</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Company...</span>
    </div>
  );

  if (!company) return null;

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-blue-300 transition-colors">
            {company.companyId}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/companies/edit/${company._id}`)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:bg-blue-700 active:scale-95"
          >
            <Edit size={16} /> Edit Company
          </button>
          <button
            onClick={() => navigate("/companies/list")}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-md active:scale-95"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Details */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Corporate Profile</h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl font-black border border-blue-100 transition-transform group-hover:scale-105">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">Company Name</p>
                  <h3 className="text-3xl font-bold text-[#2D3748] transition-colors group-hover:text-[#005A9C]">{company.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {company.isActive ? 'Active Entity' : 'Inactive Entity'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox label="Email Address" value={company.email} icon={Mail} />
                <InfoBox label="Phone Number" value={company.phone} icon={Phone} />
                <InfoBox label="GST Number" value={company.gstNumber} icon={CreditCard} />
                <InfoBox label="Region" value={company.address?.country} icon={Globe} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <InfoBox label="Registered Office Address" value={`${company.address?.houseBuilding}, ${company.address?.streetArea}, ${company.address?.cityTown}, ${company.address?.state} - ${company.address?.pincode}`} icon={MapPin} />
              </div>
            </div>
          </div>

          {/* BANKING CARD */}
          {company.bankDetails && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <Landmark size={18} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-[#1B2559]">Banking Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Bank Name</p>
                  <p className="text-sm font-bold text-slate-700">{company.bankDetails.bankName || "N/A"}</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Account Number</p>
                  <p className="text-sm font-bold text-slate-700 font-mono tracking-wider">{company.bankDetails.accountNo || "N/A"}</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">IFSC / Branch</p>
                  <p className="text-sm font-bold text-slate-700">{company.bankDetails.branchIfsc || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar Cards */}
        <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-6">
          
          {/* STATUS CARD */}
          <div className={`rounded-2xl p-5 border shadow-sm transition-all hover:shadow-lg ${company.isActive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${company.isActive ? 'text-green-700' : 'text-red-700'}`}>
              <Activity size={12} /> Status
            </p>
            <div className="flex items-center gap-2">
              {company.isActive ? <CheckCircle2 size={24} className="text-green-600" /> : <XCircle size={24} className="text-red-600" />}
              <h3 className={`text-xl font-black ${company.isActive ? 'text-green-900' : 'text-red-900'}`}>
                {company.isActive ? 'ACTIVE' : 'INACTIVE'}
              </h3>
            </div>
          </div>

          {/* DATE CARD */}
          <div className="bg-[#F0F5FF] rounded-2xl p-5 border border-[#D6E4FF] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Registered On
            </p>
            <h3 className="text-lg font-bold text-blue-900">
              {formatDate(company.createdAt)}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanyDetails;