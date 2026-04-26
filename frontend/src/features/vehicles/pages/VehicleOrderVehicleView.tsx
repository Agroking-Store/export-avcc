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

const API_ORIGIN = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");

const STATUS_LABELS: Record<VehicleBookingStatus, string> = {
  pending: "Quotation Pending",
  quotation_uploaded: "Awaiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  payment_done: "Awaiting Chassis/Engine No.",
  chassis_received: "In Transit",
  delivered: "Delivered",
};

const VehicleOrderVehicleView = () => {
  const { id, vehicleIndex } = useParams<{ id: string; vehicleIndex: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [booking, setBooking] = useState<VehicleBookingItem | null>(null);

  // Modal States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDealerInvoiceModalOpen, setIsDealerInvoiceModalOpen] = useState(false);
  const [isDealerInvoiceViewOpen, setIsDealerInvoiceViewOpen] = useState(false);

  const loadData = useCallback(async () => {
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

      setOrder(orderRes);
      setBooking(currentBooking);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  }, [id, vehicleIndex]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const infoCards = [
    {
      icon: Hash,
      label: "Booking Status",
      value: STATUS_LABELS[booking.status],
    },
    {
      icon: IndianRupee,
      label: "Payment Amount",
      value: booking.paymentAmount ? `Rs. ${booking.paymentAmount}` : "-",
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
      icon: FileText,
      label: "Reminder Count",
      value: String(booking.reminderCount || 0),
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
      icon: Receipt,
      label: "Dealer Invoice",
      value: booking.isDealerInvoiceUploaded ? "Uploaded" : "Not Uploaded",
    },
    {
      icon: Hash,
      label: "HSN Code",
      value: booking.hsnCode || "-",
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
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Unit {booking.vehicleIndex + 1}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {order.vehicleSnapshot.brandName} {order.vehicleSnapshot.modelName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.vehicleSnapshot.variant} · {order.vehicleSnapshot.color}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* CRTM DOC MANAGEMENT BUTTON GROUP */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
            >
              <Upload size={14} />
              UPLOAD
            </button>
            <button
              onClick={() => setIsViewModalOpen(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] transition-all hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 active:scale-95"
            >
              <Eye size={14} />
              VIEW LIBRARY
            </button>
          </div>

          {/* DEALER INVOICE BUTTON GROUP */}
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

          <button
            onClick={() => navigate(`/vehicles/orders/${id}/unit-edit/${vehicleIndex}`)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Truck size={16} />
            Edit
          </button>
          <button
          onClick={() => navigate(`/vehicles/orders`)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Orders
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

      {booking.rejectionReason && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-rose-900">Rejection Reason</p>
          <p className="mt-1 text-sm text-rose-700">{booking.rejectionReason}</p>
        </div>
      )}

      {/* QUOTATION SECTION */}
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
            <p className="text-sm text-slate-500">No quotation uploaded yet.</p>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default VehicleOrderVehicleView;

