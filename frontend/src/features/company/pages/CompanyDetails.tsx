import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import {
  ArrowLeft, Edit, Building2, Mail, Phone, MapPin,
  Globe, Landmark, CreditCard, Activity, Calendar,
  ClipboardList, CheckCircle2, XCircle,
  Info,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Company } from "../components/company.types";

interface CompanyProfomaInvoice {
  _id: string;
  totalAmount: number;
  buyersRef: string
}
const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [piPdfLoading, setPiPdfLoading] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInvoices, setCompanyInvoices] = useState<CompanyProfomaInvoice[]>([]);

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
  useEffect(() => {
    const fetchCompanyInvoices = async () => {
      try {
        setLoading(true);
        const res = await axios.get<CompanyProfomaInvoice[]>(`${apiConfig.baseURL}/companies/proformainvoice/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("accessToken")}`,
          },
        });
        setCompanyInvoices(res.data)
      } catch (err: any) {
        toast.error("Failed to load company details.");
        navigate("/companies/list");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCompanyInvoices();
  }, [id, navigate]);

  useEffect(() => {
    console.log("companyInvoices updated:", companyInvoices);
  }, [companyInvoices]);
  const handlePiPdfAction = async (
    id: string,
    action: "view"
  ) => {
    try {
      setPiPdfLoading(id);
      let token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token && localStorage.getItem("user")) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "{}");
          token = userObj.token || userObj.accessToken;
        } catch (e) { }
      }
      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`,
        {
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      if (action === "view") {
        window.open(url, "_blank");
      } 
    } catch (error) {
      console.error("PDF Action Error", error);
      toast.error("Failed to process PDF");
    } finally {
      setPiPdfLoading(null);
    }
  };
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
        <div className="lg:col-span-12 space-y-6">

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

              <div className="grid grid-cols-2 gap-4">
                <InfoBox
                  label="Registered On"
                  value={formatDate(company.createdAt)}
                  icon={Calendar}
                />
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

          {/* BANKING CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <Info size={18} className="text-cyan-600" />
              <h2 className="text-lg font-bold text-[#1B2559]">
                Performa Invoice Details
              </h2>
            </div>

            <div className="overflow-x-auto bg-blue-50/50 rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
              <table className="min-w-full text-sm text-left">

                {/* HEADER */}
                <thead className="bg-blue-50/50 text-cyan-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Proforma Invoice Id</th>
                    <th className="px-4 py-3">Buyers Reference</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3 text-center">Action</th> {/* NEW */}
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y">
                  {companyInvoices.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">

                      <td className="px-4 py-3">{v._id}</td>

                      <td className="px-4 py-3 font-medium">
                        {v.buyersRef}
                      </td>

                      <td className="px-4 py-3">
                        {v.totalAmount}
                      </td>

                      {/* ACTION COLUMN */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0 cursor-pointer"
                          onClick={() =>
                            handlePiPdfAction(
                              v._id,
                            
                              "view"
                            )
                          }
                          disabled={piPdfLoading === v._id}
                        >
                          <Eye
                            className={`h-5 w-5 ${piPdfLoading === v._id
                                ? "text-gray-400 animate-pulse"
                                : "text-slate-600"
                              } cursor-pointer`}
                          />
                        </Button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
};

export default CompanyDetails;