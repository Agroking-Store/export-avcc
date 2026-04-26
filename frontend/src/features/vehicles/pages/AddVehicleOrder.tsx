import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Car,
  Save,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  VehicleListItem,
  vehicleManagementApi,
} from "../vehicleManagementApi";
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
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { vehicleBookingApi } from "../../../services/vehicleBookingApi";

const AddVehicleOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [form, setForm] = useState({
    vehicleId: "",
    quantity: "",
  });

  const [vehicleOpen, setVehicleOpen] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const data = await vehicleManagementApi.getOrderOptions();
        setVehicles(data.vehicles || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load form data");
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item._id === form.vehicleId),
    [vehicles, form.vehicleId],
  );

  const handleInputChange = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleVehicleSelect = (vehicleId: string) => {
    handleInputChange("vehicleId", vehicleId);
    setVehicleOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.vehicleId) {
      toast.error("Vehicle is required");
      return;
    }

    const quantity = Number(form.quantity);
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create the vehicle order
      const order = await vehicleManagementApi.createVehicleOrder({
        vehicleId: form.vehicleId,
        quantity,
      });

      // Step 2: Initialize bookings for this order immediately so they
      // appear in VehicleOrdersList (which fetches VehicleBooking records).
      // getByOrder triggers the lazy-creation of all booking slots server-side.
      try {
        await vehicleBookingApi.getByOrder(order._id);
      } catch {
        // Non-critical — bookings will still be created on first list load
      }

      navigate("/vehicles/orders", {
        state: { success: "Required vehicle added successfully" },
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add required vehicle",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  const selectedVehicleName = selectedVehicle
    ? `${selectedVehicle.brandName} ${selectedVehicle.modelName} - ${selectedVehicle.variant} (${selectedVehicle.color})`
    : "";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Required Vehicle
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a vehicle from the vehicle list
          </p>
        </div>

        <button
          onClick={() => navigate("/vehicles/orders")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Required Vehicles
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Order Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Car size={14} className="text-emerald-500" /> Vehicle <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      inputStyle,
                      "flex items-center justify-between cursor-pointer",
                    )}
                    disabled={optionsLoading}
                  >
                    <span
                      className={
                        selectedVehicleName
                          ? "text-[#4A5568] dark:text-gray-200"
                          : "text-[#A0AEC0]"
                      }
                    >
                      {selectedVehicleName || "Choose vehicle..."}
                    </span>
                    <ChevronsUpDown size={16} className="text-[#A0AEC0]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search vehicle..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No vehicle found.</CommandEmpty>
                      <CommandGroup>
                        {vehicles.map((vehicle) => {
                          const vehicleLabel = `${vehicle.brandName} ${vehicle.modelName} - ${vehicle.variant} (${vehicle.color})`;
                          return (
                            <CommandItem
                              key={vehicle._id}
                              value={vehicleLabel}
                              onSelect={() => handleVehicleSelect(vehicle._id)}
                            >
                              {vehicleLabel}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  form.vehicleId === vehicle._id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className={labelStyle}>
                <Save size={14} className="text-rose-400" /> Quantity <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className={`${inputStyle} w-32`}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/vehicles/orders")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={loading || optionsLoading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : <><Save size={18} /> Add Vehicle</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehicleOrder;