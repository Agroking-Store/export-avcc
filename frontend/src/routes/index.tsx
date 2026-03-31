import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/layout/MainLayout";

// Auth pages
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";
import Dealers from "../features/dealers/pages/Dealers";
import AddDealer from "../features/dealers/pages/AddDealer";
import DealerDetails from "../features/dealers/pages/DealerDetails";
import EditDealer from "../features/dealers/pages/EditDealer";

// Dashboard
import Dashboard from "../features/dashboard/pages/Dashboard";

//pages
//client
import ClientsModule from "../features/clients/pages/ClientsModule";

//PI
import CreatePI from "../features/proforma-invoice/pages/CreatePI";
import PIList from "../features/proforma-invoice/pages/PIList";
import EditPI from "../features/proforma-invoice/pages/EditPI";
import PIDetails from "../features/proforma-invoice/pages/PIDetails";
import OrdersList from "../features/orders/OrdersList";
import AddOrder from "../features/orders/AddOrder";
import EditOrder from "../features/orders/EditOrder";
import OrderDetails from "../features/orders/OrderDetails";
import Vehicles from "../features/vehicles/Vehicles";
import VehicleRoutes from "./VehicleRoutes";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Private routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* Vehicles */}
          <Route path="/vehicles/*" element={<VehicleRoutes />} />

          {/* Clients */}
          <Route path="/clients/*" element={<ClientsModule />} />




          <Route path="/dealers" element={<Dealers />} />
<Route path="/dealers/add" element={<AddDealer />} />
<Route path="/dealers/:id" element={<DealerDetails />} />
<Route path="/dealers/edit/:id" element={<EditDealer />} />

          
          <Route path="/orders/*" element={<OrdersList />} />
          <Route path="/proforma-invoice" element={<PIList />} />
          <Route
            path="/letter-of-credit"
            element={
              <div className="p-6">Letter of Credit Page (Coming Soon)</div>
            }
          />
          <Route
            path="/invoices"
            element={<div className="p-6">Invoices Page (Coming Soon)</div>}
          />
          <Route
            path="/documents"
            element={<div className="p-6">Documents Page (Coming Soon)</div>}
          />
          <Route
            path="/verification"
            element={<div className="p-6">Verification Page (Coming Soon)</div>}
          />
          <Route
            path="/reports"
            element={<div className="p-6">Reports Page (Coming Soon)</div>}
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<div className="p-6">404 - Page Not Found</div>}
      />
    </Routes>
  );
};

export default AppRoutes;
