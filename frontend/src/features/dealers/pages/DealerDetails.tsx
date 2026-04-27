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
import { toast } from "react-toastify";

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
      .catch((error: any) => {
        toast.error(error.response?.data?.message || "Failed to load dealer");
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

      {/* FULL WIDTH CONTENT */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 transition-shadow hover:shadow-md">

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

              {/* UPDATED GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoBox label="Phone Number" value={dealer.contact} icon={Phone} />
                <InfoBox label="Email Address" value={dealer.email} icon={Mail} />
                <InfoBox label="GST Number" value={dealer.gstNumber} icon={Hash} />
                <InfoBox label="Address" value={dealer.address} icon={MapPin} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;
