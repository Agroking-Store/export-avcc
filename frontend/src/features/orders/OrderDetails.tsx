import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../config/apiConfig";
import { toast } from "react-toastify";
import { 
  Phone, Mail, Building2, Globe, MapPin, 
  Calendar, Package, ClipboardList,
  ArrowLeft, RefreshCw, Car, Hash
} from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      setOrder(data);
      setStatus(data.status || "Draft");
    } catch (error) {
      console.error("Error fetching order", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await axios.put(`${apiConfig.baseURL}/orders/${id}`, { status: newStatus });
      setStatus(newStatus);
      navigate("/orders/list", {
        state: { success: "Order status updated successfully ✅" },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating status ❌");
    } finally {
      setUpdatingStatus(false);
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

  const InfoBox = ({ label, value, icon: Icon }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-sm font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Order & Client Details */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* CLIENT INFORMATION CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Client Details</h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-2xl font-black border border-blue-100">
                  {order.clientId?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">Purchasing Client</p>
                  <h3 className="text-2xl font-bold text-[#2D3748] transition-colors">{order.clientId?.name || "N/A"}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox label="Company" value={order.clientId?.companyName} icon={Building2} />
                <InfoBox label="Phone" value={order.clientId?.phone} icon={Phone} />
                <InfoBox label="Email" value={order.clientId?.email} icon={Mail} />
                <InfoBox label="Country" value={order.clientId?.country} icon={Globe} />
              </div>

              <InfoBox label="Full Shipping Address" value={formatAddress(order.clientId?.address)} icon={MapPin} />
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

        {/* RIGHT COLUMN: Sidebar Stats & Actions */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          
          {/* STATUS CONTROL CARD */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <RefreshCw size={12} /> Status Management
            </p>
            <div className="space-y-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updatingStatus}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="PI Generated">PI Generated</option>
              </select>
              <button
                onClick={() => updateStatus(status)}
                disabled={updatingStatus}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>

          {/* VOUCHER CARD */}
          <div className="bg-[#EBF8FF] rounded-2xl p-5 border border-[#BEE3F8] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Hash size={12} /> Voucher Number
            </p>
            <h3 className="text-xl font-black text-blue-900 truncate">
              {order.voucherNo || "N/A"}
            </h3>
          </div>

          {/* TOTAL QUANTITY CARD */}
          <div className="bg-[#FEE2E2] rounded-2xl p-5 border border-[#FECACA] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Package size={12} /> Total Vehicles
            </p>
            <h3 className="text-4xl font-black text-red-800 leading-none">
              {totalQty}
            </h3>
          </div>

          {/* DATE CARD */}
          <div className="bg-[#F0F5FF] rounded-2xl p-5 border border-[#D6E4FF] shadow-sm group transition-all hover:-translate-y-1 hover:shadow-lg">
            <p className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Order Date
            </p>
            <h3 className="text-lg font-bold text-indigo-900">
              {new Date(order.date).toLocaleDateString()}
            </h3>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;