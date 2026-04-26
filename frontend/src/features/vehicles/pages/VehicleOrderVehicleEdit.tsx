import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CalendarIcon, CheckCircle2, Fuel, Globe, Hash, Package, Truck, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "react-toastify";
import { vehicleManagementApi } from "../vehicleManagementApi";
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  const [engineCapacity, setEngineCapacity] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [yom, setYom] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [allBookings, setAllBookings] = useState<VehicleBookingItem[]>([]);

  const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"];
  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const validateChassis = (value: string) => /^[A-Z0-9]{17}$/i.test(value.trim());
  const validateEngine = (value: string) => /^[A-Z0-9]{6,20}$/i.test(value.trim());

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

        // Client can be allotted at any moment; no restriction on engine/chassis entry

        setOrder(orderRes);
        setBooking(currentBooking);
        setAllBookings(bookingRes);
        setEngineNumber(currentBooking?.engineNumber || "");
        setChassisNumber(currentBooking?.chassisNumber || "");
        setDeliveryDate(currentBooking?.deliveryDate ? currentBooking.deliveryDate.split("T")[0] : "");
        setEngineCapacity(currentBooking?.engineCapacity || "");
        setFuelType(currentBooking?.fuelType || "");
        setCountryOfOrigin(currentBooking?.countryOfOrigin || "");
        setYom(currentBooking?.yom || "");
        setHsnCode(currentBooking?.hsnCode || "");
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

    const eng = engineNumber.trim().toUpperCase();
    const chassis = chassisNumber.trim().toUpperCase();

    if (!validateEngine(eng)) {
      toast.error("Engine number must be 6-20 alphanumeric characters");
      return;
    }
    if (!validateChassis(chassis)) {
      toast.error("Chassis number must be exactly 17 alphanumeric characters");
      return;
    }

    const duplicateEngine = allBookings.find(
      (b) => b._id !== booking._id && b.engineNumber?.toUpperCase() === eng,
    );
    const duplicateChassis = allBookings.find(
      (b) => b._id !== booking._id && b.chassisNumber?.toUpperCase() === chassis,
    );

    if (duplicateEngine) {
      toast.error(`Engine number already used by Unit ${duplicateEngine.vehicleIndex + 1}`);
      return;
    }
    if (duplicateChassis) {
      toast.error(`Chassis number already used by Unit ${duplicateChassis.vehicleIndex + 1}`);
      return;
    }

    try {
      setSaving(true);
      const updated = await vehicleBookingApi.updateChassisEngine(booking._id, {
        engineNumber: eng,
        chassisNumber: chassis,
        deliveryDate: deliveryDate || undefined,
        engineCapacity: engineCapacity || undefined,
        fuelType: fuelType || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        yom: yom || undefined,
        hsnCode: hsnCode || undefined,
      });

      setBooking(updated);
      toast.success(
        updated.status === "chassis_received"
          ? "Engine and chassis numbers saved. Vehicle is now in transit."
          : "Vehicle details updated",
      );
      navigate(`/vehicles/orders`);
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
      navigate(`/vehicles/orders`);
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
          onClick={() => navigate(`/vehicles/orders`)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Package size={14} className="text-amber-500" />
              Engine Number
            </label>
            <input
              type="text"
              value={engineNumber}
              onChange={(event) => setEngineNumber(event.target.value.toUpperCase())}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. G3LCSM578833"
              maxLength={20}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">Sample: G3LCSM578833</p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Truck size={14} className="text-emerald-500" />
              Chassis Number
            </label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(event) => setChassisNumber(event.target.value.toUpperCase())}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. MALFK81AVSD035213"
              maxLength={17}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">Sample: MALFK81AVSD035213</p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Hash size={14} className="text-indigo-500" />
              HSN Code
            </label>
            <input
              type="text"
              value={hsnCode}
              onChange={(event) => setHsnCode(event.target.value.toUpperCase())}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. 8703.21.69"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Fuel size={14} className="text-orange-500" />
              Fuel Type
            </label>
            <Popover open={fuelOpen} onOpenChange={setFuelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    inputStyle,
                    "flex items-center justify-between cursor-pointer",
                  )}
                >
                  <span className={fuelType ? "text-[#4A5568] dark:text-gray-200" : "text-[#A0AEC0]"}>
                    {fuelType || "Select fuel type..."}
                  </span>
                  <ChevronsUpDown size={16} className="text-[#A0AEC0]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search fuel type..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No fuel type found.</CommandEmpty>
                    <CommandGroup>
                      {fuelTypes.map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={() => {
                            setFuelType(type);
                            setFuelOpen(false);
                          }}
                        >
                          {type}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              fuelType === type ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Globe size={14} className="text-blue-500" />
              Country of Origin
            </label>
            <input
              type="text"
              value={countryOfOrigin}
              onChange={(event) => setCountryOfOrigin(event.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Japan, India, Germany"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Calendar size={14} className="text-rose-500" />
              Year of Manufacture (YOM)
            </label>
            <input
              type="text"
              value={yom}
              onChange={(event) => setYom(event.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. 2024"
              maxLength={4}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Package size={14} className="text-purple-500" />
              Engine Capacity
            </label>
            <input
              type="text"
              value={engineCapacity}
              onChange={(event) => setEngineCapacity(event.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. 1498 cc"
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
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            Save Details
          </button>

          {booking.status === "chassis_received" && (
            <button
              type="button"
              onClick={markDelivered}
              disabled={saving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
