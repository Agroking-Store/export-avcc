import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Car, Hash, Palette, Fuel, Globe, Calendar, DollarSign, Package, Edit2 } from "lucide-react";
import { toast } from "react-toastify";
import { bookingApi } from "../../../services/bookingApi";

interface VehicleData {
  name: string;
  color: string;
  hsnCode?: string;
  chassisNo?: string;
  engineNo?: string;
  engineCapacity?: string;
  fuelType?: string;
  countryOfOrigin?: string;
  yom?: number;
  fobAmount?: number;
  freight?: number;
  quantity?: number;
}

const DealerVehicleView = () => {
const params = useParams();
const orderId = params.id;
const vehicleIndex = params.vehicleIndex;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const expandedIndex = parseInt(vehicleIndex || "0");
  const srNo = searchParams.get("srNo") || String(expandedIndex + 1);
const vIdx = parseInt(searchParams.get("expandedIndex") || "0");

  const [orderVehicle, setOrderVehicle] = useState<VehicleData | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<any>(null);
  const [vehicleStatus, setVehicleStatus] = useState("Draft");
  const [loading, setLoading] = useState(true);
  const [orderId2, setOrderId2] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Fetch the order
        if (!orderId) {
          toast.error("Order ID missing");
          navigate("/dealers/orders");
          return;
        }
        const res = await axios.get(`http://localhost:5000/api/v1/orders/${orderId}`);
        const order = res.data.order || res.data;
        setOrderId2(order.orderId);

        // Use searchParams name/color first for matching (robust)
        const name = searchParams.get("name") || "";
        const color = searchParams.get("color") || "";

        // Try order vehicle for context
        const vehicles = order.vehicles?.filter(Boolean) || [];
        const rawVehicle = vehicles[vIdx] || { name, color };
        if (rawVehicle && !rawVehicle.name) rawVehicle.name = name;
        if (rawVehicle && !rawVehicle.color) rawVehicle.color = color;
        setOrderVehicle(rawVehicle);

        // Fetch booking data - inner try for graceful fail
        try {
          const bookingsRes = await bookingApi.getAll();
          const bookings = bookingsRes.data?.data || bookingsRes.data || [];
          const matchingBooking = bookings.find((b: any) => {
            if (b.status !== "Booked") return false;
            if (b.orderId && b.orderId !== orderId) return false;
            return b.vehicles?.some(
              (bv: any) => String(bv.srNo) === String(srNo)
            );
          });

          if (matchingBooking) {
            setVehicleStatus("Booked");
            const bv = matchingBooking.vehicles.find(
              (bv: any) => String(bv.srNo) === String(srNo)
            );
            setBookingVehicle(bv || null);
          } else {
            setVehicleStatus("Draft");
          }
        } catch (bookingError) {
          console.warn("Booking data unavailable:", bookingError);
          setVehicleStatus("Draft");
        }
      } catch (orderError) {
        console.error("Order fetch failed:", orderError);
        toast.error("Order not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, vIdx]);

  const statusBadge =
    vehicleStatus === "Booked"
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    mono,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | number;
    mono?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="p-1.5 bg-gray-100 dark:bg-gray-700/60 rounded-lg mt-0.5 flex-shrink-0">
        <Icon size={14} className="text-gray-500 dark:text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-900 dark:text-white ${mono ? "font-mono tracking-wide" : ""} ${!value ? "text-gray-400 dark:text-gray-500 italic" : ""}`}>
          {value ? String(value) : "Not specified"}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-20 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading vehicle…
        </div>
      </div>
    );
  }

  const vehicle = bookingVehicle || orderVehicle;
  const displayName = vehicle?.name || searchParams.get("name") || "Vehicle";
  const displayColor = vehicle?.color || searchParams.get("color") || "";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(`/dealers/orders/${orderId}`)}
        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
      >
        <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
          <ArrowLeft size={15} />
        </span>
        <span className="text-sm font-medium">Back to Order</span>
      </button>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-white/20 shadow-inner flex-shrink-0"
              style={{ backgroundColor: displayColor.toLowerCase() || "#6b7280" }}
            />
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-0.5">Vehicle #{srNo}</p>
              <h1 className="text-2xl font-bold text-white leading-tight">{displayName}</h1>
              <p className="text-slate-300 text-sm capitalize mt-0.5">{displayColor || "—"}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-xs mb-1">Order</p>
            <p className="text-slate-300 text-sm font-semibold">{orderId2 || `#${orderId?.slice(-6)}`}</p>
            <span className={`inline-flex items-center px-2.5 py-1 mt-2 rounded-full text-xs font-semibold border ${statusBadge}`}>
              {vehicleStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Car size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Vehicle Information</h2>
        </div>
        <div className="px-6 divide-y divide-gray-100 dark:divide-gray-700">
          <DetailRow icon={Hash} label="HSN Code" value={vehicle?.hsnCode} />
          <DetailRow icon={Car} label="Chassis No" value={vehicle?.chassisNo} mono />
          <DetailRow icon={Package} label="Engine No" value={vehicle?.engineNo} mono />
          <DetailRow icon={Package} label="Engine Capacity" value={vehicle?.engineCapacity} />
          <DetailRow icon={Fuel} label="Fuel Type" value={vehicle?.fuelType} />
          <DetailRow icon={Globe} label="Country of Origin" value={vehicle?.countryOfOrigin} />
          <DetailRow icon={Calendar} label="Year of Manufacture" value={vehicle?.yom} />
          <DetailRow
            icon={DollarSign}
            label="FOB Amount"
            value={vehicle?.fobAmount ? `$${Number(vehicle.fobAmount).toLocaleString()}` : undefined}
          />
          <DetailRow
            icon={DollarSign}
            label="Freight"
            value={vehicle?.freight ? `$${Number(vehicle.freight).toLocaleString()}` : undefined}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
navigate(`/dealers/orders/${orderId}/vehicle-edit/${expandedIndex}?${params.toString()}`);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors"
        >
          <Edit2 size={14} />
          Edit Vehicle
        </button>
      </div>
    </div>
  );
};

export default DealerVehicleView;