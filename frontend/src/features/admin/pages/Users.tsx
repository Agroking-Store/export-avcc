import { Plus, Mail, Phone, User, Clock, UserCog, Eye, Pencil, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiConfig } from "@/config/apiConfig";
import { toast } from "sonner";
import { userApi } from "@/services/userApi";

interface UserInterface {
  name: string;
  email: string;
  lastLogin: string;
  phone: string;
  role: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const userIdFromIndex = (u: UserInterface, idx: number) => {
    return (u as any)._id || (u as any).id || `${idx}`;
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await axios.get(`${apiConfig.baseURL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: "Admin",
      accountant: "Accountant",
      sourcing_team: "Sourcing Team",
    };
    return map[role] || role;
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-purple-50 text-purple-700 border border-purple-100",
      accountant: "bg-blue-50 text-blue-700 border border-blue-100",
      sourcing_team: "bg-amber-50 text-amber-700 border border-amber-100",
    };
    return map[role] || "bg-gray-50 text-gray-600 border border-gray-100";
  };

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">

        {/* TOP SECTION */}
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Users</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage system access and user accounts</p>
          </div>
          <button
            onClick={() => navigate("add")}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Add User
          </button>
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

        {/* TABLE - SR No Added, Last Login Removed */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-y border-slate-100 dark:border-gray-800">
              <tr>
                {["Sr No", "Name", "Email", "Phone", "Role", "Actions"].map((head) => (
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
                  <td colSpan={6} className="text-center py-20 text-slate-400 italic">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr
                    key={index}
                    className="group transition-colors duration-200 hover:bg-blue-50/40 dark:hover:bg-gray-800/40"
                  >
                    {/* SR No */}
                    <td className="px-8 py-5 text-center font-medium text-slate-500">
                      {index + 1}
                    </td>

                    {/* Name */}
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

                    {/* Phone */}
                    <td className="px-8 py-5 text-center text-sm text-slate-600 dark:text-gray-300">
                      {user.phone || "-"}
                    </td>

                    {/* Role */}
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${roleBadge(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() => navigate(`/user-management/users/${userIdFromIndex(user, index)}`)}
                          title="View User"
                          className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/user-management/users/${userIdFromIndex(user, index)}/edit`)}
                          title="Edit User"
                          className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                        >
                          <Pencil size={18} />
                        </button>
                        {user.role === "admin" ? (
                          <div title="Admin users cannot be deleted." className="opacity-40 cursor-not-allowed">
                            <button
                              disabled
                              className="p-2.5 text-red-400 border border-slate-200 rounded-xl bg-white"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            title="Delete User"
                            onClick={async () => {
                              const ok = window.confirm("Are you sure you want to delete this user?");
                              if (!ok) return;
                              try {
                                await userApi.deleteUser(userIdFromIndex(user, index));
                                toast.success("User deleted successfully");
                                fetchUsers();
                              } catch (e: any) {
                                toast.error(e?.response?.data?.message || "Delete failed");
                              }
                            }}
                            className="cursor-pointer p-2.5 text-red-500 border border-red-100 rounded-xl bg-white hover:text-red-700 hover:border-red-300 hover:bg-red-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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

export default Users;