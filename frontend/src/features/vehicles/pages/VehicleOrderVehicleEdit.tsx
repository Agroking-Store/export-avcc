import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CalendarIcon, CheckCircle2, Package, Truck } from "lucide-react";
import { toast } from "react-toastify";
import { vehicleManagementApi } from "../vehicleManagementApi";
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const VehicleOrderVehicleEdit = () => {
  const { id, vehicleIndex } = useParams<{ id: string; vehicleIndex: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [booking, setBooking] = useState<VehicleBookingItem | null>(null);
  const [engineNumber, setEngineNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || vehicleIndex === undefined) return;

      try {
        setLoading(true);
        const [orderRes, bookingRes] = await Promise.all([
          vehicleManagementApi.getVehicleOrderById(id),
          vehicleBookingApi.getByOrder(id),
        ]);

        const currentBooking =
          bookingRes.find(
            (item) => item.vehicleIndex === Number(vehicleIndex),
          ) || null;

        if (currentBooking?.status === "payment_done" && !currentBooking.assignedClientId) {
          toast.error("Client must be allotted before adding engine/chassis details");
          navigate(`/vehicles/orders/${id}`);
          return;
        }

        setOrder(orderRes);
        setBooking(currentBooking);
        setEngineNumber(currentBooking?.engineNumber || "");
        setChassisNumber(currentBooking?.chassisNumber || "");
        setDeliveryDate(currentBooking?.deliveryDate ? currentBooking.deliveryDate.split("T")[0] : "");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, vehicleIndex]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!booking) return;
    if (!engineNumber.trim() || !chassisNumber.trim()) {
      toast.error("Engine number and chassis number are required");
      return;
    }

    try {
      setSaving(true);
      const updated = await vehicleBookingApi.updateChassisEngine(booking._id, {
        engineNumber: engineNumber.trim(),
        chassisNumber: chassisNumber.trim(),
        deliveryDate: deliveryDate || undefined,
      });

      setBooking(updated);
      toast.success(
        updated.status === "chassis_received"
          ? "Engine and chassis numbers saved. Vehicle is now in transit."
          : "Vehicle details updated",
      );
      navigate(`/vehicles/orders/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  const markDelivered = async () => {
    if (!booking) return;

    try {
      setSaving(true);
      await vehicleBookingApi.updateStatus(booking._id, "delivered");
      toast.success("Vehicle marked as delivered");
      navigate(`/vehicles/orders/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading vehicle details...
      </div>
    );
  }

  if (!order || !booking) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Vehicle booking details not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Unit {booking.vehicleIndex + 1}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {order.vehicleSnapshot.brandName} {order.vehicleSnapshot.modelName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.vehicleSnapshot.variant} · {order.vehicleSnapshot.color}
          </p>
        </div>

        <button
          onClick={() => navigate(`/vehicles/orders/${id}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Order
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Package size={16} />
              Engine Number
            </label>
            <input
              type="text"
              value={engineNumber}
              onChange={(event) => setEngineNumber(event.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              placeholder="Enter engine number"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Truck size={16} />
              Chassis Number
            </label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(event) => setChassisNumber(event.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              placeholder="Enter chassis number"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar size={16} />
              Date of Delivery
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={!engineNumber.trim() || !chassisNumber.trim()}
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={deliveryDate ? "text-slate-700" : "text-slate-400"}>
                    {!engineNumber.trim() || !chassisNumber.trim()
                      ? "Fill engine & chassis first"
                      : deliveryDate
                        ? new Date(deliveryDate).toLocaleDateString()
                        : "Select date..."}
                  </span>
                  <CalendarIcon size={16} className="text-slate-400" />
                </button>
              </PopoverTrigger>
              {engineNumber.trim() && chassisNumber.trim() && (
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={deliveryDate ? new Date(deliveryDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setDeliveryDate(date.toISOString().split("T")[0]);
                      } else {
                        setDeliveryDate("");
                      }
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              )}
            </Popover>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Current status: <span className="font-semibold text-slate-900">{booking.status}</span>
          <p className="mt-1">
            Once both engine and chassis numbers are saved after payment, status moves to
            <span className="font-semibold text-slate-900"> chassis_received</span>.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            Save Details
          </button>

          {booking.status === "chassis_received" && (
            <button
              type="button"
              onClick={markDelivered}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Truck size={16} />
              Mark Delivered
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleOrderVehicleEdit;
