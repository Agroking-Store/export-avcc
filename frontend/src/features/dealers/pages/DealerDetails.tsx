import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Phone,
  Mail,
  Building2,
  MapPin,
  ArrowLeft,
  ClipboardList,
  Hash,
} from "lucide-react";

const InfoBox = ({ label, value, icon: Icon }: any) => (
  <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
    <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
      {Icon && <Icon size={12} />} {label}
    </p>
    <p className="text-sm font-semibold text-[#2D3748]">{value || "-"}</p>
  </div>
);

const DealerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/v1/dealers/${id}`)
      .then((res) => {
        setDealer(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Loading Profile...
        </span>
      </div>
    );

  if (!dealer)
    return (
      <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">
        Dealer not found
      </div>
    );

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {dealer.dealerId || `DL-${dealer._id.slice(-4)}`}
          </span>
        </div>

        <button
          onClick={() => navigate("/dealers/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-gray-800 pb-4">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559] dark:text-white">
                Dealer Information
              </h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-black border border-indigo-100 dark:border-indigo-800 transition-transform group-hover:scale-105">
                  {dealer.name?.charAt(0) || "D"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-widest mb-0.5">
                    Dealer Name
                  </p>
                  <h3 className="text-2xl font-bold text-[#2D3748] dark:text-white group-hover:text-indigo-600 transition-colors">
                    {dealer.name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox
                  label="Phone Number"
                  value={dealer.contact}
                  icon={Phone}
                />
                <InfoBox
                  label="Email Address"
                  value={dealer.email}
                  icon={Mail}
                />
                <InfoBox
                  label="GST Number"
                  value={dealer.gstNumber}
                  icon={Hash}
                />
                <InfoBox label="Address" value={dealer.address} icon={MapPin} />
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR CARDS */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          <div className="bg-[#EBFDF5] dark:bg-emerald-900/20 rounded-2xl p-5 border border-[#D1FAE5] dark:border-emerald-800 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#D1FAE5] dark:hover:bg-emerald-900/30">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2 text-emerald-600">
              Status
            </p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">
                Active
              </h3>
            </div>
          </div>

          <div className="bg-[#EBF8FF] dark:bg-blue-900/20 rounded-2xl p-5 border border-[#BEE3F8] dark:border-blue-800 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#BEE3F8]/30 group">
            <p className="text-[9px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors group-hover:text-blue-900">
              <Building2 size={12} /> Dealer Type
            </p>
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 group-hover:scale-105 transition-transform origin-left">
              Authorized Partner
            </h3>
          </div>

          <button
            onClick={() => navigate(`/dealers/edit/${dealer._id}`)}
            className="cursor-pointer w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            Edit Dealer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;
