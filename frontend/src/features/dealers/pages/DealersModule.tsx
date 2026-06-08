import { Store } from "lucide-react";
import DealersNavbar from "../components/DealersNavbar";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import DealersDashboard from "./DealersDashboard";
import DealersList from "./DealersList";
import AddDealer from "./AddDealer";
import EditDealer from "./EditDealer";
import DealerDetails from "./DealerDetails";
import DealerOrdersList from "./DealerOrdersList";
import DealerOrders from "./DealerOrders";
import DealerOrderDetails from "./DealerOrderDetails";
import DealerVehicleView from "./DealerVehicleView";
import DealerVehicleEdit from "./DealerVehicleEdit";
import DealerVehicleBooking from "./DealerVehicleBooking";

const DealersModule = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER CARD - Compact & Light Blue */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          
          {/* Icon Box */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Store className="w-7 h-7 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              Dealers 
            </h1>
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Manage dealers
            </p>
          </div>
        </div>

        {/* NAVBAR (Floating Style) */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <DealersNavbar />
        </div>

        {/* CONTENT AREA */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DealersDashboard />} />
            <Route path="list" element={<DealersList />} />
            <Route path="add" element={<AddDealer />} />
            <Route path="edit/:id" element={<EditDealer />} />
            <Route path="orders" element={<DealerOrdersList />} />
            <Route path="orders/add" element={<DealerOrders />} />
            <Route path="orders/:id" element={<DealerOrderDetails />} />
            <Route path="orders/:id/vehicle-view/:vehicleIndex" element={<DealerVehicleView />} />
            <Route path="orders/:id/vehicle-edit/:vehicleIndex" element={<DealerVehicleEdit />} />
            <Route path="booking/:orderId/:vehicleIndex" element={<DealerVehicleBooking />} />
            <Route path=":id" element={<DealerDetails />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DealersModule;
