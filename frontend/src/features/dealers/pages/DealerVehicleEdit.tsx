import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { bookingApi } from "../../../services/bookingApi";
import {
  ArrowLeft,
  Car,
  Hash,
  Package,
  Fuel,
  Globe,
  Calendar,
  DollarSign,
  X,
  CheckCircle2,
  Info,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";

// ── shadcn/ui imports ──────────────────────────────────────────────────────
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface VehicleForm {
  name: string;
  color: string;
  hsnCode: string;
  chassisNo: string;
  engineNo: string;
  engineCapacity: string;
  fuelType: string;
  countryOfOrigin: string;
  yom: number;
  fobAmount: number;
  freight: number;
  quantity: number;
  status: string;
}

const CHASSIS_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const API_URL = import.meta.env.VITE_API_BASE_URL;
const STATUS_ORDER: { [key: string]: number } = {
  "To be Sourced": 0,
  Booked: 1,
  "Payment Done": 2,
  Transit: 3,
  "JNPT Warehouse": 4,
  Shipped: 5,
  "Commercial Invoice Submitted": 6,
};

const STATUS_OPTIONS = [
  { value: "Booked", label: "Booked" },
  { value: "Payment Done", label: "Payment Done" },
  { value: "Transit", label: "Transit" },
  { value: "JNPT Warehouse", label: "JNPT Warehouse" },
  { value: "Shipped", label: "Shipped" },
  {
    value: "Commercial Invoice Submitted",
    label: "Commercial Invoice Submitted",
  },
];

const getValidNextStatuses = (
  currentStatus: string,
): { value: string; label: string }[] => {
  const currentIndex = STATUS_ORDER[currentStatus];
  const valid: { value: string; label: string }[] = [
    { value: currentStatus, label: currentStatus },
  ];
  if (currentIndex + 1 <= 6) {
    const nextKey = Object.keys(STATUS_ORDER).find(
      (k) => STATUS_ORDER[k as any] === currentIndex + 1,
    );
    if (nextKey) {
      valid.push({ value: nextKey, label: nextKey });
    }
  }
  return valid.filter((s) => s.value !== "To be Sourced");
};

const DealerVehicleEdit = () => {
  const params = useParams();
  const orderId = params.id;
  const vehicleIndex = params.vehicleIndex;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const expandedIndex = parseInt(vehicleIndex || "0");
  const srNo = searchParams.get("srNo") || String(expandedIndex + 1);
  const vIdx = parseInt(searchParams.get("expandedIndex") || "0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingId, setBookingId] = useState("");

  // ── popover open states ──
  const [statusOpen, setStatusOpen] = useState(false);

  const [form, setForm] = useState<VehicleForm>({
    name: searchParams.get("name") || "",
    color: searchParams.get("color") || "",
    hsnCode: "",
    chassisNo: "",
    engineNo: "",
    engineCapacity: "",
    fuelType: "",
    countryOfOrigin: "",
    yom: new Date().getFullYear(),
    fobAmount: 0,
    freight: 0,
    quantity: 1,
    status: "Booked",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/${orderId}`);
        const order = res.data.order || res.data;
        const vehicles = order.vehicles?.filter(Boolean) || [];
        const v = vehicles[vIdx];
        const name = v?.name || searchParams.get("name") || "";
        const color = v?.color || searchParams.get("color") || "";

        const bookingsRes = await bookingApi.getAll();
        const bookings = bookingsRes.data?.data || bookingsRes.data || [];
        let bookingVehicle = null;
        const matchingBooking = bookings.find((b: any) => {
          if (b.status === "To be Sourced") return false;
          const bOrderId =
            typeof b.orderId === "object" ? b.orderId?._id : b.orderId;
          if (bOrderId !== orderId) return false;
          return b.vehicles?.some(
            (bv: any) => String(bv.srNo) === String(srNo),
          );
        });

        if (matchingBooking) {
          setBookingId(matchingBooking._id);
          bookingVehicle = matchingBooking.vehicles.find(
            (bv: any) => String(bv.srNo) === String(srNo),
          );
        }

        setForm({
          name,
          color,
          hsnCode: bookingVehicle?.hsnCode || v?.hsnCode || "",
          chassisNo: bookingVehicle?.chassisNo || v?.chassisNo || "",
          engineNo: bookingVehicle?.engineNo || v?.engineNo || "",
          engineCapacity:
            bookingVehicle?.engineCapacity || v?.engineCapacity || "",
          fuelType: bookingVehicle?.fuelType || v?.fuelType || "",
          countryOfOrigin:
            bookingVehicle?.countryOfOrigin || v?.countryOfOrigin || "",
          yom: bookingVehicle?.yom || v?.yom || new Date().getFullYear(),
          fobAmount: bookingVehicle?.fobAmount || v?.fobAmount || 0,
          freight: bookingVehicle?.freight || v?.freight || 0,
          quantity: v?.quantity || 1,
          status: matchingBooking?.status || "Booked",
        });
      } catch {
        toast.error("Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, vIdx, srNo]);

  const validateAll = (): boolean => {
    const required: (keyof VehicleForm)[] = [
      "name",
      "color",
      "hsnCode",
      "chassisNo",
      "engineNo",
    ];
    const newErrors: Record<string, string> = {};
    required.forEach((f) => {
      if (f === "chassisNo") {
        if (!form.chassisNo.trim()) newErrors.chassisNo = "Chassis is required";
        else if (!CHASSIS_REGEX.test(form.chassisNo.trim()))
          newErrors.chassisNo = "Invalid 17-char Chassis";
      } else {
        if (!form[f]?.toString().trim()) newErrors[f] = `${f} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSaving(true);
    try {
      if (!bookingId) throw new Error("Booking not found");
      await bookingApi.update(bookingId, {
        status: form.status,
        vehicles: [
          {
            ...form,
            chassisNo: form.chassisNo.toUpperCase(),
            srNo: srNo,
          },
        ],
      });
      toast.success("Successfully updated");
      navigate(`/dealers/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (field: string) =>
    `w-full bg-[#F8F9FB] dark:bg-gray-800 border ${errors[field] ? "border-red-300" : "border-[#F1F3F6]"} dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`;

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Loading Profile...
        </span>
      </div>
    );

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Vehicle Specs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Refine information for unit at slot #{srNo}
          </p>
        </div>
        <button
          onClick={() => navigate(`/dealers/orders/${orderId}`)}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Order
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        {/* PRIMARY DETAILS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Standard Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <Car size={14} className="text-indigo-500" /> Vehicle Model /
                variant Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputStyle("name")}
                placeholder="TOYOTA LAND CRUISER"
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-emerald-500" /> HSN Code
              </label>
              <input
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                className={inputStyle("hsnCode")}
                placeholder="8703.23.01"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">
                Sample: 8703.23.01
              </p>
              {errors.hsnCode && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">
                  {errors.hsnCode}
                </p>
              )}
            </div>

            <div>
              <label className={labelStyle}>Exterior Color</label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className={inputStyle("color")}
                placeholder="Pearl White"
              />
            </div>

            <div>
              <label className={labelStyle}>Chassis Number</label>
              <input
                value={form.chassisNo}
                onChange={(e) =>
                  setForm({ ...form, chassisNo: e.target.value.toUpperCase() })
                }
                className={`${inputStyle("chassisNo")} font-mono`}
                placeholder="A1B2C3D4E5F6G7H8I"
                maxLength={17}
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">
                Sample: JN1AAB300X0123456
              </p>
              {errors.chassisNo && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">
                  {errors.chassisNo}
                </p>
              )}
            </div>

            <div>
              <label className={labelStyle}>Engine Number</label>
              <input
                value={form.engineNo}
                onChange={(e) =>
                  setForm({ ...form, engineNo: e.target.value.toUpperCase() })
                }
                className={`${inputStyle("engineNo")} font-mono`}
                placeholder="1GD-1234567"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">
                Sample: 1GD-1234567
              </p>
              {errors.engineNo && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">
                  {errors.engineNo}
                </p>
              )}
            </div>

            {/* ── STATUS — shadcn Combobox ── */}
            <div>
              <label className={labelStyle}>
                <Info size={14} className="text-indigo-400" /> Lifecycle Status
              </label>
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={statusOpen}
                    className={cn(
                      inputStyle(""),
                      "flex items-center justify-between cursor-pointer",
                    )}
                  >
                    <span className="text-[#4A5568] dark:text-gray-200">
                      {STATUS_OPTIONS.find((s) => s.value === form.status)
                        ?.label || "Select status..."}
                    </span>
                    <ChevronsUpDown
                      size={16}
                      className="text-[#A0AEC0] shrink-0"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {getValidNextStatuses(form.status).map((s) => (
                          <CommandItem
                            key={s.value}
                            value={s.value}
                            onSelect={() => {
                              setForm({ ...form, status: s.value });
                              setStatusOpen(false);
                            }}
                          >
                            {s.label}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                form.status === s.value
                                  ? "opacity-100"
                                  : "opacity-0",
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
          </div>
        </div>

        {/* ADDITIONAL SPECS — unchanged */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Additional Build Parameters
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className={labelStyle}>
                <Fuel size={14} className="text-blue-400" /> Fuel Type
              </label>
              <input
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className={inputStyle("")}
                placeholder="DIESEL"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Globe size={14} className="text-gray-400" /> Origin
              </label>
              <input
                value={form.countryOfOrigin}
                onChange={(e) =>
                  setForm({ ...form, countryOfOrigin: e.target.value })
                }
                className={inputStyle("")}
                placeholder="JAPAN"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Package size={14} className="text-amber-500" /> Engine Capacity
              </label>
              <input
                value={form.engineCapacity}
                onChange={(e) =>
                  setForm({ ...form, engineCapacity: e.target.value })
                }
                className={inputStyle("")}
                placeholder="2755cc"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-blue-400" /> MFG Year
              </label>
              <input
                type="number"
                value={form.yom}
                onChange={(e) =>
                  setForm({ ...form, yom: parseInt(e.target.value) || 0 })
                }
                className={inputStyle("")}
              />
            </div>
          </div>
        </div>

        {/* PRICING — unchanged */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Financial Adjustments
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <DollarSign size={14} className="text-emerald-600" /> FOB Amount
                (USD)
              </label>
              <input
                type="number"
                value={form.fobAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fobAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className={inputStyle("")}
              />
            </div>
            <div>
              <label className={labelStyle}>
                <DollarSign size={14} className="text-blue-600" /> Freight
                Charges (USD)
              </label>
              <input
                type="number"
                value={form.freight}
                onChange={(e) =>
                  setForm({ ...form, freight: parseFloat(e.target.value) || 0 })
                }
                className={inputStyle("")}
              />
            </div>
          </div>
        </div>

        {/* FOOTER — unchanged */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate(`/dealers/orders/${orderId}`)}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            ) : (
              <>
                <CheckCircle2 size={18} /> Commit Refinements
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealerVehicleEdit;
