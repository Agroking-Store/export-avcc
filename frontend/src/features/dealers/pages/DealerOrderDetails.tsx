import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Eye, Edit2, Car, Calendar, 
  Hash, ClipboardList, TrendingUp, Package, 
  Clock, CheckCircle, PlusCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { bookingApi } from "../../../services/bookingApi";

const DealerOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [vehicleStatuses, setVehicleStatuses] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order) fetchVehicleStatuses();
  }, [order]);

  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'true' && order) {
      const timer = setTimeout(() => {
        fetchVehicleStatuses().then(() => {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('refresh');
          window.history.replaceState(null, '', window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : ''));
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/v1/orders/${id}`);
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

  const fetchVehicleStatuses = async () => {
    try {
      const res = await bookingApi.getAll();
      const bookings = res.data?.data || res.data || [];
      const statusMap: {[key: string]: string} = {};
      
      if (order?.vehicles) {
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: any) => {
          const qty = v.quantity ?? 1;
          for (let qIdx = 0; qIdx < qty; qIdx++) {
            const expandedIndex = globalIndex++;
            const booking = bookings.find((b: any) => 
              b.orderId === id && 
              b.vehicles.some((bv: any) => String(bv.srNo) === String(expandedIndex + 1))
            );
            statusMap[expandedIndex] = booking ? (booking.status || "Booked") : "New";
          }
        });
      }
      setVehicleStatuses(statusMap);
    } catch (error) {
      console.error("Error fetching vehicle statuses", error);
      if (order?.vehicles) {
        const statusMap: {[key: string]: string} = {};
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: any) => {
          const qty = v.quantity ?? 1;
          for (let qIdx = 0; qIdx < qty; qIdx++) {
            statusMap[globalIndex++] = "New";
          }
        });
        setVehicleStatuses(statusMap);
      }
    }
  };

  const vehicleGroups = (() => {
    if (!order?.vehicles) return [];
    const groups: { [key: string]: { name: string; color: string; total: number; booked: number; piGenerated: number; available: number } } = {};
    
    order.vehicles.filter(Boolean).forEach((v: any) => {
      const qty = v.quantity ?? 1;
      const name = v.name || "Unknown";
      const color = v.color || "#6b7280";
      
      if (!groups[name]) {
        groups[name] = { name, color, total: 0, booked: 0, piGenerated: 0, available: 0 };
      }
      groups[name].total += qty;
      
      if (order.status === "Confirmed") groups[name].booked += qty;
      else if (order.status === "PI Generated") groups[name].piGenerated += qty;
      else if (order.status === "New" || order.status === "Draft") groups[name].available += qty;
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
        result.push({
          expandedIndex,
          srNo: String(expandedIndex + 1),
          name: v.name || "",
          color: v.color || "",
        });
        expandedIndex++;
      }
    });
    return result;
  })();

  const getStatusColor = (s: string) => {
    switch (s) {
      case "New": return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      case "Booked": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "PI Created": return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "LC Received": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
      case "Invoice Created": return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      default: return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest ml-4">Loading Order Details...</span>
      </div>
    );
  }

  if (!order) {
    return <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">Order not found</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 transition-colors">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="bg-[#1e293b] px-6 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <Hash size={16} className="text-indigo-400 mr-2" />
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {order.orderId}
          </span>
        </div>

        <button
          onClick={() => navigate("/dealers/orders")}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-indigo-600 active:scale-95"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-9 space-y-8">
          
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-8 pb-4 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
              <div className="flex items-center gap-3">
                <Car size={20} className="text-emerald-500" />
                <h2 className="text-xl font-bold text-[#1B2559] dark:text-white">Order Vehicles</h2>
              </div>
              <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                {expandedVehicles.length} Units
              </span>
            </div>
            
            <div className="px-8 pb-8 space-y-6 mt-4">
              {/* Status Summary */}
              {vehicleGroups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleGroups.map((group, index) => (
                    <div key={index} className="bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-5 border border-[#F1F3F6] dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-inner" style={{ backgroundColor: group.color }}></div>
                        <span className="font-bold text-[#2D3748] dark:text-white">{group.name}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-gray-500">({group.total}x)</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <Package size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-slate-500 uppercase">Booked: <span className="text-blue-600">{group.booked}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-500 uppercase">Avail: <span className="text-emerald-600">{group.available}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-center">
                  <thead className="bg-[#F8F9FB] dark:bg-gray-800 text-[#A3AED0] dark:text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-center">Unit #</th>
                      <th className="px-6 py-4 text-left">Model Summary</th>
                      <th className="px-6 py-4 text-left">Color Build</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {expandedVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No vehicles in this order</td>
                      </tr>
                    ) : (
                      expandedVehicles.map((v: any) => {
                        const vStatus = vehicleStatuses[v.expandedIndex] || 'New';
                        const isBooked = vStatus !== 'New' && vStatus !== 'Draft';

                        return (
                          <tr key={v.expandedIndex} className="hover:bg-blue-50/40 dark:hover:bg-gray-800/50 transition-colors group">
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-black text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-100 transition-colors">
                                {v.srNo}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-left font-bold text-gray-800 dark:text-gray-200">
                              {v.name}
                            </td>
                            <td className="px-6 py-5 text-left">
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
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(vStatus)}`}>
                                {vStatus}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    if (!isBooked) return;
                                    const params = new URLSearchParams({ name: v.name, color: v.color, srNo: v.srNo, expandedIndex: String(v.expandedIndex) });
                                    navigate(`/dealers/orders/${id}/vehicle-view/${v.expandedIndex}?${params.toString()}`);
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${!isBooked ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm'}`}
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!isBooked) return;
                                    const params = new URLSearchParams({ name: v.name, color: v.color, srNo: v.srNo, expandedIndex: String(v.expandedIndex) });
                                    navigate(`/dealers/orders/${id}/vehicle-edit/${v.expandedIndex}?${params.toString()}`);
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${!isBooked ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm'}`}
                                  title="Edit Vehicle"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (isBooked) return;
                                    const params = new URLSearchParams({ name: v.name, color: v.color, srNo: v.srNo });
                                    navigate(`/dealers/booking/${id}/${v.expandedIndex}?${params.toString()}&refresh=true`);
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${isBooked ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-white hover:bg-[#5243EF] hover:border-[#5243EF] hover:shadow-md'}`}
                                  title="Book Vehicle"
                                >
                                  <PlusCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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

          <div className="bg-[#EBFDF5] dark:bg-emerald-900/20 rounded-3xl p-6 border border-[#D1FAE5] dark:border-emerald-800/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} /> Order Volume
            </p>
            <h3 className="text-4xl font-black text-emerald-800 dark:text-emerald-300 leading-none">
              {expandedVehicles.length}
            </h3>
            <p className="text-xs font-bold text-emerald-500 dark:text-emerald-600 mt-2">Total Units</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DealerOrderDetails;
