import { useEffect, useState } from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
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
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";

interface Dealer {
  _id: string;
  name: string;
  contact?: string;
  gstNumber?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem | null;
  dealers: Dealer[];
  onSync: (updated: VehicleBookingItem) => void;
}

const DealerAllotModal = ({ isOpen, onClose, booking, dealers, onSync }: Props) => {
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [dealerSaving, setDealerSaving] = useState(false);
  const [dealerPopoverOpen, setDealerPopoverOpen] = useState(false);

  useEffect(() => {
    if (booking) {
      setSelectedDealerId(booking.assignedDealerId || "");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleAssignDealer = async () => {
    if (!booking) return;
    if (!selectedDealerId) {
      toast.error("Please select a dealer");
      return;
    }

    try {
      setDealerSaving(true);
      const updated = await vehicleBookingApi.assignDealer(
        booking._id,
        selectedDealerId,
      );
      onSync(updated);
      toast.success("Dealer allotted successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to allot dealer");
    } finally {
      setDealerSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Unit {booking.vehicleIndex + 1}
            </p>
            <h3 className="text-xl font-bold text-slate-900">Allot Dealer</h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Dealer
            </label>
            <Popover open={dealerPopoverOpen} onOpenChange={setDealerPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 cursor-pointer"
                >
                  <span
                    className={
                      selectedDealerId ? "text-slate-700" : "text-slate-400"
                    }
                  >
                    {selectedDealerId
                      ? (() => {
                          const dealer = dealers.find(
                            (d) => d._id === selectedDealerId,
                          );
                          return dealer
                            ? `${dealer.name}${dealer.gstNumber ? ` - ${dealer.gstNumber}` : ""}`
                            : "Choose dealer...";
                        })()
                      : "Choose dealer..."}
                  </span>
                  <ChevronsUpDown size={16} className="text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search dealer..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No dealer found.</CommandEmpty>
                    <CommandGroup>
                      {dealers.map((dealer) => {
                        const dealerLabel = `${dealer.name}${dealer.gstNumber ? ` - ${dealer.gstNumber}` : ""}`;
                        return (
                          <CommandItem
                            key={dealer._id}
                            value={dealerLabel}
                            onSelect={() => {
                              setSelectedDealerId(dealer._id);
                              setDealerPopoverOpen(false);
                            }}
                          >
                            {dealerLabel}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedDealerId === dealer._id
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

          {booking.assignedDealerSnapshot?.name && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              Current allotment: {booking.assignedDealerSnapshot.name}
              {booking.assignedDealerSnapshot.gstNumber
                ? ` - ${booking.assignedDealerSnapshot.gstNumber}`
                : ""}
            </div>
          )}

          <button
            onClick={handleAssignDealer}
            disabled={dealerSaving}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={16} />
            Allot
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerAllotModal;

