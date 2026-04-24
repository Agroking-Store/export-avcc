import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { IClient } from "../clients.types";
import { 
  Phone, Mail, Building2, Globe, MapPin, 
  ShoppingCart, Calendar, Package, ClipboardList,
  ArrowLeft
} from "lucide-react";

interface ClientDetailsData {
  client: IClient;
  vehicleOrders: any[];
  totalVehicleOrders: number;
  lastBooking: string | null;
}

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ClientDetailsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/clients/${id}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching client", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const formatAddress = (address?: IClient["address"]): string => {
    if (!address) return "-";
    const addressParts = [
      address.houseBuilding,
      address.streetArea,
      address.cityTown,
      address.state,
      address.pincode,
      address.country,
    ].filter((part) => part && part.trim() !== "");
    return addressParts.length > 0 ? addressParts.join(", ") : "-";
  };

  const client = data?.client;
  const orders = data?.vehicleOrders || [];

  const InfoBox = ({ label, value, icon: Icon }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-3 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-[13px] font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Profile...</span>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION: ID and Back Button */}
      <div className="flex justify-between items-center mb-6">
        {/* ENLARGED CLIENT CODE TAG */}
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {client?.clientCode || "CL-000"}
          </span>
        </div>

        {/* EXTREME RIGHT BACK BUTTON */}
        <button
          onClick={() => navigate("/clients/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Client Information</h2>
            </div>

            <div className="space-y-4">
              <div className="group bg-[#F8F9FB] rounded-xl p-4 flex items-center gap-4 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-lg font-black border border-indigo-100 transition-transform group-hover:scale-105">
                  {client?.name?.charAt(0) || "C"}
                </div>
                <div>
  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">
    Client Name
  </p>

  <h3 className="text-lg font-bold text-[#2D3748] group-hover:text-indigo-600 transition-colors">
    {client?.name}
  </h3>

  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
    <Globe size={12} className="text-emerald-500" />
    {client?.address?.country || "-"}
  </p>
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <InfoBox label="Phone Number" value={client?.phone} icon={Phone} />
  <InfoBox label="Email Address" value={client?.email} icon={Mail} />
  <InfoBox label="Company Name" value={client?.companyName} icon={Building2} />
</div>

              <InfoBox label="Full Address" value={formatAddress(client?.address)} icon={MapPin} />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-[#1B2559]">Vehicle Orders</h2>
              </div>
              <span className="bg-gray-50 text-[10px] font-bold px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">
                {orders.length} Orders
              </span>
            </div>
            
            <div className="px-6 md:px-8 pb-8">
              <div className="overflow-x-auto rounded-xl border border-gray-50">
                <table className="w-full">
                  <thead className="bg-[#F8F9FB] text-[#A3AED0] uppercase text-[9px] font-bold tracking-widest">
                    <tr>
                      <th className="px-5 py-4 text-left">Order No</th>
                      <th className="px-5 py-4 text-left">Vehicle </th>
                      <th className="px-5 py-4 text-left">Chassis </th>
                      <th className="px-5 py-4 text-left">Status </th>
                      <th className="px-5 py-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order: any) => (
                      <tr
                        key={order._id}
                        className="hover:bg-indigo-50/30 transition-all"
                      >
                        <td className="px-5 py-4 font-bold text-indigo-500 text-sm">
                          {order.orderId?.orderNumber || "-"}
                        </td>
                  
                        <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                          {order.orderId?.vehicleSnapshot?.brandName}{" "}
                          {order.orderId?.vehicleSnapshot?.modelName}
                        </td>
                  
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {order.chassisNumber || "Pending"}
                        </td>
                  
                        <td className="px-5 py-4">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                            {order.status}
                          </span>
                        </td>
                  
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR CARDS */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          <div className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${client?.isActive ? 'bg-[#EBFDF5] border-[#D1FAE5] hover:bg-[#D1FAE5]' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${client?.isActive ? 'text-emerald-600' : 'text-red-600'}`}>Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${client?.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-red-500'}`}></div>
              <h3 className={`text-xl font-bold ${client?.isActive ? 'text-emerald-900' : 'text-red-900'}`}>
                {client?.isActive ? "Active" : "Inactive"}
              </h3>
            </div>
          </div>

          <div className="bg-[#FEE2E2] rounded-2xl p-5 border border-[#FECACA] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#FCA5A5]/20 group">
            <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1.5 transition-colors group-hover:text-red-900">
              <Package size={12} /> Total Vehicle Orders
            </p>
            <h3 className="text-3xl font-black text-red-800 leading-none group-hover:scale-105 transition-transform origin-left">
              {data?.totalVehicleOrders || 0}
            </h3>
          </div>

          <div className="bg-[#EBF8FF] rounded-2xl p-5 border border-[#BEE3F8] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-[#BEE3F8]/30 group">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors group-hover:text-blue-900">
              <Calendar size={12} /> Last Booking
            </p>
            <h3 className="text-lg font-bold text-blue-800 group-hover:scale-105 transition-transform origin-left">
              {data?.lastBooking
                ? new Date(data.lastBooking).toLocaleDateString()
                : "N/A"}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientDetails;