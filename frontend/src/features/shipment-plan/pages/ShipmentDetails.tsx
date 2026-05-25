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
  User,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  formatDate,
  getShipmentVehicleLabel,
  ShippingDetail,
  ShipmentVehicleBooking,
} from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";

const ShipmentDetails = () => {
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

  useEffect(() => {
    fetchShipment();
  }, [shipmentId]);

  const details = shipment
    ? [
        { label: "Customer Name", value: shipment.customerName, icon: User, tone: "text-indigo-500" },
        { label: "Destination", value: shipment.destinationCountry, icon: Globe, tone: "text-blue-500" },
        { label: "Port Of Loading", value: shipment.portOfLoading, icon: Anchor, tone: "text-emerald-500" },
        { label: "Port Of Discharge", value: shipment.portOfDischarge, icon: MapPin, tone: "text-rose-500" },
        { label: "Shipping Line", value: shipment.shippingLine, icon: Ship, tone: "text-purple-500" },
        { label: "Vessel Name", value: shipment.vesselName, icon: Package, tone: "text-cyan-500" },
        { label: "Sailing Date", value: formatDate(shipment.sailingDate), icon: Calendar, tone: "text-amber-500" },
        { label: "Arrival Date", value: formatDate(shipment.arrivalDate), icon: Calendar, tone: "text-teal-500" },
      ]
    : [];

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

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {shipment._id.slice(-6).toUpperCase()}
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
          {details.map((detail) => (
            <InfoBox key={detail.label} {...detail} />
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
        <div className="p-6 md:p-8 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Container size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-[#1B2559]">Container Management</h2>
            </div>
            <button
              onClick={() => setIsContainerModalOpen(true)}
              className="cursor-pointer flex w-fit items-center gap-2 px-5 py-2.5 bg-[#5243EF] hover:bg-[#4335d6] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus size={17} strokeWidth={3} />
              Add Container
            </button>
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
                    <button
                      onClick={() => openVehicleModal(container._id)}
                      className="cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#5243EF] hover:text-[#4335d6]"
                    >
                      <Plus size={14} strokeWidth={3} />
                      Add Vehicle
                    </button>
                  </div>

                  <div className="mt-6 min-h-16 rounded-xl border border-dashed border-gray-200 bg-white/70 p-4">
                    {container.vehicleBookingIds.length === 0 ? (
                      <p className="py-2 text-center text-[11px] font-semibold text-gray-400">
                        Container Empty
                      </p>
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
                            </div>
                            <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                              Unit {vehicle.vehicleIndex + 1}
                            </span>
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

      {isContainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">Add Container</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Existing containers are visible below.
                </p>
              </div>
              <button
                onClick={() => setIsContainerModalOpen(false)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700"
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
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Containers
                </p>
                <div className="flex flex-wrap gap-2">
                  {(shipment.containers || []).length === 0 ? (
                    <span className="text-xs font-semibold text-gray-400">
                      No containers yet
                    </span>
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

      {vehicleModalContainerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">Add Vehicle</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {vehicleModalContainer?.containerNumber} container
                </p>
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
