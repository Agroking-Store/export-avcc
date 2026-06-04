import React, { useEffect, useState, useCallback, useMemo } from "react";
import { userApi } from "../../../services/userApi";
import { User, UserRole } from "../../../types/common.types";
import { ShieldAlert, Users, Briefcase, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserManagementList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userApi.getAllUsers();
      setUsers(res?.data || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      sourcing: users.filter((u) => u.role === "sourcing_team").length,
      dealers: users.filter((u) => u.role === "dealer").length,
    }),
    [users],
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await userApi.updateRole(userId, newRole);
      toast.success("Permissions updated");
      loadUsers();
    } catch (error) {
      toast.error("Failed to change role");
    }
  };

  if (loading)
    return (
      <div className="p-8 animate-pulse text-slate-400 font-medium">
        Loading User Records...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI CARDS - Matching CompanyDashboard */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={<ShieldAlert size={20} />}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Sourcing"
          value={stats.sourcing}
          icon={<Briefcase size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Dealers"
          value={stats.dealers}
          icon={<Truck size={20} />}
          color="bg-orange-50 text-orange-600"
        />
      </div> */}

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                User Details
              </th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-right">
                Access Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <p className="font-bold text-slate-800">{user.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        handleRoleChange(
                          user._id || user.id || "",
                          val as UserRole,
                        )
                      }
                    >
                      <SelectTrigger className="w-44 rounded-xl border-slate-200 font-bold text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sourcing_team">
                          Sourcing Team
                        </SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
    >
      {icon}
    </div>
    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
      {title}
    </p>
    <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
      {value}
    </h3>
  </div>
);

export default UserManagementList;
