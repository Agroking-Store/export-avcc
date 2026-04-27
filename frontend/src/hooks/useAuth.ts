import { useAppSelector } from "../app/hooks";

export const useAuth = () => {
  const { user, token, loading } = useAppSelector((state) => state.auth);

  return {
    user,
    token,
    loading,
    isAuthenticated: !!token,

    // Role Checks
    isAdmin: user?.role === "admin",
    isAccountant: user?.role === "accountant",
    isSourcing: user?.role === "sourcing_team",
    isClient: user?.role === "client",
    isDealer: user?.role === "dealer",
  };
};