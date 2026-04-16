import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Car, Edit3, Hash, Palette, User, Settings } from "lucide-react";

const VehicleView = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleName = searchParams.get("name") || "";
  const vehicleColor = searchParams.get("color") || "";
  const srNo = searchParams.get("srNo") || "";
  const expandedIndex =
    searchParams.get("expandedIndex") || vehicleIndex || "0";

  // Generate a nice gradient based on color
  const getColorGradient = (color: string) => {
    const colorLower = color.toLowerCase();
    const gradients: Record<string, string> = {
      red: "from-red-500 to-red-600",
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      black: "from-gray-700 to-gray-900",
      white: "from-gray-300 to-gray-400",
      silver: "from-gray-400 to-gray-500",
      grey: "from-gray-500 to-gray-600",
      gray: "from-gray-500 to-gray-600",
      yellow: "from-yellow-500 to-yellow-600",
      orange: "from-orange-500 to-orange-600",
      purple: "from-purple-500 to-purple-600",
      brown: "from-amber-700 to-amber-800",
      beige: "from-amber-200 to-amber-300",
      gold: "from-amber-500 to-amber-600",
      pink: "from-pink-500 to-pink-600",
    };
    return gradients[colorLower] || "from-slate-500 to-slate-600";
  };

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
           className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden max-w-3xl mx-auto transition-all hover:shadow-lg">
        
        {/* Dynamic Gradient Header */}
        <div className={`bg-gradient-to-r ${getColorGradient(vehicleColor)} p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">
                Model Name
              </p>
              <h1 className="text-4xl font-black text-white tracking-tight">{vehicleName}</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
              <Car className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="relative mt-6 flex items-center gap-4 text-white/95 text-sm font-bold">
            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
              <Hash size={14} /> Unit No: {srNo}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white/80 shadow-inner"
                style={{ backgroundColor: vehicleColor.toLowerCase() }}
              />
              <span className="capitalize">{vehicleColor}</span>
            </span>
          </div>
        </div>

        {/* Info Content Section */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
               <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Hash size={14} className="text-blue-500" /> Serial Identifier
               </p>
               <h3 className="text-2xl font-bold text-[#2D3748] dark:text-gray-100">{srNo}</h3>
            </div>

            <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
               <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Car size={14} className="text-indigo-500" /> Vehicle Model
               </p>
               <h3 className="text-2xl font-bold text-[#2D3748] dark:text-gray-100">{vehicleName}</h3>
            </div>

            <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
               <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Palette size={14} className="text-emerald-500" /> Paint Job
               </p>
               <div className="flex items-center gap-3">
                 <div
                   className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-inner"
                   style={{ backgroundColor: vehicleColor.toLowerCase() }}
                 />
                 <h3 className="text-2xl font-bold text-[#2D3748] dark:text-gray-100 capitalize">{vehicleColor}</h3>
               </div>
            </div>

            <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
               <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <User size={14} className="text-orange-500" /> Assigned Dealer
               </p>
               <h3 className="text-lg font-bold text-[#2D3748] dark:text-gray-100 italic opacity-50">Not assigned</h3>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-4">
             <button
               onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
               className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
             >
               Close View
             </button>
             <button
               onClick={() => {
                 const params = new URLSearchParams({
                   name: vehicleName,
                   color: vehicleColor,
                   srNo,
                   expandedIndex,
                 });
                 navigate(
                   `/vehicles/view/${orderId}/edit-vehicle/${expandedIndex}?${params.toString()}`,
                 );
               }}
               className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
             >
               <Settings size={16} /> Manage Vehicle
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VehicleView;
