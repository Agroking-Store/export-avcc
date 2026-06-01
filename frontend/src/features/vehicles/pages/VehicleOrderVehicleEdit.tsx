import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  CheckCircle2,
  Fuel,
  Globe,
  Hash,
  Package,
  Truck,
} from "lucide-react";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import { vehicleManagementApi } from "../vehicleManagementApi";
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { useAuth } from "../../../hooks/useAuth";
import axios from "axios";
import { apiConfig } from "@/config/apiConfig";

const formatDateToDdMmYyyy = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}${month}${year}`;
};

const formatDdMmYyyyToIso = (value?: string) => {
  if (!value || !/^\d{8}$/.test(value)) {
    return "";
  }

  const day = value.slice(0, 2);
  const month = value.slice(2, 4);
  const year = value.slice(4, 8);
  const isoValue = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoValue}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return isoValue;
};

const formatDdMmYyyyToDate = (value?: string) => {
  const isoValue = formatDdMmYyyyToIso(value);
  return isoValue ? new Date(`${isoValue}T00:00:00`) : undefined;
};

const VehicleOrderVehicleEdit = () => {
  const currentYear = new Date().getFullYear();
  const { id, vehicleIndex } = useParams<{
    id: string;
    vehicleIndex: string;
  }>();
  const navigate = useNavigate();
  const { isSourcingTeam, isClient } = useAuth();

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
  const [commercialHsnCode, setCommercialHsnCode] = useState("");
  const [exportHsnCode, setExportHsnCode] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fuelInputValue, setFuelInputValue] = useState("");
  const [allBookings, setAllBookings] = useState<VehicleBookingItem[]>([]);

  const FUEL_TYPE_OPTIONS = [
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "Electric", label: "Electric" },
    { value: "Hybrid", label: "Hybrid" },
    { value: "Hybrid Petrol", label: "Hybrid Petrol" },
    { value: "CNG", label: "CNG" },
    { value: "LPG", label: "LPG" },
  ];
  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const validateChassis = (value: string) =>
    /^[A-Z0-9]{17}$/i.test(value.trim());
  const validateEngine = (value: string) =>
    /^[A-Z0-9]{6,20}$/i.test(value.trim());

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
        setDeliveryDate(
          currentBooking?.deliveryDate
            ? formatDateToDdMmYyyy(currentBooking.deliveryDate)
            : "",
        );
        setEngineCapacity(
          currentBooking?.engineCapacity ||
            (currentBooking?.vehicleId as any)?.engineCapacity ||
            orderRes?.vehicleSnapshot?.engineCapacity ||
            "",
        );
        setFuelType(currentBooking?.fuelType || "");
        setCountryOfOrigin(currentBooking?.countryOfOrigin || "");
        setYom(currentBooking?.yom || "");
        setCommercialHsnCode(
          currentBooking?.commercialHsnCode ||
            orderRes?.vehicleSnapshot?.commercialHsnCode ||
            currentBooking?.hsnCode ||
            orderRes?.vehicleSnapshot?.hsnCode ||
            "",
        );
        setExportHsnCode(
          currentBooking?.exportHsnCode ||
            orderRes?.vehicleSnapshot?.exportHsnCode ||
            currentBooking?.hsnCode ||
            orderRes?.vehicleSnapshot?.hsnCode ||
            "",
        );
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to load vehicle details",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, vehicleIndex]);

  // const handleSubmit = async (event: FormEvent) => {
  //   event.preventDefault();

  //   if (!booking) return;
  //   if (!chassisNumber.trim()) {
  //     toast.error("Chassis number is required");
  //     return;
  //   }

  //   const eng = engineNumber.trim().toUpperCase();
  //   const chassis = chassisNumber.trim().toUpperCase();

  //   if (eng !== "" && !validateEngine(eng)) {
  //     toast.error("Engine number must be 6-20 alphanumeric characters");
  //     return;
  //   }
  //   if (!validateChassis(chassis)) {
  //     toast.error("Chassis number must be exactly 17 alphanumeric characters");
  //     return;
  //   }

  //   // const duplicateEngine = allBookings.find(
  //   //   (b) => b._id !== booking._id && b.engineNumber?.toUpperCase() === eng,
  //   // );
  //   let duplicateEngine = null;
  //   if (eng !== "") {
  //     duplicateEngine = allBookings.find(
  //       (b) => b._id !== booking._id && b.engineNumber?.toUpperCase() === eng,
  //     );
  //   }

  //   const duplicateChassis = allBookings.find(
  //     (b) =>
  //       b._id !== booking._id && b.chassisNumber?.toUpperCase() === chassis,
  //   );

  //   if (duplicateEngine) {
  //     toast.error(`Engine number already used by another vehicle`);
  //     return;
  //   }
  //   if (duplicateChassis) {
  //     toast.error(`Chassis number already used by another vehicle`);
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     const updated = await vehicleBookingApi.updateChassisEngine(booking._id, {
  //       engineNumber: eng,
  //       chassisNumber: chassis,
  //       deliveryDate: deliveryDate || undefined,
  //       engineCapacity: engineCapacity || undefined,
  //       fuelType: fuelType || undefined,
  //       countryOfOrigin: countryOfOrigin || undefined,
  //       yom: yom || undefined,
  //       hsnCode: hsnCode || undefined,
  //     });

  //     try {
  //       const searchRes = await axios.get(
  //         `${apiConfig.baseURL}/proforma-invoices?search=${chassis}`,
  //       );
  //       const relatedPIs = searchRes.data?.data || [];

  //       for (const pi of relatedPIs) {
  //         const vehicleIndex = pi.vehicleDetails?.findIndex(
  //           (v: any) => v.chassisNo?.toUpperCase() === chassis,
  //         );

  //         if (vehicleIndex !== -1) {
  //           await axios.patch(
  //             `${apiConfig.baseURL}/proforma-invoices/${pi._id}/vehicles/${vehicleIndex}`,
  //             { engineNo: eng },
  //           );
  //         }
  //       }
  //       toast.success("Engine number synced to all related PIs");
  //     } catch (syncErr) {
  //       console.warn("Could not sync to some PIs (non-critical):", syncErr);
  //     }

  //     setBooking(updated);
  //     toast.success(
  //       updated.status === "chassis_received"
  //         ? "Engine and chassis numbers saved. Vehicle is now in transit."
  //         : "Vehicle details updated",
  //     );
  //     navigate(`/vehicles/orders`);
  //   } catch (error: any) {
  //     toast.error(error.response?.data?.message || "Failed to update vehicle");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!booking) return;
    if (!chassisNumber.trim()) {
      toast.error("Chassis number is required");
      return;
    }

    const eng = engineNumber.trim().toUpperCase();
    const chassis = chassisNumber.trim().toUpperCase();

    if (eng !== "" && !validateEngine(eng)) {
      toast.error("Engine number must be 6-20 alphanumeric characters");
      return;
    }
    if (!validateChassis(chassis)) {
      toast.error("Chassis number must be exactly 17 alphanumeric characters");
      return;
    }

    const duplicateChassis = allBookings.find(
      (b) =>
        b._id !== booking._id && b.chassisNumber?.toUpperCase() === chassis,
    );

    let duplicateEngine = null;
    if (eng !== "") {
      duplicateEngine = allBookings.find(
        (b) => b._id !== booking._id && b.engineNumber?.toUpperCase() === eng,
      );
    }

    if (duplicateChassis) {
      toast.error("Chassis number already used by another vehicle");
      return;
    }
    if (duplicateEngine) {
      toast.error("Engine number already used by another vehicle");
      return;
    }
    if (yom.trim()) {
      const yomNumber = Number(yom);
      if (
        !Number.isInteger(yomNumber) ||
        yomNumber < 1900 ||
        yomNumber > currentYear
      ) {
        toast.error(`Year of Manufacture must be between 1900 and ${currentYear}`);
        return;
      }
    }

    try {
      setSaving(true);
      const formattedDeliveryDate =
        deliveryDate.trim() === ""
          ? undefined
          : formatDdMmYyyyToIso(deliveryDate.trim().replace(/\//g, ""));

      if (deliveryDate.trim() && !formattedDeliveryDate) {
        toast.error("Delivery date must be in DDMMYYYY format");
        return;
      }

      const updated = await vehicleBookingApi.updateChassisEngine(booking._id, {
        engineNumber: eng || undefined,
        chassisNumber: chassis,
        deliveryDate: formattedDeliveryDate,
        engineCapacity: engineCapacity || undefined,
        fuelType: fuelType || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        yom: yom || undefined,
        commercialHsnCode: commercialHsnCode || undefined,
        exportHsnCode: exportHsnCode || undefined,
      });

      if (eng !== "") {
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken");

          if (!token) {
            toast.warning("No auth token found for sync");
            return;
          }

          // Fetch all Proforma Invoices
          const piRes = await axios.get(
            `${apiConfig.baseURL}/proforma-invoices`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          const allPIs = piRes.data?.data || [];

          let syncedCount = 0;

          for (const pi of allPIs) {
            const vehicleIndex = pi.vehicleDetails?.findIndex((v: any) => {
              return (
                v.chassisNo && v.chassisNo.toUpperCase().trim() === chassis
              );
            });

            if (vehicleIndex !== -1) {
              await axios.patch(
                `${apiConfig.baseURL}/proforma-invoices/${pi._id}/vehicles/${vehicleIndex}`,
                { engineNo: eng },
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              syncedCount++;
              console.log(`Synced engine number to PI: ${pi.piNumber}`);
            }
          }

          if (syncedCount > 0) {
            toast.success(`Engine number synced to ${syncedCount} PI(s)`);
          } else {
            toast.warning(
              "Vehicle saved, but no PI found with this chassis number",
            );
          }
        } catch (syncErr: any) {
          console.error(
            "PI sync failed:",
            syncErr.response?.data || syncErr.message,
          );
          toast.warning(
            "Vehicle saved, but sync to PI failed. Please refresh PI page.",
          );
        }
      }

      setBooking(updated);
      toast.success("Vehicle details updated successfully");
      navigate(`/vehicles/orders`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  const markDelivered = async () => {
    if (!booking) return;
    if (booking.status !== "shipped") {
      toast.error("Not shipped yet");
      return;
    }
    if (!booking.piGenerated) {
      toast.error("PI not created");
      return;
    }
    if (!booking.assignedClientId) {
      toast.error(
        "Please allot a client before marking this vehicle as delivered.",
      );
      return;
    }

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

  if (isClient) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Client access is view only for vehicle orders.
      </div>
    );
  }

  if (isSourcingTeam && booking.status !== "payment_done") {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        You are not authorized to edit this vehicle at its current status.
      </div>
    );
  }

  const vehicleName =
    `${order.vehicleSnapshot.brandName || ""} ${order.vehicleSnapshot.modelName || ""}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {vehicleName}
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
              onChange={(event) =>
                setEngineNumber(event.target.value.toUpperCase())
              }
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. G3LCSM578833"
              maxLength={20}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">
              Sample: G3LCSM578833
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Truck size={14} className="text-emerald-500" />
              Chassis Number <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(event) =>
                setChassisNumber(event.target.value.toUpperCase())
              }
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. MALFK81AVSD035213"
              maxLength={17}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase">
              Sample: MALFK81AVSD035213
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Hash size={14} className="text-indigo-500" />
              Sri Lanka HSN Code
            </label>
            <input
              type="text"
              value={commercialHsnCode}
              onChange={(event) =>
                setCommercialHsnCode(event.target.value.toUpperCase())
              }
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="FOR PI / LC / COMMERCIAL INVOICE"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Hash size={14} className="text-sky-500" />
              India HSN Code
            </label>
            <input
              type="text"
              value={exportHsnCode}
              onChange={(event) =>
                setExportHsnCode(event.target.value.toUpperCase())
              }
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm font-mono text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="FOR DEALER INVOICE / INR / USD / PACKING LIST"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
              <Fuel size={14} className="text-orange-500" />
              Fuel Type
            </label>
            <CreatableSelect
              isClearable
              options={FUEL_TYPE_OPTIONS}
              value={fuelType ? { value: fuelType, label: fuelType } : null}
              inputValue={fuelInputValue}
              onInputChange={(val) => {
                setFuelInputValue(val);
                // Live-update fuelType as user types so it's always committed
                if (val) setFuelType(val);
              }}
              onChange={(option) => {
                setFuelType(option?.value ?? "");
                setFuelInputValue("");
              }}
              onKeyDown={(e) => {
                // Commit typed value on Enter or Tab even without selecting from dropdown
                if (
                  (e.key === "Enter" || e.key === "Tab") &&
                  fuelInputValue.trim()
                ) {
                  setFuelType(fuelInputValue.trim());
                  setFuelInputValue("");
                  e.preventDefault();
                }
              }}
              onBlur={() => {
                // Commit whatever is typed when field loses focus
                if (fuelInputValue.trim()) {
                  setFuelType(fuelInputValue.trim());
                  setFuelInputValue("");
                }
              }}
              placeholder="Select or type..."
              formatCreateLabel={(input) => `Use "${input}"`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  background: "#F8F9FB",
                  border: `1px solid ${state.isFocused ? "#6366f1" : "#F1F3F6"}`,
                  borderRadius: "0.75rem",
                  padding: "2px 4px",
                  fontSize: "0.875rem",
                  color: "#4A5568",
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(99,102,241,0.12)"
                    : "none",
                  minHeight: "46px",
                  "&:hover": { borderColor: "#6366f1" },
                }),
                placeholder: (base) => ({ ...base, color: "#A0AEC0" }),
                singleValue: (base) => ({ ...base, color: "#4A5568" }),
                option: (base, state) => ({
                  ...base,
                  fontSize: "0.875rem",
                  background: state.isSelected
                    ? "#6366f1"
                    : state.isFocused
                      ? "#EEF2FF"
                      : "white",
                  color: state.isSelected ? "white" : "#4A5568",
                  cursor: "pointer",
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  zIndex: 50,
                }),
                indicatorSeparator: () => ({ display: "none" }),
              }}
            />
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
              type="number"
              value={yom}
              onChange={(event) => setYom(event.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. 2024"
              maxLength={4}
              min={1900}
              max={currentYear}
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
              Estimated Collection Date (DD/MM/YYYY)
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  // disabled={!engineNumber.trim() || !chassisNumber.trim()}
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    className={
                      deliveryDate ? "text-slate-700" : "text-slate-400"
                    }
                  >
                    {deliveryDate || "DD/MM/YYYY"}
                  </span>
                  <CalendarIcon size={16} className="text-slate-400" />
                </button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formatDdMmYyyyToDate(deliveryDate)}
                  onSelect={(date) => {
                    if (date) {
                      const dd = String(date.getDate()).padStart(2, "0");
                      const mm = String(date.getMonth() + 1).padStart(2, "0");
                      const yyyy = date.getFullYear();
                      // UI should remain DD/MM/YYYY but backend expects DDMMYYYY (handled in submit conversion)
                      setDeliveryDate(`${dd}/${mm}/${yyyy}`);
                    } else {
                      setDeliveryDate("");
                    }
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Current status:{" "}
          <span className="font-semibold text-slate-900">{booking.status}</span>
          <p className="mt-1">
            Once both engine and chassis numbers are saved after payment, status
            moves to
            <span className="font-semibold text-slate-900">
              {" "}
              chassis_received
            </span>
            .
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

          {booking.status === "shipped" && (
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
