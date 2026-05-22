import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, ClipboardList, Package } from "lucide-react";



type LastShipment = {
  id: string;
  date: string;
  status: "Delivered" | "In Transit";
  vehicles: number;
};

type ShipmentDetailsRow = {
  brand: string;
  model: string;
  color: string;
  unitCount: number;
};

const SHIPMENT_PRODUCTS: Record<string, ShipmentDetailsRow[]> = {
  "SP-1001": [
    { brand: "MARUTI", model: "SWIFT", color: "WHITE", unitCount: 3 },
    { brand: "HYUNDAI", model: "CRETA", color: "SILVER", unitCount: 2 },
    { brand: "TATA", model: "NEXON", color: "RED", unitCount: 3 },
  ],
  "SP-1002": [
    { brand: "HONDA", model: "CITY", color: "GREY", unitCount: 5 },
  ],
  "SP-1003": [
    { brand: "TOYOTA", model: "INNOVA", color: "BLACK", unitCount: 6 },
    { brand: "KIA", model: "SELTO S", color: "BLUE", unitCount: 6 },
  ],
  "SP-1004": [
    { brand: "MAHINDRA", model: "XUV", color: "BROWN", unitCount: 7 },
  ],
  "SP-1005": [
    { brand: "RENAULT", model: "KWID", color: "ORANGE", unitCount: 9 },
  ],
};

const LAST_SHIPMENTS: Record<string, LastShipment[]> = {
  "SP-1001": [
    { id: "SP-0978", date: "2026-04-19", status: "Delivered", vehicles: 6 },
    { id: "SP-0932", date: "2026-03-21", status: "Delivered", vehicles: 4 },
  ],
  "SP-1002": [
    { id: "SP-0991", date: "2026-04-28", status: "In Transit", vehicles: 5 },
  ],
  "SP-1003": [
    { id: "SP-0986", date: "2026-04-23", status: "Delivered", vehicles: 10 },
  ],
  "SP-1004": [
    { id: "SP-0972", date: "2026-04-12", status: "Delivered", vehicles: 8 },
  ],
  "SP-1005": [
    { id: "SP-0966", date: "2026-04-05", status: "Delivered", vehicles: 7 },
  ],
};

const ShipmentDetails: React.FC = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  const id = shipmentId || "";

  const products = SHIPMENT_PRODUCTS[id] || [];
  const totalUnits = products.reduce((t, r) => t + r.unitCount, 0);
  const last = LAST_SHIPMENTS[id] || [];

  const lastTitle = useMemo(() => {
    if (!last.length) return "No previous shipments";
    const delivered = last.filter((x) => x.status === "Delivered").length;
    const transit = last.filter((x) => x.status !== "Delivered").length;
    return `Previous: ${delivered} delivered · ${transit} in-progress`;
  }, [last]);

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/shipment-planning/list")}
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white mt-3">
              Shipment Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Shipment ID: <span className="font-bold text-slate-900">{id}</span> (sample data)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              <Truck size={16} /> {totalUnits} vehicles
            </span>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="rounded-2xl border border-slate-200 overflow-x-auto">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicles in this shipment</p>
                  <p className="text-sm text-slate-500 mt-1">Unit-wise breakdown</p>
                </div>
                <div className="text-xs font-bold text-blue-600">Sample</div>
              </div>
              <table className="min-w-full border-collapse bg-white text-center">
                <thead className="bg-slate-50/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-6 py-4">Brand</th>
                    <th className="border-b border-slate-200 px-6 py-4">Model</th>
                    <th className="border-b border-slate-200 px-6 py-4">Color</th>
                    <th className="border-b border-slate-200 px-6 py-4">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-20 text-slate-400 italic">No products in sample</td>
                    </tr>
                  ) : (
                    products.map((p, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30">
                        <td className="border-b border-slate-100 px-6 py-5 font-bold text-slate-900">{p.brand}</td>
                        <td className="border-b border-slate-100 px-6 py-5 text-left">{p.model}</td>
                        <td className="border-b border-slate-100 px-6 py-5">{p.color}</td>
                        <td className="border-b border-slate-100 px-6 py-5 font-bold">{p.unitCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">LAST SHIPMENT DETAILS</p>
                  <p className="text-sm font-bold text-slate-900 mt-2">{lastTitle}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#2563eb,#0ea5e9)" }}>
                  <Package size={18} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {last.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">No previous shipments</div>
                ) : (
                  last.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-slate-900 truncate">{s.id}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold border ${
                            s.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-slate-600 text-[12px] font-semibold">
                        <ClipboardList size={14} /> {s.vehicles} vehicles
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">QUICK ACTIONS</p>
              <div className="mt-4 space-y-3">
                <button
                  className="w-full cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 transition"
                  onClick={() => navigate("/shipment-planning/list")}
                >
                  Go to shipment list
                </button>
                <button
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => navigate("/shipment-planning/dashboard")}
                >
                  Back to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetails;

