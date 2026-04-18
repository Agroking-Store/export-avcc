import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Car, Hash, Fuel, Globe, Calendar, 
  DollarSign, Package, ClipboardList, Info, Palette
} from "lucide-react";
import { bookingApi } from "../../../services/bookingApi";
import { toast } from "react-toastify";

const VehicleView = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const expandedIndex = parseInt(searchParams.get("expandedIndex") || vehicleIndex || "0");
  const srNo = searchParams.get("srNo") || String(expandedIndex + 1);

  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [status, setStatus] = useState("New");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const orderRes = await axios.get(`http://localhost:5000/api/v1/orders/${orderId}`);
        const order = orderRes.data.order || orderRes.data;
        
        const bookingsRes = await bookingApi.getAll();
        const bookings = bookingsRes.data?.data || bookingsRes.data || [];
        
        const matchingBooking = bookings.find((b: any) => 
          (b.orderId === orderId || b.orderId?._id === orderId) &&
          b.vehicles?.some((bv: any) => String(bv.srNo) === srNo)
        );

        if (matchingBooking) {
          setStatus(matchingBooking.status || "Booked");
          const bv = matchingBooking.vehicles.find((bv: any) => String(bv.srNo) === srNo);
          setVehicleData(bv);
        } else {
          setStatus("New");
          const vehicles = order.vehicles?.filter(Boolean) || [];
          const vIdx = parseInt(searchParams.get("expandedIndex") || "0");
          setVehicleData(vehicles[vIdx]);
        }
      } catch (err) {
        console.error("Error loading vehicle details", err);
        toast.error("Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, srNo]);

  const InfoBox = ({ label, value, icon: Icon, mono }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className={`text-sm font-semibold text-[#2D3748] ${mono ? "font-mono" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );

  const StatusCard = ({ label, value, colorClass, statusColor }: any) => (
    <div className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colorClass}`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${statusColor.text}`}>
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${statusColor.bg} ${statusColor.glow}`}></div>
        <h3 className={`text-xl font-bold ${statusColor.heading}`}>
          {value}
        </h3>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Specs...</span>
    </div>
  );

  const getStatusConfig = (s: string) => {
    switch (s) {
      case "Booked": return {
        card: "bg-blue-50 border-blue-100 hover:bg-blue-100",
        text: "text-blue-600",
        bg: "bg-blue-500",
        glow: "shadow-[0_0_10px_rgba(59,130,246,0.4)] animate-pulse",
        heading: "text-blue-900"
      };
      case "PI Created": return {
        card: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100",
        text: "text-emerald-600",
        bg: "bg-emerald-500",
        glow: "shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse",
        heading: "text-emerald-900"
      };
      case "LC Received": return {
        card: "bg-purple-50 border-purple-100 hover:bg-purple-100",
        text: "text-purple-600",
        bg: "bg-purple-500",
        glow: "shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse",
        heading: "text-purple-900"
      };
      case "Invoice Created": return {
        card: "bg-orange-50 border-orange-100 hover:bg-orange-100",
        text: "text-orange-600",
        bg: "bg-orange-500",
        glow: "shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse",
        heading: "text-orange-900"
      };
      default: return {
        card: "bg-gray-50 border-gray-100 hover:bg-gray-100",
        text: "text-gray-600",
        bg: "bg-gray-500",
        glow: "",
        heading: "text-gray-900"
      };
    }
  };

  const statusConfig = getStatusConfig(status);
  const vehicleName = vehicleData?.name || searchParams.get("name") || "Unknown Model";
  const vehicleColor = vehicleData?.color || searchParams.get("color") || "Unknown";

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors uppercase">
            UNIT-{srNo}
          </span>
        </div>

        <button
          onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-[#1B2559]">Vehicle Details</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Info size={14} /> System Verified
              </div>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105 border border-indigo-100">
                  <Car size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">Model / variant</p>
                  <h3 className="text-2xl font-bold text-[#2D3748] group-hover:text-indigo-600 transition-colors">{vehicleName}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoBox label="HSN Code" value={vehicleData?.hsnCode} icon={Hash} />
                <InfoBox label="Chassis Number" value={vehicleData?.chassisNo} icon={Hash} mono />
                <InfoBox label="Engine Number" value={vehicleData?.engineNo} icon={Package} mono />
                <InfoBox label="Color" value={vehicleColor} icon={Palette} />
                <InfoBox label="Fuel Type" value={vehicleData?.fuelType} icon={Fuel} />
                <InfoBox label="Origin" value={vehicleData?.countryOfOrigin} icon={Globe} />
                <InfoBox label="Manufacture Year" value={vehicleData?.yom} icon={Calendar} />
                <InfoBox label="Engine Capacity" value={vehicleData?.engineCapacity} icon={Package} />
                <InfoBox 
                  label="Status" 
                  value={status} 
                  icon={Info} 
                />
              </div>
            </div>
          </div>

          {/* SECONDARY CARD: Pricing/Freight */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <DollarSign size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Financial Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl group hover:bg-white transition-all duration-300 hover:shadow-md">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">FOB Amount</p>
                <p className="text-3xl font-black text-indigo-600">
                  {vehicleData?.fobAmount ? `$${Number(vehicleData.fobAmount).toLocaleString()}` : "-"}
                </p>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white transition-all duration-300 hover:shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Freight Charges</p>
                <p className="text-3xl font-black text-slate-700">
                  {vehicleData?.freight ? `$${Number(vehicleData.freight).toLocaleString()}` : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Cards */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          <StatusCard 
            label="Current Status" 
            value={status} 
            colorClass={statusConfig.card} 
            statusColor={statusConfig} 
          />

          <div className="bg-[#EBF8FF] rounded-2xl p-5 border border-[#BEE3F8] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#BEE3F8]/30 group">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors group-hover:text-blue-900">
              <Package size={12} /> Unit Index
            </p>
            <h3 className="text-3xl font-black text-blue-800 leading-none group-hover:scale-105 transition-transform origin-left">
              #{srNo}
            </h3>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white group cursor-default">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Order Reference</p>
            <h3 className="text-xs font-mono font-bold text-slate-700 break-all">
              {orderId}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleView;
