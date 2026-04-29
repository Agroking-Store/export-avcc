import { Plus, Eye, Pencil, Settings, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Users = () => {
    const [users] = useState([
        {
            name: "Virat",
            email: "virat@gmail.com",
            phone: "9876543210",
        },
        {
            name: "Rohit",
            email: "rohit@gmail.com",
            phone: "9123456780",
        },
    ]);

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
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
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

                                <th className="px-6 py-3 text-right text-gray-500">
                                    <div className="flex items-center justify-end gap-2">
                                        <Settings size={14} className="text-gray-500" />
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

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                                                <Eye size={16} className="text-gray-600" />
                                            </button>

                                            <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                                                <Pencil size={16} className="text-blue-600" />
                                            </button>
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