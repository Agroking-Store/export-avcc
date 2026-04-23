import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Car,
  ClipboardList,
  Eye,
  FilePenLine,
  Hash,
  Package,
  PlusCircle,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";
import { bookingApi } from "../../../services/bookingApi";
import {
  VehicleOrderItem,
  vehicleManagementApi,
} from "../vehicleManagementApi";

const STATUS_ORDER: Record<string, number> = {
  "To be Sourced": 0,
  Booked: 1,
  "Payment Done": 2,
  Transit: 3,
  "JNPT Warehouse": 4,
  Shipped: 5,
  "Commercial Invoice Submitted": 6,
};

const getValidNextStatuses = (currentStatus: string): string[] => {
  const currentIndex = STATUS_ORDER[currentStatus];
  const validNext: string[] = [currentStatus];
  if (currentIndex + 1 <= 6) {
    const nextStatus = Object.keys(STATUS_ORDER).find(
      (key) => STATUS_ORDER[key] === currentIndex + 1,
    );
    if (nextStatus) validNext.push(nextStatus);
  }
  return validNext.filter((status) => status !== "To be Sourced");
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Booked":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Payment Done":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Transit":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "JNPT Warehouse":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Shipped":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Commercial Invoice Submitted":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

interface StatusPopupProps {
  vehicle: { srNo: string; name: string; expandedIndex: number };
  currentStatus: string;
  onClose: () => void;
  onSave: (expandedIndex: number, newStatus: string) => Promise<void>;
}

const StatusPopup = ({
  vehicle,
  currentStatus,
  onClose,
  onSave,
}: StatusPopupProps) => {
  const [selected, setSelected] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selected === currentStatus) {
      onClose();
      return;
    }
    setSaving(true);
    await onSave(vehicle.expandedIndex, selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-80 p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-sm font-bold text-gray-800">Update vehicle status</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Unit #{vehicle.srNo} - {vehicle.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {getValidNextStatuses(currentStatus).map((status) => (
            <button
              key={status}
              onClick={() => setSelected(status)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${
                selected === status
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected === currentStatus}
            className="flex-1 py-2.5 px-5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update status"}
          </button>
        </div>
      </div>
    </div>
  );
};

const VehicleOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<VehicleOrderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, string>>(
    {},
  );
  const [bookingMap, setBookingMap] = useState<Record<number, string>>({});
  const [statusPopup, setStatusPopup] = useState<{
    vehicle: { srNo: string; name: string; expandedIndex: number };
    currentStatus: string;
  } | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await vehicleManagementApi.getVehicleOrderById(id as string);
        setOrder(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadOrder();
  }, [id]);

  useEffect(() => {
    const loadStatuses = async () => {
      if (!order || !id) return;
      try {
        const res = await bookingApi.getAll();
        const bookings = res.data?.data || res.data || [];
        const statusMap: Record<number, string> = {};
        const map: Record<number, string> = {};

        for (let i = 0; i < order.quantity; i++) {
          const srNo = String(i + 1);
          const booking = bookings.find(
            (item: any) =>
              (item.orderId === id || item.orderId?._id === id) &&
              item.vehicles?.some((vehicle: any) => String(vehicle.srNo) === srNo),
          );
          statusMap[i] = booking ? booking.status : "To be Sourced";
          if (booking) map[i] = booking._id;
        }

        setVehicleStatuses(statusMap);
        setBookingMap(map);
      } catch (error) {
        console.error("Error loading booking statuses", error);
      }
    };

    loadStatuses();
  }, [order, id]);

  const handleStatusUpdate = async (
    expandedIndex: number,
    newStatus: string,
  ) => {
    const bookingId = bookingMap[expandedIndex];
    if (!bookingId) {
      toast.error("Booking not found for this vehicle");
      return;
    }
    try {
      await bookingApi.update(bookingId, { status: newStatus });
      setVehicleStatuses((prev) => ({ ...prev, [expandedIndex]: newStatus }));
      toast.success("Status updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const expandedVehicles = useMemo(() => {
    if (!order) return [];
    return Array.from({ length: order.quantity }, (_, index) => ({
      expandedIndex: index,
      srNo: String(index + 1),
      name: `${order.vehicleSnapshot.brandName} ${order.vehicleSnapshot.modelName}`,
      color: order.vehicleSnapshot.color,
      variant: order.vehicleSnapshot.variant,
      status: vehicleStatuses[index] || "To be Sourced",
    }));
  }, [order, vehicleStatuses]);

  const bookedCount = expandedVehicles.filter(
    (vehicle) => vehicle.status !== "To be Sourced",
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Loading Order...
        </span>
      </div>
    );
  }

  if (!order) return null;

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

      <div className="w-full animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
            <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
              {order.orderNumber}
            </span>
          </div>

          <button
            onClick={() => navigate("/vehicles/orders")}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
          >
            <ArrowLeft size={18} />
            Back to Required Vehicles
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                <ClipboardList size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-[#1B2559]">
                  Required Vehicle Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2">
                    <User size={12} /> Client
                  </p>
                  <p className="text-sm font-semibold text-[#2D3748]">
                    {order.clientSnapshot.name}
                  </p>
                </div>
                <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Car size={12} /> Vehicle
                  </p>
                  <p className="text-sm font-semibold text-[#2D3748]">
                    {order.vehicleSnapshot.brandName} {order.vehicleSnapshot.modelName}
                  </p>
                </div>
                <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Calendar size={12} /> Order Date
                  </p>
                  <p className="text-sm font-semibold text-[#2D3748]">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-8 pb-4 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <Car size={20} className="text-emerald-500" />
                  <h2 className="text-xl font-bold text-[#1B2559]">
                    Individual Vehicles
                  </h2>
                </div>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                  {expandedVehicles.length} Units
                </span>
              </div>

              <div className="px-8 pb-8">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-center">
                    <thead className="bg-[#F8F9FB] text-[#A3AED0] uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-center">Unit #</th>
                        <th className="px-6 py-4 text-left">Model Summary</th>
                        <th className="px-6 py-4 text-left">Color / Variant</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expandedVehicles.map((vehicle) => {
                        const isBooked = vehicle.status !== "To be Sourced";

                        return (
                          <tr
                            key={vehicle.expandedIndex}
                            className="hover:bg-blue-50/40 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-black text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-100 transition-colors">
                                {vehicle.srNo}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-left font-bold text-gray-800">
                              {vehicle.name}
                            </td>
                            <td className="px-6 py-5 text-left">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm bg-slate-200"></div>
                                <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                                  {vehicle.color} - {vehicle.variant}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(vehicle.status)}`}
                              >
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    const params = new URLSearchParams({
                                      name: vehicle.name,
                                      color: vehicle.color,
                                      srNo: vehicle.srNo,
                                      expandedIndex: String(vehicle.expandedIndex),
                                      variant: vehicle.variant,
                                    });
                                    navigate(
                                      `/vehicles/orders/${id}/unit-view/${vehicle.expandedIndex}?${params.toString()}`,
                                    );
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                                    !isBooked
                                      ? "opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                      : "bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
                                  }`}
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>

                                {/* Edit Button - same as dealerorderdetails */}
                                <button
                                  onClick={() => {
                                    if (!isBooked) return;
                                    const params = new URLSearchParams({
                                      name: vehicle.name,
                                      color: vehicle.color,
                                      srNo: vehicle.srNo,
                                      expandedIndex: String(vehicle.expandedIndex),
                                      variant: vehicle.variant,
                                    });
                                    navigate(
                                      `/vehicles/orders/${id}/unit-edit/${vehicle.expandedIndex}?${params.toString()}`,
                                    );
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 hover:scale-110 ${
                                    !isBooked
                                      ? "opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                      : "bg-white border-slate-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                                  }`}
                                  title="Edit Vehicle"
                                >
                                  <FilePenLine size={18} />
                                </button>

                                <button
                                  onClick={() => {
                                    if (!isBooked) return;
                                    setStatusPopup({
                                      vehicle: {
                                        srNo: vehicle.srNo,
                                        name: vehicle.name,
                                        expandedIndex: vehicle.expandedIndex,
                                      },
                                      currentStatus: vehicle.status,
                                    });
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                                    !isBooked
                                      ? "opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                      : "bg-white border-slate-200 text-amber-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                                  }`}
                                  title="Update Status"
                                >
                                  <Zap size={18} />
                                </button>

                                <button
                                  onClick={() => {
                                    if (isBooked) return;
                                    const params = new URLSearchParams({
                                      name: vehicle.name,
                                      color: vehicle.color,
                                      srNo: vehicle.srNo,
                                      variant: vehicle.variant,
                                    });
                                    navigate(
                                      `/vehicles/orders/${id}/book/${vehicle.expandedIndex}?${params.toString()}`,
                                    );
                                  }}
                                  className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                                    isBooked
                                      ? "opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                      : "bg-white border-slate-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm"
                                  }`}
                                  title="Book Vehicle"
                                >
                                  <PlusCircle size={18} />
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
        </div>
      </div>
    </>
  );
};

export default VehicleOrderDetails;
