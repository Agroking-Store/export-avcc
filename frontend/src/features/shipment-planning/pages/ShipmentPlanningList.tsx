import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, ArrowUpRight } from "lucide-react";



type ShipmentStatus = "Planned" | "Confirmed" | "In Transit";

type ShipmentRow = {
  id: string;
  batch: string;
  date: string;
  client: string;
  status: ShipmentStatus;
  vehicles: number;
};

const initialData: ShipmentRow[] = [
  { id: "SP-1001", batch: "BATCH-A1", date: "2026-05-10", client: "MOBILE INDIA PVT LTD", status: "Confirmed", vehicles: 8 },
  { id: "SP-1002", batch: "BATCH-B3", date: "2026-05-15", client: "GLOBAL AUTO TRADERS", status: "In Transit", vehicles: 5 },
  { id: "SP-1003", batch: "BATCH-C2", date: "2026-05-18", client: "STAR EXPORTS", status: "Planned", vehicles: 12 },
  { id: "SP-1004", batch: "BATCH-D4", date: "2026-05-20", client: "NORTHRIDGE LOGISTICS", status: "Planned", vehicles: 7 },
  { id: "SP-1005", batch: "BATCH-E2", date: "2026-05-22", client: "EASTERN VEHICLE CO", status: "Confirmed", vehicles: 9 },
];

const ShipmentPlanningList: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ShipmentStatus>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialData.filter((s) => {
      const statusOk = status === "All" ? true : s.status === status;
      const searchOk = !q
        ? true
        : [s.id, s.batch, s.client, s.status].join(" ").toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [search, status]);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Shipment List</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Sample data table</p>
          </div>
          <button
            onClick={() => navigate("/shipment-planning/dashboard")}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-100 transition-all active:scale-95"
          >
            Dashboard <ArrowUpRight size={16} />
          </button>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4">

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
                <Filter size={16} />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="cursor-pointer appearance-none pl-11 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-blue-600 text-sm font-bold rounded-2xl outline-none transition-all hover:bg-slate-50 dark:hover:bg-gray-800"
              >
                <option value="All">All Statuses</option>
                <option value="Planned">Planned</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Transit">In Transit</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search shipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="min-w-full border-collapse bg-white text-center">
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-6 py-4">Shipment</th>
                  <th className="border-b border-slate-200 px-6 py-4">Batch</th>
                  <th className="border-b border-slate-200 px-6 py-4">Date</th>
                  <th className="border-b border-slate-200 px-6 py-4">Client</th>
                  <th className="border-b border-slate-200 px-6 py-4">Status</th>
                  <th className="border-b border-slate-200 px-6 py-4">Vehicles</th>
                  <th className="border-b border-slate-200 px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-400 italic">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="align-middle hover:bg-blue-50/30">
                      <td className="border-b border-slate-100 px-6 py-5 font-bold text-[#0f172a]">{s.id}</td>
                      <td className="border-b border-slate-100 px-6 py-5">{s.batch}</td>
                      <td className="border-b border-slate-100 px-6 py-5">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="border-b border-slate-100 px-6 py-5 text-left">{s.client}</td>
                      <td className="border-b border-slate-100 px-6 py-5">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {s.status}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-6 py-5">{s.vehicles}</td>
                      <td className="border-b border-slate-100 px-6 py-5">
                        <button
                          onClick={() => navigate(`/shipment-planning/details/${s.id}`)}
                          className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentPlanningList;

