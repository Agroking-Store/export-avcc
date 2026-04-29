
import { Routes, Route, Navigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import UserManagementList from "./UserManagementList";
import Users from "./Users";
import { ShieldCheck } from "lucide-react";
import AddUser from "./AddUser";

const UserManagementModule = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER CARD */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              User Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Control system access and assign roles to team members
            </p>
          </div>
        </div>

        {/* NAVBAR */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <UserNavbar />
        </div>

        {/* CONTENT AREA */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<UserManagementList />} />
            <Route path="users" element={<Users />} />
            <Route path="users/add" element={<AddUser />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModule;
