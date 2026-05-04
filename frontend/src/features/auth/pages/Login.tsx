import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import LoginForm from "../components/LoginForm";
import { Car } from "lucide-react";

const Login: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const role = user?.role?.toLowerCase() || "";
    const redirectPath =
      role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 mb-4 transform rotate-3">
            <Car className="w-10 h-10 text-white transform -rotate-3" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            Vehicle Export System
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {/* Sign in to access your dashboard */}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 md:p-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            SIGN IN
          </h2>

          <LoginForm />

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              {/* Don't have an account?{" "} */}
              <button className="text-teal-600 font-semibold hover:underline">
                {/* Contact Admin */}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
