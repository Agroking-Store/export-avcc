import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ShipmentPlanningDashboard from "./ShipmentPlanningDashboard";
import ShipmentPlanningList from "./ShipmentPlanningList";
import ShipmentDetails from "./ShipmentDetails";
import AddShipmentDetails from "./AddShipmentDetails";
import ShippedVehiclesList from "./ShippedVehiclesList";
import ShippedVehiclesDetails from "./ShippedVehiclesDetails";
import { Truck } from "lucide-react";
import ShipmentPlanningNavbar from "./ShipmentPlanningNavbar";
import { useAuth } from "../../../hooks/useAuth";

const ShipmentPlanningModule: React.FC = () => {
  const { isClient } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER (same structure as Vehicles/Clients/Dealers modules) */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              Shipment Planning
            </h1>
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Dashboard, shipments list & shipment details (sample UI)
            </p>
          </div>
        </div>

        {/* NAVBAR */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <ShipmentPlanningNavbar />
        </div>

        {/* CONTENT */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ShipmentPlanningDashboard />} />
            <Route path="list" element={<ShipmentPlanningList />} />
            {/* <Route path="add" element={<AddShipmentDetails />} /> */}
            <Route
              path="add"
              element={
                isClient ? (
                  <Navigate to="../list" replace />
                ) : (
                  <AddShipmentDetails />
                )
              }
            />

            <Route path="view/:shipmentId" element={<ShipmentDetails />} />
            <Route path="shipped-vehicles" element={<ShippedVehiclesList />} />
            <Route
              path="shipped-view/:shipmentId"
              element={<ShippedVehiclesDetails />}
            />
            <Route
              path="details/:shipmentId"
              element={<Navigate to="../list" replace />}
            />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ShipmentPlanningModule;
