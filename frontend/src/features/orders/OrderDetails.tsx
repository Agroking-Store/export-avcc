import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../config/apiConfig";
import { 
  Phone, Mail, Building2, MapPin, 
  Calendar, Package, ClipboardList,
  ArrowLeft, Car, User
} from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "-";
    const parts = [
      address.houseBuilding, address.streetArea, address.cityTown,
      address.state, address.pincode, address.country,
    ].filter(Boolean);
    return parts.join(", ") || "-";
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Order...</span>
    </div>
  );

  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  const totalQty = order.vehicles?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {order.orderId}
          </span>
        </div>

        <button
          onClick={() => navigate("/orders/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Order & Client Details */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* CLIENT INFORMATION CARD */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 transition-shadow hover:shadow-md">            
              <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-2">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">
                Client Details
              </h2>
            </div>
          
            <div className="flex flex-col md:flex-row items-start gap-3">
              {/* Avatar with Hover Effect */}
              <div className="group w-14 h-14 shrink-0 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-black shadow-inner transition-all duration-300 hover:scale-105">
                {order.clientId?.name?.charAt(0) || "C"}
              </div>
          
              {/* Content */}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2">
                   <User size={20} className="text-indigo-500" />
                   <h3 className="text-xl font-bold text-slate-800">
                     {order.clientId?.name || "N/A"}
                   </h3>
                </div>
          
                <div className="flex items-center gap-2 text-slate-500 font-medium mt-0.5">
                  <Building2 size={16} className="text-slate-400" />
                  <span>{order.clientId?.companyName || "No Organization"}</span>
                </div>
          
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  
                  {/* Contact Number Box */}
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 hover:bg-white hover:border-[#005A9C]/30 hover:shadow-md hover:-translate-y-1">
                    <Phone size={16} className="text-slate-400 transition-colors group-hover:text-[#005A9C]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-hover:text-[#005A9C]">Contact Number</span>
                      <span className="font-semibold text-slate-700">{order.clientId?.phone || "-"}</span>
                    </div>
                  </div>
          
                  {/* Email Address Box */}
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 hover:bg-white hover:border-[#005A9C]/30 hover:shadow-md hover:-translate-y-1">
                    <Mail size={16} className="text-slate-400 transition-colors group-hover:text-[#005A9C]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-hover:text-[#005A9C]">Email Address</span>
                      <span className="font-semibold text-slate-700">{order.clientId?.email || "-"}</span>
                    </div>
                  </div>
          
                  {/* Physical Address Box */}
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 hover:bg-white hover:border-[#005A9C]/30 hover:shadow-md hover:-translate-y-1 md:col-span-2">
                    <MapPin size={16} className="text-slate-400 transition-colors group-hover:text-[#005A9C]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-hover:text-[#005A9C]">Physical Address</span>
                      <span className="font-semibold text-slate-700">{formatAddress(order.clientId?.address)}</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          {/* VEHICLES TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Car size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-[#1B2559]">Vehicles in Order</h2>
              </div>
              <span className="bg-gray-50 text-[10px] font-bold px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">
                {order.vehicles?.length || 0} Models
              </span>
            </div>
            
            <div className="px-6 md:px-8 pb-8">
              <div className="overflow-x-auto rounded-xl border border-gray-50">
                <table className="w-full">
                  <thead className="bg-[#F8F9FB] text-[#A3AED0] uppercase text-[9px] font-bold tracking-widest">
                    <tr>
                      <th className="px-5 py-4 text-left">#</th>
                      <th className="px-5 py-4 text-left">Model Name</th>
                      <th className="px-5 py-4 text-left">Color</th>
                      <th className="px-5 py-4 text-left">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.vehicles?.map((v: any, i: number) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-5 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                        <td className="px-5 py-4 font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{v.name}</td>
                        <td className="px-5 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {v.color}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-bold text-sm">
                          {v.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Stats */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          <div className="bg-[#FEE2E2] rounded-2xl p-5 border border-[#FECACA] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1.5 transition-colors group-hover:text-red-900">
              <Package size={12} /> Total Vehicles
            </p>
            <h3 className="text-4xl font-black text-red-800 leading-none transition-transform duration-300 group-hover:scale-105 origin-left">
              {totalQty}
            </h3>
          </div>

          <div className="bg-[#F0F5FF] rounded-2xl p-5 border border-[#D6E4FF] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors group-hover:text-indigo-900">
              <Calendar size={12} /> Order Date
            </p>
            <h3 className="text-lg font-bold text-indigo-900 transition-transform duration-300 group-hover:scale-105 origin-left">
              {new Date(order.date).toLocaleDateString()}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetails;