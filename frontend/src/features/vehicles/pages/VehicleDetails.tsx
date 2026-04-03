import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { ArrowLeft, Eye, Edit2, User, FileText, CheckCircle, Car, Phone, MapPin, Building, Package, TrendingUp, Clock } from "lucide-react";
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

  // Group vehicles by name and calculate status counts
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
      
      // Calculate based on order status
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
  
  // Expand vehicles by quantity into individual rows.
  const expandedVehicles = (() => {
    if (!order?.vehicles) return [];
    const result: any[] = [];
    let expandedIndex = 0;

    order.vehicles.filter(Boolean).forEach((v: any, vIdx: number) => {
      const qty = v.quantity ?? 1;
      for (let qIdx = 0; qIdx < qty; qIdx++) {
        const colorOverride = order.vehicleColors?.find(
          (vc: any) => vc.expandedIndex === expandedIndex
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

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Draft":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/vehicles/list")}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back to Vehicle list</span>
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
        {order.voucherNo && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <FileText size={14} />
              <span>Voucher No:</span>
              <span className="font-semibold text-white">{order.voucherNo}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Client Information
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shrink-0">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Name
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.clientId?.name || "-"}
                  </p>
                </div>
              </div>

              {order.clientId?.companyName && (
                <div className="flex items-start gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shrink-0">
                    <Building size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Company
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.clientId?.companyName}
                    </p>
                  </div>
                </div>
              )}

              {order.clientId?.phone && (
                <div className="flex items-start gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shrink-0">
                    <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Phone
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.clientId?.phone}
                    </p>
                  </div>
                </div>
              )}

              {order.clientId?.address && (
                <div className="flex items-start gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shrink-0">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Address
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.clientId?.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                {expandedVehicles.length} vehicle{expandedVehicles.length !== 1 ? "s" : ""}
              </span>
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
                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300" 
                          style={{ width: `${(group.booked / group.total) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-purple-500 h-full transition-all duration-300" 
                          style={{ width: `${(group.piGenerated / group.total) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-green-500 h-full transition-all duration-300" 
                          style={{ width: `${(group.available / group.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandedVehicles.length > 0 ? (
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expandedVehicles.map((v: any) => (
                      <tr
                        key={v.expandedIndex}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {v.srNo}
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
                              style={{ backgroundColor: v.color.toLowerCase() }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {v.color}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-150"
                              onClick={() => {
                                const params = new URLSearchParams({
                                  name: v.name,
                                  color: v.color,
                                  srNo: v.srNo,
                                  expandedIndex: String(v.expandedIndex),
                                });
                                navigate(
                                  `/vehicles/view/${id}/view-vehicle/${v.expandedIndex}?${params.toString()}`
                                );
                              }}
                            >
                              <Eye size={14} />
                              View
                            </button>
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors duration-150"
                              onClick={() => {
                                const params = new URLSearchParams({
                                  name: v.name,
                                  color: v.color,
                                  srNo: v.srNo,
                                  expandedIndex: String(v.expandedIndex),
                                });
                                navigate(
                                  `/vehicles/view/${id}/edit-vehicle/${v.expandedIndex}?${params.toString()}`
                                );
                              }}
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="font-medium">No vehicles in this order</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;