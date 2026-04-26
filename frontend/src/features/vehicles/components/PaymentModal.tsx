import { useEffect, useState } from "react";
import { X, IndianRupee } from "lucide-react";
import { toast } from "react-toastify";
import {
  VehicleBookingItem,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: VehicleBookingItem | null;
  onSync: (updated: VehicleBookingItem) => void;
}

const PaymentModal = ({ isOpen, onClose, booking, onSync }: Props) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setPaymentAmount(booking.paymentAmount ? String(booking.paymentAmount) : "");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const vehicleSnapshot = (booking as any).orderId?.vehicleSnapshot;
  const vehicleName = vehicleSnapshot
    ? `${vehicleSnapshot.brandName || ""} ${vehicleSnapshot.modelName || ""}`.trim()
    : "Vehicle";

  const handleConfirmPayment = async () => {
    if (!booking) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Dealer amount is required");
      return;
    }

    try {
      setPaymentSaving(true);
      const updated = await vehicleBookingApi.confirmPayment(
        booking._id,
        amount,
      );
      onSync(updated);
      toast.success("Payment saved and booking confirmed");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Payment confirmation failed");
    } finally {
      setPaymentSaving(false);
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
            <h3 className="text-xl font-bold text-slate-900">
              Confirm Booking Payment
            </h3>
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
              Amount paid to dealer
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              placeholder="Enter payment amount"
            />
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={paymentSaving}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IndianRupee size={16} />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

