import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Car, Hash, Palette, User, Fuel, Globe, Calendar, DollarSign, Package } from "lucide-react";
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
        // Fetch order to get basic info if needed
        const orderRes = await axios.get(`http://localhost:5000/api/v1/orders/${orderId}`);
        const order = orderRes.data.order || orderRes.data;
        
        // Fetch bookings to get detailed info
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
          // Fallback to order vehicle info
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

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Booked": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "PI Created": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700";
      case "LC Received": return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700";
      case "Invoice Created": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700";
      default: return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const DetailRow = ({ icon: Icon, label, value, mono }: any) => (
    <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-5 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
       <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
         <Icon size={14} className="text-blue-500" /> {label}
       </p>
       <h3 className={`text-xl font-bold text-[#2D3748] dark:text-gray-100 ${mono ? "font-mono" : ""} ${!value ? "opacity-30 italic text-sm" : ""}`}>
         {value || "Not available"}
       </h3>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gathering technical specs...</p>
      </div>
    );
  }

  const vehicleName = vehicleData?.name || searchParams.get("name") || "Unknown Model";
  const vehicleColor = vehicleData?.color || searchParams.get("color") || "Unknown";

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 lg:p-10 animate-in fade-in duration-500">
      
      {/* Header and Back Button */}
      <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vehicle Snapshot</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed overview of unit build</p>
        </div>
        <button
           onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
           className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden max-w-3xl mx-auto transition-all hover:shadow-lg">
        
        {/* Dynamic Gradient Header */}
        <div className={`bg-gradient-to-br from-slate-800 to-slate-950 p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1">
                Vehicle Build Details
              </p>
              <h1 className="text-3xl font-black text-white tracking-tight">{vehicleName}</h1>
              <div className="mt-2 flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(status)}`}>
                   {status}
                 </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
              <Car className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="relative mt-8 flex flex-wrap items-center gap-3 text-white/95 text-[10px] font-bold">
            <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-sm flex items-center gap-2">
              <Hash size={12} className="text-blue-400" /> UNIT NO: {srNo}
            </span>
            <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-sm flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white/40 shadow-inner"
                style={{ backgroundColor: vehicleColor.toLowerCase() }}
              />
              <span className="uppercase tracking-widest">{vehicleColor}</span>
            </span>
            {vehicleData?.chassisNo && (
               <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-sm font-mono tracking-tighter">
                 {vehicleData.chassisNo}
               </span>
            )}
          </div>
        </div>

        {/* Info Content Section */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailRow icon={Hash} label="HSN Code" value={vehicleData?.hsnCode} />
            <DetailRow icon={Car} label="Chassis No" value={vehicleData?.chassisNo} mono />
            <DetailRow icon={Package} label="Engine No" value={vehicleData?.engineNo} mono />
            <DetailRow icon={Fuel} label="Fuel Type" value={vehicleData?.fuelType} />
            <DetailRow icon={Globe} label="Origin" value={vehicleData?.countryOfOrigin} />
            <DetailRow icon={Calendar} label="YOM" value={vehicleData?.yom} />
            <DetailRow icon={Package} label="Capacity" value={vehicleData?.engineCapacity} />
            <DetailRow 
              icon={DollarSign} 
              label="FOB Amount" 
              value={vehicleData?.fobAmount ? `$${Number(vehicleData.fobAmount).toLocaleString()}` : undefined} 
            />
            <DetailRow 
              icon={DollarSign} 
              label="Freight" 
              value={vehicleData?.freight ? `$${Number(vehicleData.freight).toLocaleString()}` : undefined} 
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-center">
             <button
               onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
               className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
             >
               <ArrowLeft size={18} />
               Back to Order
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VehicleView;

