import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  ArrowLeft,
  Eye,
  Edit2,
  Phone,
  Building2,
  MapPin,
  Package,
  TrendingUp,
  Clock,
  ClipboardList,
  Car,
  Calendar,
  Hash
} from "lucide-react";
import { toast } from "react-toastify";

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

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
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const vehicleGroups = (() => {
    if (!order?.vehicles) return [];
    const groups: {
      [key: string]: {
        name: string;
        color: string;
        total: number;
        booked: number;
        piGenerated: number;
        available: number;
      };
    } = {};

    order.vehicles.filter(Boolean).forEach((v: any) => {
      const qty = v.quantity ?? 1;
      const name = v.name || "Unknown";
      const color = v.color || "#6b7280";

      if (!groups[name]) {
        groups[name] = {
          name,
          color,
          total: 0,
          booked: 0,
          piGenerated: 0,
          available: 0,
        };
      }

      groups[name].total += qty;

      if (order.status === "Confirmed") {
        groups[name].booked += qty;
      } else if (order.status === "PI Generated") {
        groups[name].piGenerated += qty;
      } else if (order.status === "Draft") {
        groups[name].available += qty;
      }
    });

    return Object.values(groups);
  })();

  const expandedVehicles = (() => {
    if (!order?.vehicles) return [];
    const result: any[] = [];
    let expandedIndex = 0;

    order.vehicles.filter(Boolean).forEach((v: any, vIdx: number) => {
      const qty = v.quantity ?? 1;
      for (let qIdx = 0; qIdx < qty; qIdx++) {
        const colorOverride = order.vehicleColors?.find(
          (vc: any) => vc.expandedIndex === expandedIndex,
        );
        result.push({
          expandedIndex,
          vehicleArrayIndex: vIdx,
          quantityIndex: qIdx,
          srNo: String(expandedIndex + 1),
          name: v.name || "",
          color: colorOverride ? colorOverride.color : v.color || "",
        });
        expandedIndex++;
      }
    });

    return result;
  })();

  const formatAddress = (address: any) => {
    if (!address) return "-";
    const parts = [
      address.houseBuilding,
      address.streetArea,
      address.cityTown,
      address.state,
      address.pincode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ") || "-";
  };

  const InfoBox = ({ label, value, icon: Icon }: any) => (
    <div className="group bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl p-4 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-blue-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-sm font-semibold text-[#2D3748] dark:text-gray-200">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest ml-4">Loading Details...</span>
      </div>
    );
  }

  if (!order) {
    return <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">Order not found</div>;
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#f8fafc] dark:bg-gray-950 animate-in fade-in duration-500 transition-colors">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="bg-[#1e293b] px-6 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <Hash size={16} className="text-blue-400 mr-2" />
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-blue-300 transition-colors">
            {order.orderId}
          </span>
        </div>

        <button
          onClick={() => navigate("/vehicles/list")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* CLIENT INFO */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-gray-800 pb-4">
              <ClipboardList size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold text-[#1B2559] dark:text-white">Client Snapshot</h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-black border border-blue-100 dark:border-blue-800">
                  {order.clientId?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-widest mb-1">Purchasing Client</p>
                  <h3 className="text-2xl font-bold text-[#2D3748] dark:text-white">{order.clientId?.name || "-"}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoBox label="Company" value={order.clientId?.companyName} icon={Building2} />
                <InfoBox label="Phone" value={order.clientId?.phone} icon={Phone} />
                <InfoBox label="Full Address" value={formatAddress(order.clientId?.address)} icon={MapPin} />
              </div>
            </div>
          </div>

          {/* VEHICLES EXPANDED */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-8 pb-4 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
              <div className="flex items-center gap-3">
                <Car size={20} className="text-emerald-500" />
                <h2 className="text-xl font-bold text-[#1B2559] dark:text-white">Individual Vehicles</h2>
              </div>
              <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                {expandedVehicles.length} Units
              </span>
            </div>
            
            <div className="px-8 pb-8">
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full">
                  <thead className="bg-[#F8F9FB] dark:bg-gray-800 text-[#A3AED0] dark:text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Unit #</th>
                      <th className="px-6 py-4 text-left">Model Summary</th>
                      <th className="px-6 py-4 text-left">Color Build</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {expandedVehicles.map((v: any) => (
                      <tr key={v.expandedIndex} className="hover:bg-blue-50/40 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-black text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-100 transition-colors">
                            {v.srNo}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">
                          {v.name}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                              style={{ backgroundColor: v.color.toLowerCase() }}
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              {v.color}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                const params = new URLSearchParams({
                                  name: v.name, color: v.color, srNo: v.srNo, expandedIndex: String(v.expandedIndex),
                                });
                                navigate(`/vehicles/view/${id}/view-vehicle/${v.expandedIndex}?${params.toString()}`);
                              }}
                              className="p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => {
                                const params = new URLSearchParams({
                                  name: v.name, color: v.color, srNo: v.srNo, expandedIndex: String(v.expandedIndex),
                                });
                                navigate(`/vehicles/view/${id}/edit-vehicle/${v.expandedIndex}?${params.toString()}`);
                              }}
                              className="p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
          
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-6 shadow-xl border border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Order Status
            </p>
            <h3 className={`text-2xl font-black ${status === 'Draft' ? 'text-yellow-400' : status === 'Confirmed' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {status}
            </h3>
          </div>

          <div className="bg-[#EBF8FF] dark:bg-blue-900/20 rounded-3xl p-6 border border-[#BEE3F8] dark:border-blue-800/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Execution Date
            </p>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200">
              {new Date(order.date || order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h3>
          </div>

          <div className="bg-[#FEE2E2] dark:bg-red-900/20 rounded-3xl p-6 border border-[#FECACA] dark:border-red-800/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <p className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} /> Order Volume
            </p>
            <h3 className="text-4xl font-black text-red-800 dark:text-red-300 leading-none">
              {expandedVehicles.length}
            </h3>
            <p className="text-xs font-bold text-red-400 dark:text-red-500 mt-2">Total Units</p>
          </div>

          {order.voucherNo && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                 <ClipboardList size={12} /> Voucher No
               </p>
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{order.voucherNo}</h3>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
