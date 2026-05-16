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
import { IClient } from "../../clients/clients.types";
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem | null;
  clients: IClient[];
  onSync: (updated: VehicleBookingItem) => void;
}

const ClientAllotModal = ({ isOpen, onClose, booking, clients, onSync }: Props) => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSaving, setClientSaving] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

  useEffect(() => {
    if (booking) {
      setSelectedClientId(booking.assignedClientId || "");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const getClientDisplayName = (client?: Partial<IClient> | null) =>
    client?.companyName || client?.name || "Choose client...";

  const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
  const vehicleName = vehicleSnapshot
    ? `${vehicleSnapshot.brandName || ""} ${vehicleSnapshot.modelName || ""}`.trim()
    : "Vehicle";

  const handleAssignClient = async () => {
    if (!booking) return;
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    try {
      setClientSaving(true);
      const updated = await vehicleBookingApi.assignClient(
        booking._id,
        selectedClientId,
      );
      onSync(updated);
      toast.success("Client allotted successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to allot client");
    } finally {
      setClientSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {vehicleName}
            </p>
            <h3 className="text-xl font-bold text-slate-900">Allot Client</h3>
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
              Select Client
            </label>
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 cursor-pointer"
                >
                  <span
                    className={
                      selectedClientId ? "text-slate-700" : "text-slate-400"
                    }
                  >
                    {selectedClientId
                      ? (() => {
                          const client = clients.find(
                            (c) => c._id === selectedClientId,
                          );
                          return getClientDisplayName(client);
                        })()
                      : "Choose client..."}
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
                    placeholder="Search client..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => {
                        const clientLabel = getClientDisplayName(client);
                        return (
                          <CommandItem
                            key={client._id}
                            value={clientLabel}
                            onSelect={() => {
                              setSelectedClientId(client._id);
                              setClientPopoverOpen(false);
                            }}
                          >
                            {clientLabel}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedClientId === client._id
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

          {(booking.assignedClientSnapshot?.companyName ||
            booking.assignedClientSnapshot?.name) && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              Current allotment:{" "}
              {booking.assignedClientSnapshot.companyName ||
                booking.assignedClientSnapshot.name}
            </div>
          )}

          <button
            onClick={handleAssignClient}
            disabled={clientSaving}
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

export default ClientAllotModal;

