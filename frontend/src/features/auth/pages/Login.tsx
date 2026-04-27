import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import LoginForm from "../components/LoginForm";
import { Car } from "lucide-react";

const Login: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const redirectPath = user?.role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side - Form Panel */}
        <div className="md:w-3/5 p-12 flex flex-col justify-center items-center relative order-2 md:order-1">
          <h2 className="text-3xl font-bold text-[#38b2ac] mb-6">Sign In</h2>

          <LoginForm />
        </div>

        {/* Right Side - Teal Panel */}
        <div className="md:w-2/5 bg-[#38b2ac] text-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-[-80px] left-[-20px] w-64 h-64 bg-white opacity-10 rounded-full"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-12 self-start">
              <Car className="w-6 h-6" />
              <span className="font-bold tracking-wider text-sm uppercase">
                Vehicle Export
              </span>
            </div>

            <h2 className="text-4xl font-bold mb-6">Hello, Friend!</h2>
            <p className="mb-10 text-teal-50">
              Enter your personal details and start your journey with us
            </p>

            <Link to="/register">
              <button className="px-12 py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-[#38b2ac] transition-colors">
                SIGN UP
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
