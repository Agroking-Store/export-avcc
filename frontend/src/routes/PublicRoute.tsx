import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const role = user?.role?.toLowerCase() || "";
  const redirectPath = role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
  return <Navigate to={redirectPath} replace />;
};

export default PublicRoute;
