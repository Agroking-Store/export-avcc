import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";

// Auth pages
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";

// Dashboard
import Dashboard from "../features/dashboard/pages/Dashboard";

// Clients
import ClientsModule from "../features/clients/pages/ClientsModule";
// Orders
import OrdersModule from "../features/orders/OrdersModule";

// Dealers
import DealersModule from "../features/dealers/pages/DealersModule";

// PI
import PIModule from "../features/proforma-invoice/pages/PIModule"; // Import the new PIModule

// Companies
import CompanyModule from "../features/company/pages/CompanyModule";

// Vehicles
import VehiclesModule from "../features/vehicles/pages/VehiclesModule";

// Admin
import UserManagementModule from "../features/admin/pages/UserManagementModule";
import VehicleSelectionPage from "../features/proforma-invoice/pages/VehicleSelectionPage";
import InvoiceFormPage from "../features/proforma-invoice/pages/InvoiceFormPage";

const DefaultRedirect: React.FC = () => {
  const { user } = useAuth();
  const redirectPath = user?.role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
  return <Navigate to={redirectPath} replace />;
};

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
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* Vehicles */}
          <Route path="/vehicles/*" element={<VehiclesModule />} />

          {/* Clients */}
          <Route path="/clients/*" element={<ClientsModule />} />

          {/* Orders - Main module route (general order management) */}
          <Route path="/orders/*" element={<OrdersModule />} />

          {/* Dealers */}
          <Route path="/dealers/*" element={<DealersModule />} />

          {/* Proforma Invoice */}
          <Route path="/proforma-invoice/*" element={<PIModule />} />
          <Route
            path="/invoices/generate/:piId/:type"
            element={<VehicleSelectionPage />}
          />
          <Route
            path="/invoices/generate/:piId/:type/:vehicleId"
            element={<InvoiceFormPage />}
          />

          {/* Companies */}
          <Route path="/companies/*" element={<CompanyModule />} />

          {/* Admin - User Management */}
          <Route path="/user-management/*" element={<UserManagementModule />} />

          {/* Coming Soon */}
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
