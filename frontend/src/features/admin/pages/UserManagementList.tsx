import React, { useEffect, useState, useCallback, useMemo } from "react";
import { userApi } from "../../../services/userApi";
import { User, UserRole } from "../../../types/common.types";
import { Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
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

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-purple-50 text-purple-700 border border-purple-100",
      accountant: "bg-blue-50 text-blue-700 border border-blue-100",
      sourcing_team: "bg-amber-50 text-amber-700 border border-amber-100",
    };
    return map[role] || "bg-gray-50 text-gray-600 border border-gray-100";
  };

  if (loading)
    return (
      <div className="p-8 animate-pulse text-slate-400 font-medium">
        Loading User Records...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">

        {/* TOP SECTION */}
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">User Permissions</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Manage access levels for all team members
            </p>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        {/* TOOLBAR - Filter Removed */}
        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* TABLE - SR No Added */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-y border-slate-100 dark:border-gray-800">
              <tr>
                {["Sr No", "User", "Email", "Status", "Access Level"].map((head) => (
                  <th
                    key={head}
                    className="px-8 py-4 text-center text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-slate-400 italic">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr
                    key={user._id}
                    className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                  >
                    {/* SR No */}
                    <td className="px-8 py-5 text-center font-medium text-slate-500">
                      {index + 1}
                    </td>

                    {/* User */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                        Active
                      </span>
                    </td>

                    {/* Access Level */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        <Select
                          value={user.role}
                          onValueChange={(val) =>
                            handleRoleChange(
                              user._id || user.id || "",
                              val as UserRole
                            )
                          }
                        >
                          <SelectTrigger className="w-44 rounded-xl border-slate-200 font-bold text-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="sourcing_team">Sourcing Team</SelectItem>
                            <SelectItem value="accountant">Accountant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementList;