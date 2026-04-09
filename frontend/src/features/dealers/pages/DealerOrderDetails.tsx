import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import DealerNav from "../components/DealerNav";
import { ArrowLeft, Eye, Edit2, User, Car, Phone, MapPin, Building, Package, TrendingUp, Clock, Hash, Palette, CheckCircle } from "lucide-react";
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
    if (id) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    // Initial status fetch when order loads
    if (order) {
      fetchVehicleStatuses();
    }
  }, [order]);

  // Auto-refresh if coming from booking creation
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'true' && order) {
const timer = setTimeout(() => {
        fetchVehicleStatuses().then(() => {
          // Clear refresh param
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('refresh');
          window.history.replaceState(null, '', window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : ''));
        });
      }, 3000); // Increased to 3s for DB indexing
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
      // Fetch all bookings to check for vehicle matches
      // Since orders don't have a dealerId, we check all bookings
      const res = await bookingApi.getAll();
      const bookings = res.data?.data || res.data || [];
      console.log('DEBUG: Fetched bookings:', bookings);
      
      // Create a map of vehicle status based on bookings
      const statusMap: {[key: string]: string} = {};
      
      if (order?.vehicles) {
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: any, vIdx: number) => {
          const qty = v.quantity ?? 1;
          for (let qIdx = 0; qIdx < qty; qIdx++) {
            const expandedIndex = globalIndex++;
            
            // Check if this vehicle has a booking
            const hasBooking = bookings.some((booking: any) => {
              // Only count as booked if status is 'Booked'
              if (booking.status !== 'Booked') return false;
              
              // MUST strictly belong to this order. Old broken global data will be ignored.
              if (booking.orderId !== id) return false;
              
              return booking.vehicles.some((bv: any) => {
                const srNoMatch = String(bv.srNo) === String(expandedIndex + 1);
                return srNoMatch;
              });
            });
            
            statusMap[expandedIndex] = hasBooking ? "Booked" : "Draft";
          }
        });
      }
      
      console.log('DEBUG: Status map:', statusMap);
      setVehicleStatuses(statusMap);
    } catch (error) {
      console.error("Error fetching vehicle statuses", error);
      // Set all to Draft if there's an error
      if (order?.vehicles) {
        const statusMap: {[key: string]: string} = {};
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: any, vIdx: number) => {
          const qty = v.quantity ?? 1;
          for (let qIdx = 0; qIdx < qty; qIdx++) {
            const expandedIndex = globalIndex++;
            statusMap[expandedIndex] = "Draft";
          }
        });
        setVehicleStatuses(statusMap);
      }
    }
  };


  // Group vehicles by name and calculate status counts (mirroring VehicleDetails)
  const vehicleGroups = (() => {
    if (!order?.vehicles) return [];
    const groups: { [key: string]: { name: string; color: string; total: number; booked: number; piGenerated: number; available: number } } = {};
    
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
          available: 0
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

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Draft":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "Booked":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "Confirmed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "PI Generated":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-12">
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading order details...
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Order not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DealerNav />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/dealers/orders")}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back to Dealer Orders</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(order.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Order Title Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Order Number</p>
            <h1 className="text-3xl font-bold text-white">{order.orderId}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                status
              )}`}
            >
              <CheckCircle size={14} />
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Vehicles Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Car className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Vehicles
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                  {order.vehicles?.filter(Boolean).length || 0} vehicles
                </span>
              </div>
            </div>

            {/* Status Summary Cards */}
            {vehicleGroups.length > 0 && (
              <div className="mb-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status Summary
                </h3>
                {vehicleGroups.map((group, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }}></div>
                        <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">({group.total} total)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Booked</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{group.booked}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PI Generated</p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">{group.piGenerated}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">{group.available}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                   <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       Sr No
                     </th>
                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       Vehicle Name
                     </th>
                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       Color
                     </th>
                     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       Status
                     </th>
                     <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                       Actions
                     </th>
                   </tr>
                 </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    let globalIndex = 0;
                    return order.vehicles?.filter(Boolean).map((v: any, vIdx: number) => {
                      const qty = v.quantity ?? 1;
                      const rows = [];
                      for (let qIdx = 0; qIdx < qty; qIdx++) {
                        const expandedIndex = globalIndex++;
                        rows.push(
                        <tr
                          key={`${vIdx}-${qIdx}`}
                          className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                        >
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {expandedIndex + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {v.name}
                            </span>
                          </td>
                           <td className="px-4 py-4">
                             <div className="flex items-center gap-2">
                               <div
                                 className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                 style={{ backgroundColor: v.color?.toLowerCase() || '#6b7280' }}
                               />
                               <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                                 {v.color}
                               </span>
                             </div>
                           </td>
                           <td className="px-4 py-4">
                             <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicleStatuses[expandedIndex] || 'Draft')}`}>
                               {vehicleStatuses[expandedIndex] || 'Draft'}
                             </span>
                           </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-150 ${vehicleStatuses[expandedIndex] !== 'Booked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
onClick={() => {
                                  if (vehicleStatuses[expandedIndex] !== 'Booked') return;
                                  // View vehicle details - mirroring vehicle pattern
                                  const params = new URLSearchParams({
                                    name: v.name,
                                    color: v.color || '',
                                    srNo: String(expandedIndex + 1),
                                    expandedIndex: String(expandedIndex),
                                  });
navigate(`/dealers/orders/${id}/vehicle-view/${expandedIndex}?name=${encodeURIComponent(v.name)}&color=${encodeURIComponent(v.color || '')}&srNo=${expandedIndex + 1}&expandedIndex=${expandedIndex}`);
                                }}
                              >
                                <Eye size={14} />
                                View
                              </button>
                              <button
className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors duration-150 ${vehicleStatuses[expandedIndex] !== 'Booked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                onClick={() => {
                                  if (vehicleStatuses[expandedIndex] !== 'Booked') return;
                                  const params = new URLSearchParams({
                                    name: v.name,
                                    color: v.color || '',
                                    srNo: String(expandedIndex + 1),
                                    expandedIndex: String(expandedIndex),
                                  });
navigate(`/dealers/orders/${id}/vehicle-edit/${expandedIndex}?name=${encodeURIComponent(v.name)}&color=${encodeURIComponent(v.color || '')}&srNo=${expandedIndex + 1}&expandedIndex=${expandedIndex}`);
                                }}
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button
className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors duration-150 ${vehicleStatuses[expandedIndex] === 'Booked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
onClick={() => {
                                  if (vehicleStatuses[expandedIndex] === 'Booked') return;
                                  const params = new URLSearchParams({
                                    name: encodeURIComponent(v.name),
                                    color: encodeURIComponent(v.color || ''),
                                    srNo: String(expandedIndex + 1)
                                  });
                                  navigate(`/dealers/booking/${id}/${expandedIndex}?${params.toString()}&refresh=true`);
                                }}
                              >
                                Booking
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return rows;
                    });
                  })() || (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No vehicles in this order
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerOrderDetails;

