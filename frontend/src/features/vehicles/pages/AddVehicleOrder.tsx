import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Car,
  Save,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
  X,
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
import { vehicleBookingApi } from "../../../services/vehicleBookingApi";
import { useAuth } from "../../../hooks/useAuth";

interface OrderEntry {
  vehicleId: string;
  quantity: string;
}

const emptyOrder = (): OrderEntry => ({
  vehicleId: "",
  quantity: "",
});

const AddVehicleOrder = () => {
  const navigate = useNavigate();
  const { isSourcingTeam, isClient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([emptyOrder()]);
  const [vehicleOpenMap, setVehicleOpenMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isSourcingTeam) return;
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
  }, [isSourcingTeam]);

  const handleInputChange = useCallback((index: number, field: keyof OrderEntry, value: any) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  }, []);

  const handleVehicleSelect = (index: number, vehicleId: string) => {
    handleInputChange(index, "vehicleId", vehicleId);
    setVehicleOpenMap((prev) => ({ ...prev, [index]: false }));
  };

  const addOrder = () => {
    setOrders((prev) => [...prev, emptyOrder()]);
  };

  const removeOrder = (index: number) => {
    if (orders.length <= 1) {
      toast.error("At least one order entry is required");
      return;
    }
    setOrders((prev) => prev.filter((_, i) => i !== index));
    setVehicleOpenMap((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const validate = (): boolean => {
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (!o.vehicleId) {
        toast.error(`Vehicle is required for entry ${i + 1}`);
        return false;
      }
      const quantity = Number(o.quantity);
      if (quantity < 1) {
        toast.error(`Quantity must be at least 1 for entry ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      for (const o of orders) {
        const order = await vehicleManagementApi.createVehicleOrder({
          vehicleId: o.vehicleId,
          quantity: Number(o.quantity),
        });
        try {
          await vehicleBookingApi.getByOrder(order._id);
        } catch {
          // Non-critical
        }
      }
      navigate("/vehicles/orders", {
        state: { success: `${orders.length} required vehicle(s) added successfully` },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add required vehicles");
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (vehicleId: string) => {
    const v = vehicles.find((item) => item._id === vehicleId);
    return v ? `${v.brandName} ${v.modelName} - ${v.variant} (${v.color})` : "";
  };

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  if (isSourcingTeam) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        You are not authorized to add required vehicles.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add Required Vehicle</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isClient
              ? "Your required vehicles will be added under your client account"
              : "Select one or more vehicles from the vehicle list"}
          </p>
        </div>
        <button
          onClick={() => navigate("/vehicles/orders")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Required Vehicles
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {orders.map((order, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 space-y-6"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  Order Entry {index + 1}
                </h2>
              </div>
              {orders.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOrder(index)}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Order Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>
                    <Car size={14} className="text-emerald-500" /> Vehicle <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Popover
                    open={vehicleOpenMap[index] || false}
                    onOpenChange={(open) =>
                      setVehicleOpenMap((prev) => ({ ...prev, [index]: open }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(inputStyle, "flex items-center justify-between cursor-pointer")}
                        disabled={optionsLoading}
                      >
                        <span className={order.vehicleId ? "text-[#4A5568] dark:text-gray-200" : "text-[#A0AEC0]"}>
                          {getVehicleName(order.vehicleId) || "Choose vehicle..."}
                        </span>
                        <ChevronsUpDown size={16} className="text-[#A0AEC0]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                  onSelect={() => handleVehicleSelect(index, vehicle._id)}
                                >
                                  {vehicleLabel}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      order.vehicleId === vehicle._id ? "opacity-100" : "opacity-0",
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
                    name={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={order.quantity}
                    onChange={(e) => handleInputChange(index, "quantity", e.target.value)}
                    className={`${inputStyle} w-32`}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Another Order Button */}
        <button
          type="button"
          onClick={addOrder}
          className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-300 transition-all"
        >
          <Plus size={18} /> Add Another Vehicle
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
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
            {loading ? "Saving..." : <><Save size={18} /> Save Vehicle(s)</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehicleOrder;
