import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";

// Auth pages
import Login from "../features/auth/pages/Login";
//import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";

// Dashboard
import Dashboard from "../features/dashboard/pages/Dashboard";

// Modules
import ClientsModule from "../features/clients/pages/ClientsModule";
import OrdersModule from "../features/orders/OrdersModule";
import DealersModule from "../features/dealers/pages/DealersModule";
import PIModule from "../features/proforma-invoice/pages/PIModule";
import CompanyModule from "../features/company/pages/CompanyModule";
import VehiclesModule from "../features/vehicles/pages/VehiclesModule";
import UserManagementModule from "../features/admin/pages/UserManagementModule";

import { useAppSelector } from "../app/hooks";
const DefaultRedirect: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "";
  const redirectPath = role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
  return <Navigate to={redirectPath} replace />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role?.toLowerCase();

  const isAdmin = role === "admin";
  const isAccountant = role === "accountant";
  const isSourcingTeam = role === "sourcing_team";

  const canAccessVehicles = isAdmin || isSourcingTeam;
  const canAccessPI = isAdmin || isAccountant;

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
      </Route>

      {/* Private */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

{/* Admin + Sourcing Team Routes */}
          <Route
            path="/vehicles/*"
            element={
              canAccessVehicles ? <VehiclesModule /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/clients/*"
            element={
              isAdmin ? <ClientsModule /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/orders/*"
            element={
              isAdmin ? <OrdersModule /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/dealers/*"
            element={
              isAdmin ? <DealersModule /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/companies/*"
            element={
              isAdmin ? <CompanyModule /> : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/user-management/*"
            element={
              isAdmin ? (
                <UserManagementModule />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Admin + Accountant */}
          <Route
            path="/proforma-invoice/*"
            element={
              canAccessPI ? (
                <PIModule />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Coming Soon */}
          <Route
            path="/reports"
            element={<div className="p-6">Reports Page (Coming Soon)</div>}
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-6">404 - Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;