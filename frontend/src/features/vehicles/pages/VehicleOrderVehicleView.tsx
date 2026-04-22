import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  ClipboardList,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Fuel,
  Globe,
  Hash,
  Package,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import { bookingApi } from "../../../services/bookingApi";
import VehicleDocumentModal from "../components/VehicleDocumentModal";
import VehicleDocumentViewModal from "../components/VehicleDocumentViewModal";

const VehicleOrderVehicleView = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [status, setStatus] = useState("New");
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const expandedIndex = parseInt(
    searchParams.get("expandedIndex") || vehicleIndex || "0",
    10,
  );
  const srNo = searchParams.get("srNo") || String(expandedIndex + 1);

  const loadVehicleDetails = useCallback(async () => {
    try {
      setLoading(true);
      const bookingsRes = await bookingApi.getAll();
      const bookings = bookingsRes.data?.data || bookingsRes.data || [];

      const matchingBooking = bookings.find(
        (booking: any) =>
          (booking.orderId === orderId || booking.orderId?._id === orderId) &&
          booking.vehicles?.some((vehicle: any) => String(vehicle.srNo) === srNo),
      );

      if (!matchingBooking) {
        throw new Error("Booking not found for this vehicle");
      }

      setStatus(matchingBooking.status || "Booked");
      const bookedVehicle = matchingBooking.vehicles.find(
        (vehicle: any) => String(vehicle.srNo) === srNo,
      );
      setVehicleData(bookedVehicle);
    } catch (error: any) {
      console.error("Error loading vehicle details", error);
      toast.error(error.message || "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  }, [orderId, srNo]);

  useEffect(() => {
    loadVehicleDetails();
  }, [loadVehicleDetails]);

  const InfoBox = ({ label, value, icon: Icon, mono }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className={`text-sm font-semibold text-[#2D3748] ${mono ? "font-mono" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Loading Specs...
        </span>
      </div>
    );
  }

  if (!vehicleData) return null;

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
            <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors uppercase">
              UNIT-{srNo}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] transition-all hover:bg-indigo-700"
            >
              <Upload size={14} />
              UPLOAD
            </button>

            <button
              onClick={() => setIsViewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] transition-all hover:bg-slate-50 hover:text-indigo-600"
            >
              <Eye size={14} />
              VIEW LIBRARY
            </button>

            <button
              onClick={() => {
                const params = new URLSearchParams({
                  srNo,
                  expandedIndex: String(expandedIndex),
                  name: vehicleData?.name || "",
                  color: vehicleData?.color || "",
                });
                navigate(
                  `/vehicles/orders/${orderId}/unit-edit/${expandedIndex}?${params.toString()}`,
                );
              }}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold text-[10px] transition-all hover:bg-indigo-50"
            >
              <Edit2 size={14} />
              EDIT
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(`/vehicles/orders/${orderId}`)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-[#1B2559]">Vehicle Details</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <AlertCircle size={14} /> Booking Record
              </div>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Car size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">
                    Model / variant
                  </p>
                  <h3 className="text-2xl font-bold text-[#2D3748]">
                    {vehicleData.name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoBox label="HSN Code" value={vehicleData.hsnCode} icon={Hash} />
                <InfoBox label="Chassis Number" value={vehicleData.chassisNo} icon={Hash} mono />
                <InfoBox label="Engine Number" value={vehicleData.engineNo} icon={Package} mono />
                <InfoBox label="Color" value={vehicleData.color} icon={Package} />
                <InfoBox label="Fuel Type" value={vehicleData.fuelType} icon={Fuel} />
                <InfoBox label="Origin" value={vehicleData.countryOfOrigin} icon={Globe} />
                <InfoBox label="Manufacture Year" value={vehicleData.yom} icon={Package} />
                <InfoBox label="Engine Capacity" value={vehicleData.engineCapacity} icon={Package} />
                <InfoBox label="Booking Status" value={status} icon={AlertCircle} />
                <InfoBox
                  label="Documentation"
                  value={
                    vehicleData?.isBVUploaded
                      ? "Fully Verified"
                      : vehicleData?.isCRTMUploaded
                        ? "CRTM Uploaded"
                        : "Pending"
                  }
                  icon={FileText}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <DollarSign size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Financial Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  FOB Amount
                </p>
                <p className="text-3xl font-black text-indigo-600">
                  {vehicleData?.fobAmount
                    ? `$${Number(vehicleData.fobAmount).toLocaleString()}`
                    : "-"}
                </p>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Freight Charges
                </p>
                <p className="text-3xl font-black text-slate-700">
                  {vehicleData?.freight
                    ? `$${Number(vehicleData.freight).toLocaleString()}`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDocModalOpen && (
        <VehicleDocumentModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          vehicle={vehicleData}
          onSuccess={() => {
            setIsDocModalOpen(false);
            loadVehicleDetails();
          }}
        />
      )}

      {isViewModalOpen && (
        <VehicleDocumentViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          vehicle={vehicleData}
        />
      )}
    </div>
  );
};

export default VehicleOrderVehicleView;
