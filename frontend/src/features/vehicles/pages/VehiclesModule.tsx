import { Car } from "lucide-react";
import VehicleNavbar from "../components/VehicleNavbar";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

// Pages
import Vehicles from "./Vehicles";
import VehicleList from "./VehicleList";
import AddVehicle from "./AddVehicle";
import EditVehicle from "./EditVehicle";
import VehicleItemDetails from "./VehicleItemDetails";
import VehicleOrdersList from "./VehicleOrdersList";
import AddVehicleOrder from "./AddVehicleOrder";
import EditVehicleOrder from "./EditVehicleOrder";
import VehicleOrderVehicleEdit from "./VehicleOrderVehicleEdit";
import VehicleOrderVehicleView from "./VehicleOrderVehicleView";

const VehiclesModule = () => {
  const { isClient } = useAuth();
  const defaultRoute = isClient ? "orders" : "dashboard";
  const title = "Vehicles";
  const description = "Manage vehicle inventory and export orders";


  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER CARD - Compact & Light Blue */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">

          {/* Icon Box */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Car className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        {/* NAVBAR (Floating Style) */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 mb-5">
          <VehicleNavbar />
        </div>

        {/* CONTENT AREA */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to={defaultRoute} replace />} />
            <Route
              path="dashboard"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <Vehicles />}
            />
            <Route
              path="list"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <VehicleList />}
            />
            <Route
              path="add"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <AddVehicle />}
            />
            <Route
              path="list/:id"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <VehicleItemDetails />}
            />
            <Route
              path="edit/:id"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <EditVehicle />}
            />
            <Route path="orders" element={<VehicleOrdersList />} />
            <Route
              path="orders/add"
              element={<AddVehicleOrder />}
            />
            <Route
              path="orders/edit/:id"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <EditVehicleOrder />}
            />
            <Route
              path="orders/:id/unit-edit/:vehicleIndex"
              element={isClient ? <Navigate to="/vehicles/orders" replace /> : <VehicleOrderVehicleEdit />}
            />
            <Route path="orders/:id/unit-view/:vehicleIndex" element={<VehicleOrderVehicleView />} />

            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default VehiclesModule;

