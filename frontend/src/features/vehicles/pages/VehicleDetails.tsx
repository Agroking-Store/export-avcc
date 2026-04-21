import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";
import { bookingApi } from "../../../services/bookingApi";
import {
  ArrowLeft, Eye, Phone, Building2, MapPin,
  TrendingUp, ClipboardList, Car, Calendar, Hash, Zap, X
} from "lucide-react";
import { toast } from "react-toastify";

interface Vehicle {
  name?: string;
  color?: string;
  quantity?: number;
}

interface Order {
  _id?: string;
  orderId?: string;
  clientId?: {
    name?: string;
    companyName?: string;
    phone?: string;
    address?: any;
  };
  vehicles?: Vehicle[];
  vehicleColors?: { expandedIndex: number; color: string }[];
  status?: string;
  date?: string;
  createdAt?: string;
  voucherNo?: string;
}

const STATUS_OPTIONS = [
  "Booked",
  "Payment Done",
  "Transit",
  "JNPT Warehouse",
  "Shipped",
  "Commercial Invoice Submitted",
];

const STATUS_ORDER: { [key: string]: number } = {
  "To be Sourced": 0,
  "Booked": 1,
  "Payment Done": 2,
  "Transit": 3,
  "JNPT Warehouse": 4,
  "Shipped": 5,
  "Commercial Invoice Submitted": 6
};

const getValidNextStatuses = (currentStatus: string): string[] => {
  const currentIndex = STATUS_ORDER[currentStatus];
  const validNext: string[] = [currentStatus];
  if (currentIndex + 1 <= 6) {
    const nextStatus = Object.keys(STATUS_ORDER).find(key => STATUS_ORDER[key] === currentIndex + 1);
    if (nextStatus) validNext.push(nextStatus);
  }
  return validNext.filter(s => s !== "To be Sourced"); // exclude sourcing
};

interface StatusPopupProps {
  vehicle: { srNo: string; name: string; expandedIndex: number };
  currentStatus: string;
  onClose: () => void;
  onSave: (expandedIndex: number, newStatus: string) => Promise<void>;
}

const StatusPopup: React.FC<StatusPopupProps> = ({ vehicle, currentStatus, onClose, onSave }) => {
  const [selected, setSelected] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selected === currentStatus) { onClose(); return; }
    setSaving(true);
    await onSave(vehicle.expandedIndex, selected);
    setSaving(false);
    onClose();
  };

  // close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl w-80 p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Update vehicle status</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Unit #{vehicle.srNo} — {vehicle.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Status options */}
        <div className="space-y-2 mb-5">
          {getValidNextStatuses(currentStatus).map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${
                selected === s
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300"
                  : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
          {getValidNextStatuses(currentStatus).length === 1 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold text-center py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
              No further status updates available
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected === currentStatus}
            className="flex-2 flex-grow py-2.5 px-5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
            ) : (
              "Update status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, string>>({});
  const [bookingMap, setBookingMap] = useState<Record<number, string>>({});
  const [statusPopup, setStatusPopup] = useState<{
    vehicle: { srNo: string; name: string; expandedIndex: number };
    currentStatus: string;
  } | null>(null);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order) fetchVehicleStatuses();
  }, [order]);

  const getStatusColor = (s: string): string => {
    switch (s) {
      case "To be Sourced":
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      case "Booked":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "Payment Done":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      case "Transit":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800";
      case "JNPT Warehouse":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "Commercial Invoice Submitted":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

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

  const fetchVehicleStatuses = async () => {
    try {
      const res = await bookingApi.getAll();
      const bookings = res.data?.data || res.data || [];
      const statusMap: Record<number, string> = {};
      const bMap: Record<number, string> = {};

      if (order?.vehicles) {
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: Vehicle) => {
          const qty = v.quantity ?? 1;
          for (let i = 0; i < qty; i++) {
            const srNo = String(globalIndex + 1);
            const booking = bookings.find((b: any) =>
              (b.orderId === id || b.orderId?._id === id) &&
              b.vehicles?.some((bv: any) => String(bv.srNo) === srNo)
            );
            statusMap[globalIndex] = booking ? booking.status : "To be Sourced";
            if (booking) bMap[globalIndex] = booking._id;
            globalIndex++;
          }
        });
      }
      setVehicleStatuses(statusMap);
      setBookingMap(bMap);
    } catch (e) {
      console.error("Error fetching vehicle statuses", e);
      if (order?.vehicles) {
        const statusMap: Record<number, string> = {};
        let globalIndex = 0;
        order.vehicles.filter(Boolean).forEach((v: Vehicle) => {
          const qty = v.quantity ?? 1;
          for (let i = 0; i < qty; i++) statusMap[globalIndex++] = "To be Sourced";
        });
        setVehicleStatuses(statusMap);
      }
    }
  };

  const handleStatusUpdate = async (expandedIndex: number, newStatus: string) => {
    const bookingId = bookingMap[expandedIndex];
    if (!bookingId) {
      toast.error("Booking not found for this vehicle");
      return;
    }
    try {
      await bookingApi.update(bookingId, { status: newStatus });
      setVehicleStatuses((prev) => ({ ...prev, [expandedIndex]: newStatus }));
      toast.success("Status updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const expandedVehicles = (() => {
    if (!order?.vehicles) return [];
    const result: any[] = [];
    let expandedIndex = 0;

    order.vehicles.filter(Boolean).forEach((v: Vehicle, vIdx: number) => {
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
          status: vehicleStatuses[expandedIndex] || "To be Sourced",
        });
        expandedIndex++;
      }
    });

    return result;
  })();

  const formatAddress = (address: any): string => {
    if (!address) return "-";
    const parts = [
      address.houseBuilding, address.streetArea, address.cityTown,
      address.state, address.pincode, address.country,
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
    <>
      {statusPopup && (
        <StatusPopup
          vehicle={statusPopup.vehicle}
          currentStatus={statusPopup.currentStatus}
          onClose={() => setStatusPopup(null)}
          onSave={handleStatusUpdate}
        />
      )}

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
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 active:scale-95"
          >
            <ArrowLeft size={18} /> Back to List
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

            {/* VEHICLES TABLE */}
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
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {expandedVehicles.map((v: any) => {
                        const isBooked = v.status !== "To be Sourced";
                        return (
                          <tr key={v.expandedIndex} className="hover:bg-blue-50/40 dark:hover:bg-gray-800/50 transition-colors group">
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-black text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-100 transition-colors">
                                {v.srNo}
                              </span>
                            </td>
                            <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{v.name}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                                  style={{ backgroundColor: v.color }}
                                />
                                <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{v.color}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(v.status)}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-3">

                                {/* View */}
                                <button
                                  onClick={() => {
                                    const params = new URLSearchParams({
                                      name: v.name, color: v.color,
                                      srNo: v.srNo, expandedIndex: String(v.expandedIndex),
                                    });
                                    navigate(`/vehicles/view/${id}/view-vehicle/${v.expandedIndex}?${params.toString()}`);
                                  }}
                                  className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>

                                {/* Quick Status Update */}
                                <button
                                  onClick={() => {
                                    if (!isBooked) return;
                                    setStatusPopup({
                                      vehicle: { srNo: v.srNo, name: v.name, expandedIndex: v.expandedIndex },
                                      currentStatus: v.status,
                                    });
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 hover:scale-110 ${!isBooked ? "opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700" : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-amber-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow-sm"}`}
                                  title="Update Status"
                                >
                                  <Zap size={18} />
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-6 shadow-xl border border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order Status</p>
              <h3 className={`text-2xl font-black ${status === "Draft" ? "text-yellow-400" : status === "Confirmed" ? "text-blue-400" : "text-emerald-400"}`}>
                {status}
              </h3>
            </div>

            <div className="bg-[#EBF8FF] dark:bg-blue-900/20 rounded-3xl p-6 border border-[#BEE3F8] dark:border-blue-800/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar size={12} /> Execution Date
              </p>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200">
                {new Date(order.date || order.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </h3>
            </div>

            <div className="bg-[#FEE2E2] dark:bg-red-900/20 rounded-3xl p-6 border border-[#FECACA] dark:border-red-800/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <p className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} /> Order Volume
              </p>
              <h3 className="text-4xl font-black text-red-800 dark:text-red-300 leading-none">{expandedVehicles.length}</h3>
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
    </>
  );
};

export default VehicleDetails;