import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  DollarSign,
  Fuel,
  Globe,
  Hash,
  Package,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { bookingApi } from "../../../services/bookingApi";
import { dealerApi } from "../../../services/dealerApi";
import { Button } from "@/components/ui/button";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { vehicleManagementApi } from "../vehicleManagementApi";
import { cn } from "@/lib/utils";
import CreatableSelect from "react-select/creatable";

const VehicleOrderVehicleBooking = () => {
  const currentYear = new Date().getFullYear();
  const { id: orderId } = useParams() as { id: string };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dealerOpen, setDealerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fuelInputValue, setFuelInputValue] = useState("");

  const FUEL_TYPE_OPTIONS = [
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "Electric", label: "Electric" },
    { value: "Hybrid", label: "Hybrid" },
    { value: "Hybrid Petrol", label: "Hybrid Petrol" },
    { value: "CNG", label: "CNG" },
    { value: "LPG", label: "LPG" },
  ];

  const srNoParam = searchParams.get("srNo") || "";
  const vehicleName = searchParams.get("name") || "";
  const vehicleColor = searchParams.get("color") || "";
  const vehicleVariant = searchParams.get("variant") || "";

  const [vehicle, setVehicle] = useState({
    commercialHsnCode: "",
    exportHsnCode: "",
    vehicleName,
    exteriorColour: vehicleColor,
    chassisNo: "",
    engineNo: "",
    srNo: srNoParam,
    engineCapacity: "",
    fuelType: "",
    countryOfOrigin: "",
    yom: currentYear,
    fobAmount: 0,
    freight: 0,
  });

  const [bookingAmount, setBookingAmount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dealerApi
      .getAll()
      .then((res) => setDealers(res.data || []))
      .catch(() => toast.error("Failed to load dealers"));

    if (orderId) {
      vehicleManagementApi
        .getVehicleOrderById(orderId)
        .then((order) => {
          if (
            order?.vehicleSnapshot?.commercialHsnCode ||
            order?.vehicleSnapshot?.exportHsnCode ||
            order?.vehicleSnapshot?.hsnCode
          ) {
            setVehicle((prev) => ({
              ...prev,
              commercialHsnCode:
                order.vehicleSnapshot.commercialHsnCode ||
                order.vehicleSnapshot.hsnCode ||
                "",
              exportHsnCode:
                order.vehicleSnapshot.exportHsnCode ||
                order.vehicleSnapshot.hsnCode ||
                "",
            }));
          }
        })
        .catch(() => {
          // non-critical: HSN can be entered manually
        });
    }
  }, [orderId]);

  const handleInputChange = useCallback(
    (field: string, value: any) => {
      if (field === "dealerId") {
        setSelectedDealer(value);
      } else if (field === "date") {
        setBookingDate(value);
      } else if (field === "bookingAmount") {
        setBookingAmount(value);
      } else {
        setVehicle((prev) => ({ ...prev, [field]: value }));
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedDealer) newErrors.dealerId = 'Dealer is required';
    if (!vehicle.commercialHsnCode?.trim()) {
      newErrors.commercialHsnCode = 'Sri Lanka HSN Code is required';
    }
    if (!vehicle.exportHsnCode?.trim()) {
      newErrors.exportHsnCode = 'India HSN Code is required';
    }
    if (!vehicle.vehicleName?.trim()) newErrors.vehicleName = 'Vehicle name is required';
    if (!vehicle.exteriorColour?.trim()) newErrors.exteriorColour = 'Color is required';
    if (!vehicle.chassisNo?.trim()) {
      newErrors.chassisNo = 'Chassis No is required';
    } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicle.chassisNo.trim())) {
      newErrors.chassisNo = 'Invalid Chassis (17 chars)';
    }
    if (!vehicle.engineNo?.trim()) {
      newErrors.engineNo = 'Engine number is required';
    } else if (!/^[A-Z0-9]{10,12}$/i.test(vehicle.engineNo.trim())) {
      newErrors.engineNo = 'Invalid format (10-12 alphanumeric, e.g. G3LCSM578833)';
    }
    if (!bookingAmount || bookingAmount <= 0) {
      newErrors.bookingAmount = 'Booking amount is required and must be greater than 0';
    }
    if (vehicle.yom && (vehicle.yom < 1900 || vehicle.yom > currentYear)) {
      newErrors.yom = `YOM must be between 1900 and ${currentYear}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      await bookingApi.create({
        dealerId: selectedDealer,
        date: format(bookingDate, "yyyy-MM-dd"),
        bookingAmount,
        orderId,
        vehicles: [
          {
            commercialHsnCode: vehicle.commercialHsnCode,
            exportHsnCode: vehicle.exportHsnCode,
            hsnCode: vehicle.exportHsnCode,
            name: vehicle.vehicleName,
            color: vehicle.exteriorColour,
            chassisNo: vehicle.chassisNo,
            engineNo: vehicle.engineNo,
            engineCapacity: vehicle.engineCapacity,
            fuelType: vehicle.fuelType,
            countryOfOrigin: vehicle.countryOfOrigin,
            yom: vehicle.yom,
            fobAmount: vehicle.fobAmount,
            freight: vehicle.freight,
            quantity: 1,
            srNo: vehicle.srNo,
          },
        ],
        status: "Booked",
      });

      toast.success("Vehicle booked successfully");
      navigate(`/vehicles/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputStyle = (field: string) =>
    `w-full bg-[#F8F9FB] border ${
      errors[field] ? "border-red-300" : "border-[#F1F3F6]"
    } rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`;

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2";

  const selectedDealerName = dealers.find(
    (dealer) => dealer._id === selectedDealer,
  )?.name;

  return (
    <div className="w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Book Vehicle</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign dealer and unit details for slot #{srNoParam}
          </p>
        </div>
        <button
          onClick={() => navigate(`/vehicles/orders/${orderId}`)}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Order
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700">
              Assignment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Users size={14} className="text-indigo-500" /> Authorized Dealer <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Popover open={dealerOpen} onOpenChange={setDealerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      inputStyle("dealerId"),
                      "flex items-center justify-between cursor-pointer",
                    )}
                  >
                    <span
                      className={
                        selectedDealerName ? "text-[#4A5568]" : "text-[#A0AEC0]"
                      }
                    >
                      {selectedDealerName || "Choose dealer..."}
                    </span>
                    <ChevronsUpDown size={16} className="text-[#A0AEC0]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search dealer..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No dealer found.</CommandEmpty>
                      <CommandGroup>
                        {dealers.map((dealer) => (
                          <CommandItem
                            key={dealer._id}
                            value={dealer.name}
                            onSelect={() => {
                              handleInputChange("dealerId", dealer._id);
                              setDealerOpen(false);
                            }}
                          >
                            {dealer.name}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedDealer === dealer._id
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

            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-blue-400" /> Booking Date
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      inputStyle("date"),
                      "flex items-center justify-between cursor-pointer",
                    )}
                  >
                    <span className={bookingDate ? "text-[#4A5568]" : "text-[#A0AEC0]"}>
                      {bookingDate ? format(bookingDate, "dd MMM yyyy") : "Pick a date"}
                    </span>
                    <Calendar size={16} className="text-[#A0AEC0]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ShadCalendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange("date", date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700">
              Vehicle Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <Car size={14} className="text-indigo-500" /> Vehicle Model / variant Name <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={vehicle.vehicleName}
                onChange={(e) => handleInputChange("vehicleName", e.target.value)}
                className={inputStyle("vehicleName")}
                placeholder="e.g. Toyota LC300"
              />
              {errors.vehicleName && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.vehicleName}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-emerald-500" /> Sri Lanka HSN Code <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={vehicle.commercialHsnCode}
                onChange={(e) =>
                  handleInputChange("commercialHsnCode", e.target.value)
                }
                className={inputStyle("commercialHsnCode")}
                placeholder="FOR PI / LC / COMMERCIAL INVOICE"
              />
              {errors.commercialHsnCode && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.commercialHsnCode}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-sky-500" /> India HSN Code <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={vehicle.exportHsnCode}
                onChange={(e) =>
                  handleInputChange("exportHsnCode", e.target.value)
                }
                className={inputStyle("exportHsnCode")}
                placeholder="FOR DEALER INVOICE / INR / USD / PACKING LIST"
              />
              {errors.exportHsnCode && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.exportHsnCode}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: vehicle.exteriorColour.toLowerCase() || 'transparent' }}></div>
                Exterior Colour <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={vehicle.exteriorColour}
                onChange={(e) => handleInputChange("exteriorColour", e.target.value)}
                className={inputStyle("exteriorColour")}
                placeholder="Pearl White"
              />
              {errors.exteriorColour && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.exteriorColour}</p>}
            </div>

            <div>
              <label className={labelStyle}>Chassis Number <span className="text-red-500 ml-0.5">*</span></label>
              <input
                type="text"
                value={vehicle.chassisNo}
                onChange={(e) => handleInputChange("chassisNo", e.target.value.toUpperCase())}
                className={`${inputStyle("chassisNo")} font-mono tracking-wider`}
                placeholder="A1B2C3D4E5F6G7H8I"
                maxLength={17}
              />
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Example: JN1AAB300X0123456 (17 alphanumeric)</p>
              {errors.chassisNo && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.chassisNo}</p>}
            </div>

            <div>
              <label className={labelStyle}>Engine Number <span className="text-red-500 ml-0.5">*</span></label>
              <input
                type="text"
                value={vehicle.engineNo}
                onChange={(e) => handleInputChange("engineNo", e.target.value.toUpperCase())}
                className={`${inputStyle("engineNo")} font-mono tracking-wider`}
                placeholder="G3LCSM578833"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Example: G3LCSM578833 (10-12 alphanumeric chars)</p>
              {errors.engineNo && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.engineNo}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700">
              Logistics & Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className={labelStyle}>
                <Fuel size={14} className="text-blue-400" /> Fuel Type
              </label>
              <CreatableSelect
                isClearable
                options={FUEL_TYPE_OPTIONS}
                value={vehicle.fuelType ? { value: vehicle.fuelType, label: vehicle.fuelType } : null}
                inputValue={fuelInputValue}
                onInputChange={(val) => {
                  setFuelInputValue(val);
                  if (val) handleInputChange("fuelType", val);
                }}
                onChange={(option) => {
                  handleInputChange("fuelType", option?.value ?? "");
                  setFuelInputValue("");
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === "Tab") && fuelInputValue.trim()) {
                    handleInputChange("fuelType", fuelInputValue.trim());
                    setFuelInputValue("");
                    e.preventDefault();
                  }
                }}
                onBlur={() => {
                  if (fuelInputValue.trim()) {
                    handleInputChange("fuelType", fuelInputValue.trim());
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
                    boxShadow: state.isFocused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
                    minHeight: "46px",
                    "&:hover": { borderColor: "#6366f1" },
                  }),
                  placeholder: (base) => ({ ...base, color: "#A0AEC0" }),
                  singleValue: (base) => ({ ...base, color: "#4A5568" }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.875rem",
                    background: state.isSelected ? "#6366f1" : state.isFocused ? "#EEF2FF" : "white",
                    color: state.isSelected ? "white" : "#4A5568",
                    cursor: "pointer",
                  }),
                  menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden", zIndex: 50 }),
                  indicatorSeparator: () => ({ display: "none" }),
                }}
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Globe size={14} className="text-emerald-500" /> Origin Country
              </label>
              <input
                type="text"
                value={vehicle.countryOfOrigin}
                onChange={(e) => handleInputChange("countryOfOrigin", e.target.value)}
                className={inputStyle("")}
                placeholder="Japan"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Package size={14} className="text-amber-500" /> Engine Capacity
              </label>
              <input
                type="text"
                value={vehicle.engineCapacity}
                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                className={inputStyle("")}
                placeholder="e.g. 1496cc"
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-indigo-400" /> MFG Year (YOM)
              </label>
              <input
                type="number"
                value={vehicle.yom}
                onChange={(e) =>
                  handleInputChange("yom", parseInt(e.target.value) || 0)
                }
                className={inputStyle("yom")}
                min={1900}
                max={currentYear}
              />
              {errors.yom && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.yom}</p>}
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <DollarSign size={14} className="text-emerald-600" /> FOB Amount (USD)
              </label>
              <input
                type="number"
                value={vehicle.fobAmount || ""}
                onChange={(e) => handleInputChange("fobAmount", parseFloat(e.target.value) || 0)}
                className={inputStyle("")}
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <DollarSign size={14} className="text-blue-600" /> Freight Charges (USD)
              </label>
              <input
                type="number"
                value={vehicle.freight || ""}
                onChange={(e) => handleInputChange("freight", parseFloat(e.target.value) || 0)}
                className={inputStyle("")}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <div className="h-5 w-1 bg-amber-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700">Booking Summary</h2>
          </div>

          <div>
            <label className={labelStyle}>
              <span className="text-amber-500 font-bold text-lg">$</span> Booking Amount <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bookingAmount || ""}
              onChange={(e) => handleInputChange("bookingAmount", parseFloat(e.target.value) || 0)}
              className={`${inputStyle("bookingAmount")} w-full md:w-1/2`}
              placeholder="0.00"
            />
            {errors.bookingAmount && (
              <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">
                {errors.bookingAmount}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
              Final negotiated booking value in Rupees
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(`/vehicles/orders/${orderId}`)}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            <X size={16} /> Discard
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitLoading ? "Booking..." : <><CheckCircle2 size={18} /> Complete Unit Booking</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleOrderVehicleBooking;
