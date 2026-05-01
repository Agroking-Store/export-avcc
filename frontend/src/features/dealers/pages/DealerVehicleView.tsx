import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Car, Hash, Fuel, Globe, Calendar, 
  DollarSign, Package, ClipboardList, Info, Palette, Edit2, Users, UserCheck
} from "lucide-react";
import { toast } from "react-toastify";
import { bookingApi } from "../../../services/bookingApi";

interface VehicleData {
  name: string;
  color: string;
  hsnCode?: string;
  chassisNo?: string;
  engineNo?: string;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: number;
  fobAmount?: number;
  freight?: number;
  quantity?: number;
}

const DealerVehicleView = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const params = useParams();
  const orderId = params.id;
  const vehicleIndex = params.vehicleIndex;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const expandedIndex = parseInt(vehicleIndex || "0");
  const srNo = searchParams.get("srNo") || String(expandedIndex + 1);
  const vIdx = parseInt(searchParams.get("expandedIndex") || "0");

  const [orderVehicle, setOrderVehicle] = useState<VehicleData | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<any>(null);
  const [fullBooking, setFullBooking] = useState<any>(null);
  const [vehicleStatus, setVehicleStatus] = useState("New");
  const [loading, setLoading] = useState(true);
  const [orderId2, setOrderId2] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!orderId) {
          toast.error("Order ID missing");
          navigate("/dealers/orders");
          return;
        }
        const res = await axios.get(`${API_URL}/api/v1/orders/${orderId}`);
        const order = res.data.order || res.data;
        setOrderId2(order.orderId);

        const name = searchParams.get("name") || "";
        const color = searchParams.get("color") || "";

        const vehicles = order.vehicles?.filter(Boolean) || [];
        const rawVehicle = vehicles[vIdx] || { name, color };
        if (rawVehicle && !rawVehicle.name) rawVehicle.name = name;
        if (rawVehicle && !rawVehicle.color) rawVehicle.color = color;
        setOrderVehicle(rawVehicle);

        try {
          const bookingsRes = await bookingApi.getAll();
          const bookings = bookingsRes.data?.data || bookingsRes.data || [];
          const matchingBooking = bookings.find((b: any) => {
            if (b.status === "To be Sourced") return false;
            const bOrderId = typeof b.orderId === 'object' ? b.orderId?._id : b.orderId;
            if (bOrderId !== orderId) return false;
            return b.vehicles?.some(
              (bv: any) => String(bv.srNo) === String(srNo)
            );
          });

          if (matchingBooking) {
            setFullBooking(matchingBooking);
            setVehicleStatus(matchingBooking.status || "Booked");
            const bv = matchingBooking.vehicles.find(
              (bv: any) => String(bv.srNo) === String(srNo)
            );
            setBookingVehicle(bv || null);
          } else {
            setVehicleStatus("New");
          }
        } catch (bookingError: any) {
          toast.error(bookingError.response?.data?.message || "Failed to fetch booking data");
          setVehicleStatus("New");
        }
      } catch (orderError: any) {
        toast.error(orderError.response?.data?.message || "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, vIdx, srNo]);

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
      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Profile...</span>
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

  const statusConfig = getStatusConfig(vehicleStatus);
  const vehicle = bookingVehicle || orderVehicle;
  const displayName = vehicle?.name || searchParams.get("name") || "Vehicle";
  const displayColor = vehicle?.color || searchParams.get("color") || "";

  // Dealer display logic
  const dealerName = fullBooking?.dealerId?.name || fullBooking?.dealerId || "Not assigned";
  const bookingDateStr = fullBooking?.date ? new Date(fullBooking.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : "N/A";

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
          onClick={() => navigate(`/dealers/orders/${orderId}`)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md border-indigo-50/50">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-[#1B2559]">Vehicle Specification</h2>
              </div>
              <button
                onClick={() => navigate(`/dealers/orders/${orderId}/vehicle-edit/${expandedIndex}?${searchParams.toString()}`)}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                <Edit2 size={14} /> Edit Specs
              </button>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105 border border-indigo-100">
                  <Car size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">Model / variant</p>
                  <h3 className="text-2xl font-bold text-[#2D3748] group-hover:text-indigo-600 transition-colors">{displayName}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoBox label="HSN Code" value={vehicle?.hsnCode} icon={Hash} />
                <InfoBox label="Chassis Number" value={vehicle?.chassisNo} icon={Hash} mono />
                <InfoBox label="Engine Number" value={vehicle?.engineNo} icon={Package} mono />
                <InfoBox label="Color" value={displayColor} icon={Palette} />
                <InfoBox label="Fuel Type" value={vehicle?.fuelType} icon={Fuel} />
                <InfoBox label="Origin" value={vehicle?.countryOfOrigin} icon={Globe} />
                <InfoBox label="Manufacture Year" value={vehicle?.yom} icon={Calendar} />
                <InfoBox label="Engine Capacity" value={vehicle?.engineCapacity} icon={Package} />
                <InfoBox 
                  label="Internal Status" 
                  value={vehicleStatus} 
                  icon={Info} 
                />
              </div>
            </div>
          </div>

          {/* DEALER ASSIGNMENT CARD (Only show if booked) */}
          {fullBooking && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md border-emerald-50/50">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <UserCheck size={18} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-[#1B2559]">Booking Assignment</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group bg-[#F8F9FB] border border-emerald-100/50 rounded-xl p-4 transition-all duration-300 hover:bg-emerald-50/30">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Users size={12} /> Assigned Dealer
                  </p>
                  <p className="text-base font-bold text-gray-800">
                    {dealerName}
                  </p>
                </div>
                <div className="group bg-[#F8F9FB] border border-emerald-100/50 rounded-xl p-4 transition-all duration-300 hover:bg-emerald-50/30">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Calendar size={12} /> Confirmed Date
                  </p>
                  <p className="text-base font-bold text-gray-800">
                    {bookingDateStr}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECONDARY CARD: Pricing */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <DollarSign size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Financial Data</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl group hover:bg-white transition-all duration-300 hover:shadow-md">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">FOB Amount</p>
                <p className="text-3xl font-black text-indigo-600">
                  {vehicle?.fobAmount ? `$${Number(vehicle.fobAmount).toLocaleString()}` : "-"}
                </p>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white transition-all duration-300 hover:shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Freight Charges</p>
                <p className="text-3xl font-black text-slate-700">
                  {vehicle?.freight ? `$${Number(vehicle.freight).toLocaleString()}` : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Cards */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          <StatusCard 
            label="Booking Status" 
            value={vehicleStatus} 
            colorClass={statusConfig.card} 
            statusColor={statusConfig} 
          />

          <div className="bg-[#EBF8FF] rounded-2xl p-5 border border-[#BEE3F8] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#BEE3F8]/30 group">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors group-hover:text-blue-900">
              <Package size={12} /> Unit No.
            </p>
            <h3 className="text-3xl font-black text-blue-800 leading-none group-hover:scale-105 transition-transform origin-left">
              #{srNo}
            </h3>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white group cursor-default">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Order Reference</p>
            <h3 className="text-xs font-mono font-bold text-slate-700 break-all">
              {orderId2 || `#${orderId?.slice(-6)}`}
            </h3>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer" onClick={() => navigate(`/dealers/orders/${orderId}`)}>
            <div className="flex items-center justify-between">
               <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">Navigation</p>
               <ArrowLeft size={12} className="text-indigo-200" />
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Return to Listing
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DealerVehicleView;