import { Plus, Mail, Phone, User, Clock, UserCog, Eye, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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

    const userIdFromIndex = (u: UserInterface, idx: number) => {
        return (u as any)._id || (u as any).id || `${idx}`;
    };


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

                const res = await axios.get(`${apiConfig.baseURL}/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUsers(res.data.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };

        fetchUsers();
    }, []);

    const navigate = useNavigate();

    return (
        <div className="p-6 bg-gray-50 min-h-screen">

            {/* Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

                {/* Top Controls */}
                <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100">

                    {/* Left */}
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">
                            Users
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all your users
                        </p>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate("add")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 cursor-pointer"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-5">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-indigo-500" />
                                        Name
                                    </div>
                                </th>

                                <th className="px-6 py-3 text-left text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-red-500" />
                                        Email
                                    </div>
                                </th>

                                <th className="px-6 py-3 text-left text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-blue-500" />
                                        Phone
                                    </div>
                                </th>


                                <th className="px-6 py-3 text-left text-gray-500">
                                    <div className="flex items-center gap-2">
                                       <UserCog size={14} className="text-blue-500" />
                                        Role
                                    </div>
                                </th>

                                <th className="px-6 py-3 text-right text-gray-500">
                                    <div className="flex items-center justify-end gap-2">
                                        <Clock size={14} className="text-gray-500" />
                                        Last Login
                                    </div>
                                </th>

                                <th className="px-6 py-3 text-right text-gray-500">
                                    <div className="flex items-center justify-end gap-2">
                                        <UserCog size={14} className="text-gray-500" />
                                        Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={index}
                                    className="border-t border-gray-100 hover:bg-gray-50 transition"
                                >
                                    {/* Name */}
                                    <td className="px-6 py-4 font-semibold text-gray-800">
                                        {user.name}
                                    </td>

                                    {/* Email */}
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {user.email}
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {user.phone}
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {user.role}
                                    </td>

                                    {/* Last Login */}
                                    <td className="px-6 py-4 text-gray-600 font-medium text-right">
                                        {user.lastLogin}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                title="View User"
                                                onClick={() => navigate(`/user-management/users/${userIdFromIndex(user, index)}`)}
                                                className="p-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                title="Edit User"
                                                onClick={() => navigate(`/user-management/users/${userIdFromIndex(user, index)}/edit`)}
                                                className="p-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            {user.role === "admin" ? (
                                                <div title="Admin users cannot be deleted." className="opacity-60 cursor-not-allowed">
                                                    <button
                                                        disabled
                                                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-200"
                                                        title="Admin users cannot be deleted."
                                                    >
                                                        <Trash2 size={16} />
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
                                                            // Refresh
                                                            const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
                                                            const res = await axios.get(`${apiConfig.baseURL}/users`, {
                                                                headers: { Authorization: `Bearer ${token}` },
                                                            });
                                                            setUsers(res.data.data);
                                                        } catch (e: any) {
                                                            toast.error(e?.response?.data?.message || "Delete failed");
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg bg-gray-50 text-red-600 border border-red-100 hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {users.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;