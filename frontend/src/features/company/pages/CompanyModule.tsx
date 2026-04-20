import { Building2 } from "lucide-react";
import CompanyNavbar from "../components/CompanyNavbar";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import CompanyDashboard from "./CompanyDashboard";
import CompanyList from "./CompanyList";
import CreateCompany from "./CreateCompany";
import CompanyDetails from "./CompanyDetails";

const CompanyModule = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER CARD */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">

          {/* ICON BOX */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              Companies
            </h1>

            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Manage company profiles and business records
            </p>
          </div>
        </div>

        {/* NAVBAR */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <CompanyNavbar />
        </div>

        {/* CONTENT AREA */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CompanyDashboard />} />
            <Route path="list" element={<CompanyList />} />
            <Route path="add" element={<CreateCompany />} />
            <Route path=":id" element={<CompanyDetails />} />
            <Route
              path="*"
              element={
                <Navigate
                  to="/companies/dashboard"
                  replace
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default CompanyModule;