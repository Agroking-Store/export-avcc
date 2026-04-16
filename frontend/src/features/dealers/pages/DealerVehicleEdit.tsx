import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { bookingApi } from "../../../services/bookingApi";
import { ArrowLeft, Save, Car, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

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
}

const CHASSIS_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderId2, setOrderId2] = useState("");
  const [allOrderVehicles, setAllOrderVehicles] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState("");

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
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/orders/${orderId}`);
        const order = res.data.order || res.data;
        setOrderId2(order.orderId);
        const vehicles = order.vehicles?.filter(Boolean) || [];
        setAllOrderVehicles(vehicles);
        const v = vehicles[vIdx];
        const name = v?.name || searchParams.get("name") || "";
        const color = v?.color || searchParams.get("color") || "";
        
        // Fetch booking data for booked vehicle
        const bookingsRes = await bookingApi.getAll();
        const bookings = bookingsRes.data?.data || bookingsRes.data || [];
        let bookingVehicle = null;
        const matchingBooking = bookings.find((b: any) => {
          if (b.status !== "Booked") return false;
          if (b.orderId && b.orderId !== orderId) return false;
          return b.vehicles?.some((bv: any) => String(bv.srNo) === String(srNo));
        });
        if (matchingBooking) {
          setBookingId(matchingBooking._id);
          bookingVehicle = matchingBooking.vehicles.find((bv: any) => String(bv.srNo) === String(srNo));
        }
        
        // Merge: bookingVehicle overrides v, fallback searchParams for name/color
        const formData = {
          name,
          color,
          hsnCode: bookingVehicle?.hsnCode || v?.hsnCode || "",
          chassisNo: bookingVehicle?.chassisNo || v?.chassisNo || "",
          engineNo: bookingVehicle?.engineNo || v?.engineNo || "",
          engineCapacity: bookingVehicle?.engineCapacity || v?.engineCapacity || "",
          fuelType: bookingVehicle?.fuelType || v?.fuelType || "",
          countryOfOrigin: bookingVehicle?.countryOfOrigin || v?.countryOfOrigin || "",
          yom: bookingVehicle?.yom || v?.yom || new Date().getFullYear(),
          fobAmount: bookingVehicle?.fobAmount || v?.fobAmount || 0,
          freight: bookingVehicle?.freight || v?.freight || 0,
          quantity: v?.quantity || 1,
        };
        setForm(formData);
      } catch {
        toast.error("Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, vIdx]);

  /* ── Validation ── */
  const validateField = (field: keyof VehicleForm): string => {
    switch (field) {
      case "name": return form.name.trim() ? "" : "Vehicle name is required";
      case "color": return form.color.trim() ? "" : "Colour is required";
      case "hsnCode": return form.hsnCode.trim() ? "" : "HSN Code is required";
      case "chassisNo":
        if (!form.chassisNo.trim()) return "Chassis No is required";
        if (!CHASSIS_REGEX.test(form.chassisNo.trim())) return "Must be 17 alphanumeric characters (no I, O, Q)";
        return "";
      case "engineNo": return form.engineNo.trim() ? "" : "Engine No is required";
      default: return "";
    }
  };

  const validateAll = (): boolean => {
    const required: (keyof VehicleForm)[] = ["name", "color", "hsnCode", "chassisNo", "engineNo"];
    const newErrors: Record<string, string> = {};
    required.forEach((f) => {
      const err = validateField(f);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    setTouched(Object.fromEntries(required.map((f) => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof VehicleForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
  };

  const handleChange = (field: keyof VehicleForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setTimeout(() => {
        setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
      }, 0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix errors before saving");
      return;
    }
    setSaving(true);
    if (!bookingId) {
      toast.error("Booking not found for this vehicle. Cannot edit.");
      setSaving(false);
      return;
    }

    try {
      // Create updated vehicle object for the booking
      const updatedVehicleData = {
        name: form.name.trim(),
        color: form.color.trim(),
        hsnCode: form.hsnCode.trim(),
        chassisNo: form.chassisNo.trim().toUpperCase(),
        engineNo: form.engineNo.trim(),
        engineCapacity: form.engineCapacity.trim(),
        fuelType: form.fuelType.trim(),
        countryOfOrigin: form.countryOfOrigin.trim(),
        yom: form.yom,
        fobAmount: form.fobAmount,
        freight: form.freight,
        quantity: 1,
        srNo: srNo,
      };

      const response = await bookingApi.update(bookingId, {
        vehicles: [updatedVehicleData],
      });
      console.log("Update response:", response.data);
      toast.success("Vehicle updated successfully");
      navigate(`/dealers/orders/${orderId}`);
    } catch (error: any) {
      console.error("Update error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "Server error";
      toast.error(`Failed to update: ${msg}`);
      if (msg.includes('already exists')) {
         setErrors({
           chassisNo: msg,
           engineNo: msg
         });
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Sub-components ── */
  const FieldError = ({ field }: { field: string }) => {
    if (!touched[field] || !errors[field]) return null;
    return (
      <p className="mt-1.5 flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
        <AlertCircle size={11} className="flex-shrink-0" />
        {errors[field]}
      </p>
    );
  };

  const inputBase =
    "w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  const inputClass = (field: string) =>
    `${inputBase} ${
      touched[field] && errors[field]
        ? "border-red-400 dark:border-red-500 bg-red-50/40 dark:bg-red-900/10"
        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400"
    }`;

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const req = <span className="text-red-500 ml-0.5">*</span>;

  const errorCount = Object.values(errors).filter(Boolean).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-20 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(`/dealers/orders/${orderId}`)}
        className="cursor-pointer inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
      >
        <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
          <ArrowLeft size={15} />
        </span>
        <span className="text-sm font-medium">Back to Order</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-full border-2 border-white/30 shadow-inner flex-shrink-0"
            style={{ backgroundColor: form.color.toLowerCase() || "#6b7280" }}
          />
          <div>
            <p className="text-orange-200 text-xs font-semibold uppercase tracking-widest mb-0.5">
              Editing Vehicle #{srNo}
            </p>
            <h1 className="text-xl font-bold text-white">{form.name || "Vehicle"}</h1>
            <p className="text-orange-200 text-sm">{orderId2 || `Order #${orderId?.slice(-6)}`}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} noValidate>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Car size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Vehicle Details</h2>
            <span className="ml-auto text-xs text-gray-400">* required</span>
          </div>

          <div className="p-6 space-y-4">
            {/* Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Vehicle Name {req}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Toyota Corolla"
                  className={inputClass("name")}
                />
                <FieldError field="name" />
              </div>

              <div>
                <label className={labelClass}>Exterior Colour {req}</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  onBlur={() => handleBlur("color")}
                  placeholder="e.g. White Pearl"
                  className={inputClass("color")}
                />
                <FieldError field="color" />
              </div>

              <div>
                <label className={labelClass}>HSN Code {req}</label>
                <input
                  type="text"
                  value={form.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                  onBlur={() => handleBlur("hsnCode")}
                  placeholder="e.g. 8703239090"
                  className={inputClass("hsnCode")}
                />
                <FieldError field="hsnCode" />
              </div>

              <div>
                <label className={labelClass}>
                  Chassis No {req}
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(17 chars)</span>
                </label>
                <input
                  type="text"
                  value={form.chassisNo}
                  onChange={(e) => handleChange("chassisNo", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("chassisNo")}
                  placeholder="e.g. JN1AABZ11U0000001"
                  maxLength={17}
                  className={`${inputClass("chassisNo")} font-mono tracking-widest`}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError field="chassisNo" />
                  <span className={`text-xs ml-auto ${form.chassisNo.length === 17 ? "text-emerald-600" : "text-gray-400"}`}>
                    {form.chassisNo.length}/17
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Engine No {req}</label>
                <input
                  type="text"
                  value={form.engineNo}
                  onChange={(e) => handleChange("engineNo", e.target.value)}
                  onBlur={() => handleBlur("engineNo")}
                  placeholder="e.g. 2ZR1234567"
                  className={`${inputClass("engineNo")} font-mono`}
                />
                <FieldError field="engineNo" />
              </div>

              <div>
                <label className={labelClass}>Engine Capacity</label>
                <input
                  type="text"
                  value={form.engineCapacity}
                  onChange={(e) => handleChange("engineCapacity", e.target.value)}
                  placeholder="e.g. 1496cc"
                  className={inputClass("")}
                />
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Optional Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fuel Type</label>
                  <input
                    type="text"
                    value={form.fuelType}
                    onChange={(e) => handleChange("fuelType", e.target.value)}
                    placeholder="e.g. Petrol / Diesel / Hybrid"
                    className={inputClass("")}
                  />
                </div>

                <div>
                  <label className={labelClass}>Country of Origin</label>
                  <input
                    type="text"
                    value={form.countryOfOrigin}
                    onChange={(e) => handleChange("countryOfOrigin", e.target.value)}
                    placeholder="e.g. Japan"
                    className={inputClass("")}
                  />
                </div>

                <div>
                  <label className={labelClass}>Year of Manufacture (YOM)</label>
                  <input
                    type="number"
                    value={form.yom}
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    onChange={(e) => handleChange("yom", parseInt(e.target.value) || 0)}
                    className={inputClass("")}
                  />
                </div>

                <div>
                  <label className={labelClass}>FOB Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={form.fobAmount}
                      min={0}
                      onChange={(e) => handleChange("fobAmount", parseFloat(e.target.value) || 0)}
                      className={`${inputClass("")} pl-7`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Freight (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={form.freight}
                      min={0}
                      onChange={(e) => handleChange("freight", parseFloat(e.target.value) || 0)}
                      className={`${inputClass("")} pl-7`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error summary */}
        {errorCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {errorCount} field{errorCount !== 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} attention above
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/dealers/orders/${orderId}`)}
            className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#5243EF] hover:bg-[#4335d6] disabled:bg-indigo-400 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealerVehicleEdit;