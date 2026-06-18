import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Anchor,
  ArrowLeft,
  Calendar,
  Container,
  Globe,
  MapPin,
  Package,
  Plus,
  Ship,
  Trash2,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  formatDate,
  getShipmentVehicleLabel,
  ShippingDetail,
  ShipmentVehicleBooking,
} from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";
import { useAuth } from "../../../hooks/useAuth";

// Types extracted from ShippedVehiclesDetails.tsx

// Helper to format LC dates (DD-MM-YY)
const formatLCDate = (dateStr?: string) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};
type ShippedVehicle = {
  _id: string;
  vehicleIndex: number;
  carName: string;
  chassisNo: string;
  referenceNo: string;
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

const ShipmentDetails = () => {
  const { isClient } = useAuth();
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<ShippingDetail | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<ShipmentVehicleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [containerName, setContainerName] = useState("");
  const [vehicleModalContainerId, setVehicleModalContainerId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [saving, setSaving] = useState(false);

  // State to control expanded vehicle rows
  const [expandedVehicles, setExpandedVehicles] = useState<Record<string, boolean>>({});

  const toggleVehicleExpand = (vehicleId: string) =>
    setExpandedVehicles((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));

  // New state for shipped vehicle details
  const [shippedDetails, setShippedDetails] = useState<ShippedDetailsResponse | null>(null);

  const fetchShipment = async () => {
    if (!shipmentId) return;
    try {
      setLoading(true);
      const [shipmentData, vehiclesData] = await Promise.all([
        shipmentApi.getById(shipmentId),
        shipmentApi.getAvailableVehicles(),
      ]);
      setShipment(shipmentData);
      setAvailableVehicles(vehiclesData || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shipment");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed shipped data (vehicles with amounts, LC, etc.)
  const fetchShippedDetails = async () => {
    if (!shipmentId) return;
    try {
      const response = await shipmentApi.getShippedDetails(shipmentId);
      setShippedDetails(response);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shipped vehicle details");
    }
  };

  useEffect(() => {
    fetchShipment();
    fetchShippedDetails();
  }, [shipmentId]);

  const handleAddContainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId) return;
    const trimmedName = containerName.trim();
    if (!trimmedName) {
      toast.error("Container name is required");
      return;
    }
    try {
      setSaving(true);
      const updatedShipment = await shipmentApi.addContainer(shipmentId, trimmedName);
      setShipment(updatedShipment);
      setContainerName("");
      setIsContainerModalOpen(false);
      toast.success("Container added successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add container");
    } finally {
      setSaving(false);
    }
  };

  const openVehicleModal = async (containerId: string) => {
    try {
      const vehicles = await shipmentApi.getAvailableVehicles();
      setAvailableVehicles(vehicles || []);
      setVehicleModalContainerId(containerId);
      setSelectedVehicleId("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shipped vehicles");
    }
  };

  const handleDeleteContainer = async (containerId: string) => {
    if (!shipmentId) return;
    if (!window.confirm("Are you sure you want to delete this container?")) return;
    try {
      setSaving(true);
      const updatedShipment = await shipmentApi.deleteContainer(shipmentId, containerId);
      const vehicles = await shipmentApi.getAvailableVehicles();
      setShipment(updatedShipment);
      setAvailableVehicles(vehicles || []);
      await fetchShippedDetails();
      toast.success("Container deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete container");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVehicle = async (containerId: string, vehicleBookingId: string) => {
    if (!shipmentId) return;
    try {
      setSaving(true);
      const updatedShipment = await shipmentApi.removeVehicleFromContainer(
        shipmentId,
        containerId,
        vehicleBookingId,
      );
      const vehicles = await shipmentApi.getAvailableVehicles();
      setShipment(updatedShipment);
      setAvailableVehicles(vehicles || []);
      await fetchShippedDetails();
      toast.success("Vehicle removed from container");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId || !vehicleModalContainerId || !selectedVehicleId) {
      toast.error("Select a vehicle first");
      return;
    }
    try {
      setSaving(true);
      const updatedShipment = await shipmentApi.addVehicleToContainer(
        shipmentId,
        vehicleModalContainerId,
        selectedVehicleId,
      );
      const vehicles = await shipmentApi.getAvailableVehicles();
      setShipment(updatedShipment);
      setAvailableVehicles(vehicles || []);
      setVehicleModalContainerId(null);
      setSelectedVehicleId("");
      await fetchShippedDetails();
      toast.success("Vehicle added to container");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add vehicle");
    } finally {
      setSaving(false);
    }
  };

  const vehicleModalContainer = shipment?.containers?.find(
    (container) => container._id === vehicleModalContainerId,
  );

  const InfoBox = ({ label, value, icon: Icon, tone }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        <Icon size={13} className={tone} /> {label}
      </p>
      <p className="text-[13px] font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading shipment details...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Shipment not found.
      </div>
    );
  }

  // Summary data derived from shippedDetails (fallback to 0)
  const totalVehiclesCount = shippedDetails?.containers?.reduce((sum, c) => sum + (c.vehicles?.length || 0), 0) ?? 0;
  const totalShippedAmount = shippedDetails?.containers?.reduce(
    (sum, c) =>
      sum + (c.vehicles?.reduce((s, v) => s + (v.amount || 0), 0) || 0),
    0,
  ) ?? 0;

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 group cursor-default">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Shipment</span>
          <span className="font-mono text-base font-black text-white group-hover:text-indigo-300 transition-colors">
            #{shipment._id.slice(-6).toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => navigate("/shipment-planning/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
          <Ship size={18} className="text-gray-400" />
          <h2 className="text-lg font-bold text-[#1B2559]">Shipping Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Customer Name", value: shipment.customerName, icon: User, tone: "text-indigo-500" },
            { label: "Destination", value: shipment.destinationCountry, icon: Globe, tone: "text-blue-500" },
            { label: "Port Of Loading", value: shipment.portOfLoading, icon: Anchor, tone: "text-emerald-500" },
            { label: "Port Of Discharge", value: shipment.portOfDischarge, icon: MapPin, tone: "text-rose-500" },
            { label: "Shipping Line", value: shipment.shippingLine, icon: Ship, tone: "text-purple-500" },
            { label: "Vessel Name", value: shipment.vesselName, icon: Package, tone: "text-cyan-500" },
            { label: "Sailing Date", value: formatDate(shipment.sailingDate), icon: Calendar, tone: "text-amber-500" },
            { label: "Arrival Date", value: formatDate(shipment.arrivalDate), icon: Calendar, tone: "text-teal-500" },
          ].map((detail) => (
            <InfoBox key={detail.label} {...detail} />
          ))}
        </div>
      </div>

      {/* Summary Cards for Vehicles */}
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

      {/* Container Management (existing UI) */}
      <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
        <div className="p-6 md:p-8 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Container size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-[#1B2559]">Container Management</h2>
            </div>
            {!isClient && (
              <button
                onClick={() => setIsContainerModalOpen(true)}
                className="cursor-pointer flex w-fit items-center gap-2 px-5 py-2.5 bg-[#5243EF] hover:bg-[#4335d6] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95"
              >
                <Plus size={17} strokeWidth={3} />
                Add Container
              </button>
            )}
          </div>
        </div>

        <div className="px-6 md:px-8 pb-8">
          {(shipment.containers || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FB] p-10 text-center text-sm font-semibold text-gray-400">
              No containers added yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(shipment.containers || []).map((container) => (
                <div
                  key={container._id}
                  className="rounded-2xl border border-gray-100 bg-[#F8F9FB] p-5 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Container size={18} className="text-blue-500" />
                      <h3 className="font-black text-[#1B2559] tracking-wide">
                        {container.containerNumber}
                      </h3>
                    </div>
                    {!isClient && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openVehicleModal(container._id)}
                          className="cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#5243EF] hover:text-[#4335d6]"
                        >
                          <Plus size={14} strokeWidth={3} />
                          Add Vehicle
                        </button>
                        <button
                          onClick={() => handleDeleteContainer(container._id)}
                          disabled={saving}
                          className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete container"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 min-h-16 rounded-xl border border-dashed border-gray-200 bg-white/70 p-4">
                    {container.vehicleBookingIds.length === 0 ? (
                      <p className="py-2 text-center text-[11px] font-semibold text-gray-400">Container Empty</p>
                    ) : (
                      <div className="space-y-3">
                        {container.vehicleBookingIds.map((vehicle) => (
                          <div
                            key={vehicle._id}
                            className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-bold text-[#1B2559]">
                                {getShipmentVehicleLabel(vehicle)}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                                {vehicle.chassisNumber || "-"} / {vehicle.engineNumber || "-"}
                              </p>
                              {vehicle.referenceNo && (
                                <p className="text-[10px] font-semibold font-mono text-amber-700 mt-0.5">
                                  Ref: {vehicle.referenceNo}
                                </p>
                              )}
                            </div>
                            {!isClient && (
                              <button
                                onClick={() => handleRemoveVehicle(container._id, vehicle._id)}
                                disabled={saving}
                                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove vehicle"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Detailed Vehicle Table (merged from ShippedVehiclesDetails) */}
      {shippedDetails && shippedDetails.containers && shippedDetails.containers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#1B2559] mb-4">Container Wise Shipped Details</h3>
          {shippedDetails.containers.map((container) => {
            const containerTotalAmount = container.vehicles?.reduce((sum, v) => sum + (v.amount || 0), 0) ?? 0;
            return (
              <div key={container._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="bg-slate-50/60 px-6 py-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Container size={20} className="text-blue-500" />
                    <h3 className="font-black text-[#1B2559] text-base tracking-wide">{container.containerNumber}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>Vehicles: <strong className="text-[#1B2559]">{container.vehicles?.length || 0}</strong></span>
                    <div className="h-4 w-px bg-slate-300" />
                    <span>Container Total: <strong className="text-emerald-600">${containerTotalAmount.toLocaleString()}</strong></span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  {(!container.vehicles || container.vehicles.length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FB] p-6 text-center text-sm font-semibold text-gray-400">
                      Container Empty
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {container.vehicles.map((vehicle, idx) => (
                        <div key={vehicle._id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                          {/* Header Vehicle Row */}
                          <div className="flex items-center justify-between bg-slate-50/20 p-4 md:px-6">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-blue-100 text-blue-700 font-bold h-8 w-8 rounded-lg flex items-center justify-center text-xs">
                                {idx + 1}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Car Name</p>
                                  <p className="text-sm font-bold text-[#1B2559]">{vehicle.carName}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference No.</p>
                                  <p className="text-sm font-bold font-mono text-amber-700">{vehicle.referenceNo || "-"}</p>
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
                              <button
                                type="button"
                                onClick={() => toggleVehicleExpand(vehicle._id)}
                                className="ml-4 p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                title={expandedVehicles[vehicle._id] ? "Collapse details" : "Expand details"}
                              >
                                <ChevronDown
                                  size={20}
                                  className={`transition-transform duration-300 ${expandedVehicles[vehicle._id] ? "rotate-180" : ""}`}
                                />
                              </button>
                            </div>
                          </div>
                          {/* Expanded Table */}
                          {expandedVehicles[vehicle._id] && (
                            <div className="border-t border-slate-100 bg-white p-4 md:p-6 overflow-x-auto">
                              <table className="w-full text-center text-sm border-collapse min-w-[900px] border border-slate-200">
                                <thead>
                                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-2.5 px-4 border border-slate-200">SR NO</th>
                                    <th className="py-2.5 px-4 border border-slate-200">CAR NAME</th>
                                    <th className="py-2.5 px-4 border border-slate-200">REF NO</th>
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
                                    <td className="py-3 px-4 font-mono text-xs font-semibold text-amber-700 border border-slate-200">{vehicle.referenceNo || "-"}</td>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals for adding container and vehicle (unchanged) */}
      {!isClient && isContainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">Add Container</h3>
                <p className="mt-1 text-sm text-gray-500">Existing containers are visible below.</p>
              </div>
              <button
                onClick={() => setIsContainerModalOpen(false)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddContainer} className="space-y-5 p-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
                  <Container size={14} className="text-blue-500" /> Container Name
                </label>
                <input
                  value={containerName}
                  onChange={(event) => setContainerName(event.target.value)}
                  className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="ABCD123"
                />
              </div>
              <div className="rounded-2xl border border-gray-100 bg-[#F8F9FB] p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Containers</p>
                <div className="flex flex-wrap gap-2">
                  {(shipment.containers || []).length === 0 ? (
                    <span className="text-xs font-semibold text-gray-400">No containers yet</span>
                  ) : (
                    shipment.containers!.map((container) => (
                      <span
                        key={container._id}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1B2559] shadow-sm"
                      >
                        {container.containerNumber}
                      </span>
                    ))
                 )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsContainerModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer flex items-center gap-2 rounded-xl bg-[#5243EF] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#4335d6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} /> Add Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isClient && vehicleModalContainerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">Add Vehicle</h3>
                <p className="mt-1 text-sm text-gray-500">{vehicleModalContainer?.containerNumber} container</p>
              </div>
              <button
                onClick={() => setVehicleModalContainerId(null)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddVehicle} className="space-y-5 p-6">
              {availableVehicles.length === 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold text-amber-700">
                  No shipped vehicles are available for container assignment.
                </div>
              ) : (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider">
                    <Package size={14} className="text-indigo-500" /> Select Vehicle
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(event) => setSelectedVehicleId(event.target.value)}
                    className="w-full bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl px-4 py-3 text-sm text-[#4A5568] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Select shipped vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {getShipmentVehicleLabel(vehicle)} - {vehicle.chassisNumber || "No chassis"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setVehicleModalContainerId(null)}
                  className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || availableVehicles.length === 0}
                  className="cursor-pointer flex items-center gap-2 rounded-xl bg-[#5243EF] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#4335d6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} /> Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentDetails;