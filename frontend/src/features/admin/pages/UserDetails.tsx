import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { userApi } from "@/services/userApi";

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

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        Loading User...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">User Details</h2>
          <p className="text-sm text-gray-500">View user information</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center gap-2"
        >
          Back
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase">Name</div>
          <div className="mt-1 font-semibold text-gray-800">{user?.name || "-"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase">Email</div>
          <div className="mt-1 font-semibold text-gray-800">{user?.email || "-"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase">Phone</div>
          <div className="mt-1 font-semibold text-gray-800">{user?.phone || "-"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase">Role</div>
          <div className="mt-1 font-semibold text-gray-800">{user?.role || "-"}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Last Login</div>
          <div className="mt-1 font-semibold text-gray-800 text-right">{user?.lastLogin || "-"}</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

