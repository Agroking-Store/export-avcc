import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { userApi } from "@/services/userApi";
import {
  Phone,
  Mail,
  UserCog,
  Clock,
  ArrowLeft,
  ClipboardList,
  Shield,
} from "lucide-react";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await userApi.getUserDetails(id);
        setUser(res.data);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: "Admin",
      accountant: "Accountant",
      sourcing_team: "Sourcing Team",
    };
    return map[role] || role;
  };

  const roleColor = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-purple-50 text-purple-700 border-purple-100",
      accountant: "bg-blue-50 text-blue-700 border-blue-100",
      sourcing_team: "bg-amber-50 text-amber-700 border-amber-100",
    };
    return map[role] || "bg-gray-50 text-gray-600 border-gray-100";
  };

  const InfoBox = ({ label, value, icon: Icon }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-3 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-[13px] font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Loading Profile...
        </span>
      </div>
    );

  return (
    <div className="w-full animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            {user?.name?.toUpperCase() || "USER"}
          </span>
        </div>
        <button
          onClick={() => navigate("/user-management/users")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">User Information</h2>
            </div>

            <div className="space-y-4">
              {/* Avatar + Name Row */}
              <div className="group bg-[#F8F9FB] rounded-xl p-4 flex items-center gap-4 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-lg font-black border border-indigo-100 transition-transform group-hover:scale-105">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">
                    Full Name
                  </p>
                  <h3 className="text-lg font-bold text-[#2D3748] group-hover:text-indigo-600 transition-colors">
                    {user?.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                    <Shield size={12} className="text-indigo-500" />
                    {roleLabel(user?.role)}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoBox label="Phone Number" value={user?.phone} icon={Phone} />
                <InfoBox label="Email Address" value={user?.email} icon={Mail} />
                <InfoBox label="Role" value={roleLabel(user?.role)} icon={UserCog} />
              </div>

              <InfoBox
                label="Last Login"
                value={user?.lastLogin || "Never"}
                icon={Clock}
              />
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
          {/* Status */}
          <div className="bg-[#EBFDF5] border border-[#D1FAE5] rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Status
            </p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
              <h3 className="text-xl font-bold text-emerald-900">Active</h3>
            </div>
          </div>

          {/* Role Badge */}
          <div className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${roleColor(user?.role)}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <UserCog size={12} /> Access Level
            </p>
            <h3 className="text-xl font-bold leading-none mt-2">
              {roleLabel(user?.role) || "-"}
            </h3>
          </div>

          {/* Last Login */}
          <div className="bg-[#EBF8FF] rounded-2xl p-5 border border-[#BEE3F8] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
            <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 group-hover:text-blue-900">
              <Clock size={12} /> Last Login
            </p>
            <h3 className="text-base font-bold text-blue-800 group-hover:scale-105 transition-transform origin-left">
              {user?.lastLogin || "N/A"}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDetails;