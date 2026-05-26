import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Anchor,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Container,
  Globe,
  MapPin,
  Package,
  Ship,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatDate } from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";

type ShippedVehicle = {
  _id: string;
  vehicleIndex: number;
  carName: string;
  chassisNo: string;
  piNo: string;
  commercialInvoiceNo: string;
  amount: number;
  lcNo: string;
  lcDate: string;
};

type ShippedContainer = {
  _id: string;
  containerNumber: string;
  vehicles: ShippedVehicle[];
};

type ShippedDetailsResponse = {
  shipment: {
    _id: string;
    customerName: string;
    destinationCountry: string;
    sailingDate?: string;
    arrivalDate?: string;
    shippingLine?: string;
    vesselName?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
  };
  containers: ShippedContainer[];
};

const ShippedVehiclesDetails = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ShippedDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVehicles, setExpandedVehicles] = useState<Record<string, boolean>>({});

  const fetchShippedDetails = async () => {
    if (!shipmentId) return;

    try {
      setLoading(true);
      const response = await shipmentApi.getShippedDetails(shipmentId);
      setData(response);
      
      // Auto-expand all by default or keep them closed. Let's keep them closed and let the user open them.
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shipped details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippedDetails();
  }, [shipmentId]);

  const toggleVehicleExpand = (vehicleId: string) => {
    setExpandedVehicles((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  const formatLCDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "-") return "-";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading shipped details...
      </div>
    );
  }

  if (!data || !data.shipment) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Shipment details not found.
      </div>
    );
  }

  const { shipment, containers } = data;

  const details = [
    { label: "Customer Name", value: shipment.customerName, icon: User, tone: "text-indigo-500" },
    { label: "Destination", value: shipment.destinationCountry, icon: Globe, tone: "text-blue-500" },
    { label: "Port Of Loading", value: shipment.portOfLoading, icon: Anchor, tone: "text-emerald-500" },
    { label: "Port Of Discharge", value: shipment.portOfDischarge, icon: MapPin, tone: "text-rose-500" },
    { label: "Shipping Line", value: shipment.shippingLine, icon: Ship, tone: "text-purple-500" },
    { label: "Vessel Name", value: shipment.vesselName, icon: Package, tone: "text-cyan-500" },
    { label: "Sailing Date", value: formatDate(shipment.sailingDate), icon: Calendar, tone: "text-amber-500" },
    { label: "Arrival Date", value: formatDate(shipment.arrivalDate), icon: Calendar, tone: "text-teal-500" },
  ];

  const InfoBox = ({ label, value, icon: Icon, tone }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        <Icon size={13} className={tone} /> {label}
      </p>
      <p className="text-[13px] font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

  // Compute overall statistics
  const totalVehiclesCount = containers.reduce((sum, c) => sum + (c.vehicles?.length || 0), 0);
  const totalShippedAmount = containers.reduce(
    (sum, c) => sum + (c.vehicles?.reduce((s, v) => s + (v.amount || 0), 0) || 0),
    0
  );

  return (
    <div className="w-full animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 group cursor-default">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Shipment
          </span>
          <span className="font-mono text-base font-black text-white group-hover:text-indigo-300 transition-colors">
            #{shipment._id.slice(-6).toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => navigate("/shipment-planning/shipped-vehicles")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      {/* Shipping Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
          <Ship size={18} className="text-gray-400" />
          <h2 className="text-lg font-bold text-[#1B2559]">Shipping Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {details.map((detail) => (
            <InfoBox key={detail.label} {...detail} />
          ))}
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Vehicles Shipped</p>
          <p className="text-3xl font-black mt-2">{totalVehiclesCount} Units</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Shipped Amount</p>
          <p className="text-3xl font-black mt-2">${totalShippedAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Containers List */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Container size={20} className="text-[#1B2559]" />
          <h2 className="text-lg font-black text-[#1B2559] tracking-wide">Container Wise Shipped Details</h2>
        </div>

        {containers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-400 shadow-sm">
            No containers mapped to this shipment yet.
          </div>
        ) : (
          <div className="space-y-6">
            {containers.map((container) => {
              const containerTotalAmount = container.vehicles?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

              return (
                <div key={container._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-slate-50/60 px-6 py-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Container size={20} className="text-blue-500" />
                      <h3 className="font-black text-[#1B2559] text-base tracking-wide">
                        {container.containerNumber}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span>Vehicles: <strong className="text-[#1B2559]">{container.vehicles?.length || 0}</strong></span>
                      <div className="h-4 w-px bg-slate-300" />
                      <span>Container Total: <strong className="text-emerald-600">${containerTotalAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    {!container.vehicles || container.vehicles.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FB] p-6 text-center text-sm font-semibold text-gray-400">
                        Container Empty
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {container.vehicles.map((vehicle, idx) => {
                          const isExpanded = !!expandedVehicles[vehicle._id];
                          return (
                            <div
                              key={vehicle._id}
                              className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              {/* Header Vehicle Row */}
                              <div className="flex items-center justify-between bg-slate-50/20 p-4 md:px-6">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="bg-blue-100 text-blue-700 font-bold h-8 w-8 rounded-lg flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Car Name</p>
                                      <p className="text-sm font-bold text-[#1B2559]">{vehicle.carName}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commercial Invoice No</p>
                                      <p className="text-sm font-bold text-[#1B2559]">{vehicle.commercialInvoiceNo || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</p>
                                      <p className="text-sm font-bold text-emerald-600">${vehicle.amount ? vehicle.amount.toLocaleString() : "0"}</p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleVehicleExpand(vehicle._id)}
                                  className="ml-4 p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                  title={isExpanded ? "Collapse details" : "Expand details"}
                                >
                                  <ChevronDown
                                    size={20}
                                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </button>
                              </div>

                              {/* Expanded Spread Sheet Style Table */}
                              {isExpanded && (
                                <div className="border-t border-slate-100 bg-white p-4 md:p-6 overflow-x-auto">
                                  <table className="w-full text-center text-sm border-collapse min-w-[800px] border border-slate-200">
                                    <thead>
                                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        <th className="py-2.5 px-4 border border-slate-200">SR NO</th>
                                        <th className="py-2.5 px-4 border border-slate-200">CAR NAME</th>
                                        <th className="py-2.5 px-4 border border-slate-200">CHASSIS NO</th>
                                        <th className="py-2.5 px-4 border border-slate-200">PI NO</th>
                                        <th className="py-2.5 px-4 border border-slate-200">INV NO</th>
                                        <th className="py-2.5 px-4 border border-slate-200">LC DATE</th>
                                        <th className="py-2.5 px-4 border border-slate-200">LC NO</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="text-slate-700 hover:bg-slate-50/30">
                                        <td className="py-3 px-4 font-bold border border-slate-200">{idx + 1}</td>
                                        <td className="py-3 px-4 font-bold border border-slate-200 text-left">{vehicle.carName}</td>
                                        <td className="py-3 px-4 font-mono text-xs border border-slate-200">{vehicle.chassisNo}</td>
                                        <td className="py-3 px-4 font-semibold border border-slate-200">{vehicle.piNo}</td>
                                        <td className="py-3 px-4 font-semibold border border-slate-200">{vehicle.commercialInvoiceNo}</td>
                                        <td className="py-3 px-4 border border-slate-200">{formatLCDate(vehicle.lcDate)}</td>
                                        <td className="py-3 px-4 font-mono text-xs border border-slate-200">{vehicle.lcNo}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippedVehiclesDetails;
