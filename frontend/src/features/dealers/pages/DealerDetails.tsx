import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ClipboardList,
  Hash,
  Landmark,
  CreditCard,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiConfig } from "@/config/apiConfig";

const InfoBox = ({ label, value, icon: Icon }: any) => (
  <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
    <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
      {Icon && <Icon size={12} />} {label}
    </p>
    <p className="text-sm font-semibold text-[#2D3748]">{value || "-"}</p>
  </div>
);

const getStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "payment_done":
    case "approved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "chassis_received":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "pending":
    case "quotation_details_pending":
    case "quotation_uploaded":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const DealerDetails = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<any>(null);
  const [dealerVehicles, setDealerVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/dealers/${id}`)
      .then((res) => {
        setDealer(res.data.data);
        setLoading(false);
      })
      .catch((error: any) => {
        toast.error(error.response?.data?.message || "Failed to load dealer");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    setVehiclesLoading(true);

    axios
      .get(`${API_URL}/dealers/${id}/getVehicles`)
      .then((res) => {
        const vehicles = res.data.data;

        if (!vehicles.length) {
          toast.info("No vehicles found");
        }

        setDealerVehicles(vehicles);
      })
      .catch((error: any) => {
        toast.error(error.response?.data?.message || "Failed to load vehicles");
      })
      .finally(() => {
        setVehiclesLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Loading Profile...
        </span>
      </div>
    );

  if (!dealer)
    return (
      <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">
        Dealer not found
      </div>
    );

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {dealer.dealerId || `DL-${dealer._id.slice(-4)}`}
          </span>
        </div>

        <button
          onClick={() => navigate("/dealers/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      {/* FULL WIDTH CONTENT */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-gray-800 pb-4">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559] dark:text-white">
                Dealer Information
              </h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-black border border-indigo-100 dark:border-indigo-800 transition-transform group-hover:scale-105">
                  {dealer.name?.charAt(0) || "D"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-widest mb-0.5">
                    Dealer Name
                  </p>
                  <h3 className="text-2xl font-bold text-[#2D3748] dark:text-white group-hover:text-indigo-600 transition-colors">
                    {dealer.name}
                  </h3>
                </div>
              </div>

              {/* UPDATED GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBox
                  label="Phone Number"
                  value={dealer.contact}
                  icon={Phone}
                />

                <InfoBox
                  label="Representative Name"
                  value={dealer.representativeName}
                  icon={User}
                />

                <InfoBox
                  label="Email Address"
                  value={dealer.email}
                  icon={Mail}
                />
                <InfoBox
                  label="GST Number"
                  value={dealer.gstNumber}
                  icon={Hash}
                />
                <InfoBox label="Address" value={dealer.address} icon={MapPin} />

                <InfoBox
                  label="Bank Name"
                  value={dealer.bankDetails?.bankName}
                  icon={Landmark}
                />
                <InfoBox
                  label="Account Number"
                  value={dealer.bankDetails?.accountNo}
                  icon={CreditCard}
                />
                <InfoBox
                  label="Branch / IFSC"
                  value={dealer.bankDetails?.branchIfsc}
                  icon={Hash}
                />
              </div>
            </div>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="mt-6 bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">Allotted Vehicles Ledger</h3>
              <p className="text-xs text-slate-500">List of vehicles assigned to this dealer and their financial breakdown.</p>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1">
              {dealerVehicles.length} {dealerVehicles.length === 1 ? "Vehicle" : "Vehicles"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-sm text-left">
              {/* HEADER */}
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Engine / Chassis</th>
                  <th className="px-6 py-4">Vehicle Name</th>
                  <th className="px-6 py-4">Variant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Price (Basic)</th>
                  <th className="px-6 py-4">Booking Amt</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Remaining</th>
                  <th className="px-6 py-4">Delivery Date</th>
                </tr>
              </thead>
              {/* BODY */}
              <tbody className="divide-y divide-slate-100 bg-white">
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
                      Loading Vehicles Ledger...
                    </td>
                  </tr>
                ) : dealerVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
                      No Allotted Vehicles found
                    </td>
                  </tr>
                ) : (
                  dealerVehicles.map((v: any, index: number) => {
                    const hasRemaining = v.basicValue && (v.remainingBalance || 0) > 0;
                    return (
                      <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Serial Number */}
                        <td className="px-6 py-4 font-medium text-slate-400">
                          {index + 1}
                        </td>

                        {/* Engine / Chassis */}
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">
                          <span className="block">E: {v.engineNumber || "-"}</span>
                          <span className="block text-[10px] text-slate-400">C: {v.chassisNumber || "-"}</span>
                        </td>

                        {/* Brand_Model */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {v.brandName || "-"}_{v.modelName || "-"}
                        </td>

                        {/* Variant */}
                        <td className="px-6 py-4 text-slate-600">{v.variant || "-"}</td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(v.status)}`}>
                            {v.status ? v.status.replace(/_/g, " ").toUpperCase() : "PENDING"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {v.basicValue ? `₹${v.basicValue.toLocaleString("en-IN")}` : "—"}
                        </td>

                        {/* Booking Amt */}
                        <td className="px-6 py-4 text-slate-600">
                          {v.bookingAmount ? `₹${v.bookingAmount.toLocaleString("en-IN")}` : "—"}
                        </td>

                        {/* Paid */}
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          {v.amountPaid ? `₹${v.amountPaid.toLocaleString("en-IN")}` : "—"}
                        </td>

                        {/* Remaining */}
                        <td className={`px-6 py-4 font-bold ${hasRemaining ? "text-rose-600" : "text-emerald-600"}`}>
                          {v.basicValue ? `₹${(v.remainingBalance || 0).toLocaleString("en-IN")}` : "—"}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(v.deliveryDate || v.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;
