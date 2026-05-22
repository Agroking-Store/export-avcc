import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Package, Truck, CalendarDays, ClipboardList } from "lucide-react";



const sampleShipments = [
  {
    id: "SP-1001",
    batch: "BATCH-A1",
    date: "2026-05-10",
    client: "MOBILE INDIA PVT LTD",
    status: "Confirmed",
    vehicles: 8,
  },
  {
    id: "SP-1002",
    batch: "BATCH-B3",
    date: "2026-05-15",
    client: "GLOBAL AUTO TRADERS",
    status: "In Transit",
    vehicles: 5,
  },
  {
    id: "SP-1003",
    batch: "BATCH-C2",
    date: "2026-05-18",
    client: "STAR EXPORTS",
    status: "Planned",
    vehicles: 12,
  },
];

const card = (props: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
}) => (
  <div
    className="rounded-2xl bg-white p-5 border border-blue-100"
    style={{ boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
          {props.label}
        </p>
        <p className="mt-3 text-[26px] font-bold text-slate-900 tabular-nums">
          {props.value}
        </p>
        <p className="text-[12px] text-slate-500 mt-1">{props.sub}</p>
      </div>
      <div
        className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0"
        style={{ background: props.gradient }}
      >
        {props.icon}
      </div>
    </div>
  </div>
);

const ShipmentPlanningDashboard: React.FC = () => {
  const navigate = useNavigate();

  const plannedCount = sampleShipments.filter((s) => s.status === "Planned").length;
  const confirmedCount = sampleShipments.filter((s) => s.status === "Confirmed").length;
  const inTransitCount = sampleShipments.filter((s) => s.status === "In Transit").length;
  const totalVehicles = sampleShipments.reduce((t, s) => t + s.vehicles, 0);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-4 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Shipment Planning</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Sample module (Admin access). Dashboard + shipment details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shipment-planning/list")}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <ClipboardList size={18} strokeWidth={3} />
              View Shipments
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {card({
              label: "Planned",
              value: String(plannedCount),
              sub: "Future batches",
              icon: <CalendarDays size={18} />,
              gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            })}
            {card({
              label: "Confirmed",
              value: String(confirmedCount),
              sub: "Ready to load",
              icon: <Package size={18} />,
              gradient: "linear-gradient(135deg,#60a5fa,#2563eb)",
            })}
            {card({
              label: "In Transit",
              value: String(inTransitCount),
              sub: "On the way",
              icon: <Truck size={18} />,
              gradient: "linear-gradient(135deg,#34d399,#10b981)",
            })}
            {card({
              label: "Total Vehicles",
              value: String(totalVehicles),
              sub: "Across sample shipments",
              icon: <ClipboardList size={18} />,
              gradient: "linear-gradient(135deg,#a78bfa,#6366f1)",
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 overflow-x-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recent Shipments
                </p>
                <p className="text-sm text-slate-500 mt-1">Click for shipment details</p>
              </div>
              <div className="text-xs font-bold text-blue-600">
                Sample Data
              </div>
            </div>

            <table className="min-w-full border-collapse bg-white text-center">
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-6 py-4">Shipment ID</th>
                  <th className="border-b border-slate-200 px-6 py-4">Batch</th>
                  <th className="border-b border-slate-200 px-6 py-4">Date</th>
                  <th className="border-b border-slate-200 px-6 py-4">Client</th>
                  <th className="border-b border-slate-200 px-6 py-4">Status</th>
                  <th className="border-b border-slate-200 px-6 py-4">Vehicles</th>
                </tr>
              </thead>
              <tbody>
                {sampleShipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-blue-50/30 cursor-pointer"
                    onClick={() => navigate(`/shipment-planning/details/${s.id}`)}
                  >
                    <td className="border-b border-slate-100 px-6 py-5 font-bold text-[#0f172a]">
                      {s.id}
                    </td>
                    <td className="border-b border-slate-100 px-6 py-5">{s.batch}</td>
                    <td className="border-b border-slate-100 px-6 py-5">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="border-b border-slate-100 px-6 py-5 text-left">
                      {s.client}
                    </td>
                    <td className="border-b border-slate-100 px-6 py-5">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {s.status}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-6 py-5">{s.vehicles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentPlanningDashboard;

