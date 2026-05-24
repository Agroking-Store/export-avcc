import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Eye,
  FileText,
  Fuel,
  Globe,
  Hash,
  IndianRupee,
  Package,
  ShieldCheck,
  Truck,
  Upload,
  FileCheck,
  Receipt,
  X,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiConfig } from "../../../config/apiConfig";
import { vehicleManagementApi } from "../vehicleManagementApi";
import {
  VehicleBookingItem,
  VehicleBookingStatus,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import VehicleBookingDocumentModal from "../components/VehicleBookingDocumentModal";
import VehicleBookingDocumentViewModal from "../components/VehicleBookingDocumentViewModal";
import VehicleDealerInvoiceModal from "../components/VehicleDealerInvoiceModal";
import VehicleDealerInvoiceViewModal from "../components/VehicleDealerInvoiceViewModal";
import { useAuth } from "../../../hooks/useAuth";

const API_ORIGIN = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");

const STATUS_LABELS: Record<VehicleBookingStatus, string> = {
  pending: "Quotation Pending",
  quotation_details_pending: "Costing Details Pending",
  quotation_uploaded: "Waiting for Approval",
  approved: "Approved",
  rejected: "Rejected",
  payment_done: "Awaiting Chassis/Engine No.",
  chassis_received: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
};

const VehicleOrderVehicleView = () => {
  const { id, vehicleIndex } = useParams<{
    id: string;
    vehicleIndex: string;
  }>();
  const navigate = useNavigate();
  const { isSourcingTeam, isClient, isAdmin } = useAuth();

  // Permissions
  const canEditVehicle = !isSourcingTeam && !isClient;
  const showFinancials = !isClient; // Hide Ledger and Pricing for client
  const showSensitiveInfo = !isClient; // Hide HSN, Country of Origin, etc for client

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [booking, setBooking] = useState<VehicleBookingItem | null>(null);

  // Modal States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDealerInvoiceModalOpen, setIsDealerInvoiceModalOpen] =
    useState(false);
  const [isDealerInvoiceViewOpen, setIsDealerInvoiceViewOpen] = useState(false);

  // Payment Ledger Modal States
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [recordReference, setRecordReference] = useState("");
  const [recordRemarks, setRecordRemarks] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || vehicleIndex === undefined) return;

    try {
      setLoading(true);
      const [orderRes, bookingRes] = await Promise.all([
        vehicleManagementApi.getVehicleOrderById(id),
        vehicleBookingApi.getByOrder(id),
      ]);

      const currentBooking =
        bookingRes.find((item) => item.vehicleIndex === Number(vehicleIndex)) ||
        null;

      setOrder(orderRes);
      setBooking(currentBooking);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load vehicle details",
      );
    } finally {
      setLoading(false);
    }
  }, [id, vehicleIndex]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    const amount = Number(recordAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    try {
      setRecordingPayment(true);
      const updated = await vehicleBookingApi.addPayment(booking._id, {
        amount,
        date: recordDate,
        reference: recordReference,
        remarks: recordRemarks,
      });
      setBooking(updated);
      toast.success("Payment recorded successfully");
      setIsRecordPaymentOpen(false);
      setRecordAmount("");
      setRecordReference("");
      setRecordRemarks("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const quotationUrl = useMemo(() => {
    if (!booking?.quotationFile) return "";
    return `${API_ORIGIN}${booking.quotationFile}`;
  }, [booking?.quotationFile]);

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

  // Filtered Info Cards based on role
  const infoCards = [
    {
      icon: Hash,
      label: "Booking Status",
      value: STATUS_LABELS[booking.status],
      adminOnly: true,
    },
    {
      icon: IndianRupee,
      label: "Payment Amount",
      value: booking.paymentAmount ? `Rs. ${booking.paymentAmount}` : "-",
      adminOnly: true,
    },
    {
      icon: ShieldCheck,
      label: "Engine Number",
      value: booking.engineNumber || "-",
    },
    {
      icon: Truck,
      label: "Chassis Number",
      value: booking.chassisNumber || "-",
    },
    {
      icon: FileCheck,
      label: "Documentation",
      value: booking.isBVUploaded
        ? "Fully Verified"
        : booking.isCRTMUploaded
          ? "CRTM Uploaded"
          : "Pending",
    },
    {
      icon: Hash,
      label: "Commercial HSN",
      value: booking.commercialHsnCode || booking.hsnCode || "-",
      adminOnly: true,
    },
    {
      icon: Hash,
      label: "Export HSN",
      value: booking.exportHsnCode || booking.hsnCode || "-",
      adminOnly: true,
    },
    {
      icon: Fuel,
      label: "Fuel Type",
      value: booking.fuelType || "-",
    },
    {
      icon: Globe,
      label: "Country of Origin",
      value: booking.countryOfOrigin || "-",
      adminOnly: true,
    },
    {
      icon: Calendar,
      label: "Year of Manufacture",
      value: booking.yom || "-",
    },
    {
      icon: Package,
      label: "Engine Capacity",
      value: booking.engineCapacity || "-",
    },
  ].filter((card) => !isClient || !card.adminOnly);

  const vehicleName =
    `${order.vehicleSnapshot.brandName || ""} ${order.vehicleSnapshot.modelName || ""}`.trim();

  const basicValue = booking.quotationDetails?.netCost?.basicValue || 0;
  const bookingAmount = booking.bookingAmount || 0;
  const payments = booking.payments || [];
  const totalAmountPaid =
    payments.length > 0
      ? payments.reduce((sum, p) => sum + p.amount, 0)
      : booking.paymentAmount || 0;
  const remainingToPay =
    basicValue > 0 ? basicValue - bookingAmount - totalAmountPaid : 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {vehicleName}
          </p> */}
          <h1 className="text-2xl font-bold text-slate-900">
            {order.vehicleSnapshot.brandName} {order.vehicleSnapshot.modelName}
          </h1>
          {/* <p className="mt-1 text-sm text-slate-500">
            {order.vehicleSnapshot.variant} · {order.vehicleSnapshot.color}
          </p> */}
          <h2 className="mt-1 font-bold text-slate-700 text-blue-700">
            {order.vehicleSnapshot.variant} · {order.vehicleSnapshot.color}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsViewModalOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] transition-all hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 active:scale-95"
          >
            <Eye size={14} />
            VIEW LIBRARY
          </button>

          {!isClient && (
            <>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
                >
                  <Upload size={14} />
                  UPLOAD
                </button>
              </div>

              <div className="flex items-center gap-2 bg-purple-50 p-1.5 rounded-2xl border border-purple-200 shadow-sm">
                <button
                  onClick={() => setIsDealerInvoiceModalOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-[10px] transition-all hover:bg-purple-700 hover:shadow-md active:scale-95"
                >
                  <Upload size={14} />
                  DEALER INVOICE
                </button>
                <button
                  onClick={() => setIsDealerInvoiceViewOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] transition-all hover:bg-slate-50 hover:text-purple-600 hover:border-purple-100 active:scale-95"
                >
                  <Eye size={14} />
                  VIEW INVOICE
                </button>
              </div>
            </>
          )}

          {canEditVehicle && (
            <button
              onClick={() =>
                navigate(`/vehicles/orders/${id}/unit-edit/${vehicleIndex}`)
              }
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Truck size={16} />
              Edit
            </button>
          )}
          <button
            onClick={() => navigate(`/vehicles/orders`)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {infoCards.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <Icon size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">
                {label}
              </p>
            </div>
            <p className="text-base font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* FINANCIAL LEDGER - Admin Only */}
      {showFinancials && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Financial Ledger
              </h2>
              <p className="text-sm text-slate-500">
                Track vehicle value, booking, and full payment details.
              </p>
            </div>
            {!isSourcingTeam && (
              <button
                onClick={() => setIsRecordPaymentOpen(true)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 hover:shadow-md"
              >
                Record Payment
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Vehicle Price (Basic)
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {basicValue
                  ? `₹${basicValue.toLocaleString("en-IN")}`
                  : "Costing Pending"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Booking Amount
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {bookingAmount
                  ? `₹${bookingAmount.toLocaleString("en-IN")}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Paid
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                ₹{totalAmountPaid.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Remaining Balance
              </p>
              <p
                className={`mt-1 text-xl font-bold ${remainingToPay <= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                ₹{remainingToPay.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Reference/Receipt</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {payments.length > 0 ? (
                  payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{p.remarks || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-xs text-slate-400 uppercase tracking-wider font-semibold"
                    >
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION REASON */}
      {booking.rejectionReason && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-rose-900">
            Rejection Reason
          </p>
          <p className="mt-1 text-sm text-rose-700">
            {booking.rejectionReason}
          </p>
        </div>
      )}

      {/* QUOTATION SECTION - Admin Only */}
      {!isClient && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quotation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Uploaded file for this vehicle unit.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {booking.quotationFile ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
                  <FileText size={16} />
                  Quotation uploaded
                </div>
                <button
                  onClick={() => window.open(quotationUrl, "_blank")}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Eye size={16} />
                  View quotation
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No quotation uploaded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {isDocModalOpen && booking && (
        <VehicleBookingDocumentModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          booking={booking}
          onSuccess={() => {
            setIsDocModalOpen(false);
            loadData();
          }}
        />
      )}

      {isViewModalOpen && booking && (
        <VehicleBookingDocumentViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          booking={booking}
        />
      )}

      {isDealerInvoiceModalOpen && booking && (
        <VehicleDealerInvoiceModal
          isOpen={isDealerInvoiceModalOpen}
          onClose={() => setIsDealerInvoiceModalOpen(false)}
          booking={booking}
          onSuccess={() => {
            setIsDealerInvoiceModalOpen(false);
            loadData();
          }}
        />
      )}

      {isDealerInvoiceViewOpen && booking && (
        <VehicleDealerInvoiceViewModal
          isOpen={isDealerInvoiceViewOpen}
          onClose={() => setIsDealerInvoiceViewOpen(false)}
          booking={booking}
        />
      )}

      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Record Subsequent Payment
                </h3>
                <p className="text-xs text-slate-500">{vehicleName}</p>
              </div>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 150000"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Reference / UT No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN987654321"
                  value={recordReference}
                  onChange={(e) => setRecordReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Part payment"
                  value={recordRemarks}
                  onChange={(e) => setRecordRemarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {recordingPayment ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleOrderVehicleView;
