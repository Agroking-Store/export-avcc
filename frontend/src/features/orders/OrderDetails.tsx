import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Download, Eye, ArrowLeft } from "lucide-react";
import { apiConfig } from "../../config/apiConfig";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      setOrder(data);
      setStatus(data.status || "Draft");
    } catch (error) {
      console.error("Error fetching order", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await axios.put(`${apiConfig.baseURL}/orders/${id}`, { status: newStatus });
      setStatus(newStatus);
      alert("Status updated");
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Draft": return "bg-yellow-100 text-yellow-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex justify-between items-center">
          <div className="text-slate-500">Loading order...</div>
        </div>
        <div className="bg-white rounded-xl p-12 border border-slate-200">
          <div className="text-center py-12 text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 p-8">
        <div className="bg-white rounded-xl p-12 text-center text-slate-500">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Order #{order.orderId}
          </h2>
          <p className="text-sm text-slate-500">
            {new Date(order.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={() => navigate(`/orders/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Status */}
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
            <span className="text-sm text-slate-500">
              Voucher: <span className="font-medium">{order.voucherNo}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Update Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updatingStatus}
                className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
              </select>
              <button
                onClick={() => updateStatus(status)}
                disabled={updatingStatus}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-slate-500 block mb-1">Name</span>
                <span className="font-medium">{order.clientId?.name || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Company</span>
                <span>{order.clientId?.companyName || '-'}</span>
              </div>
            </div>
          </div>

          {/* Vehicles Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">
              Vehicles ({order.vehicles?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      # 
                    </th>
                    <th className="border border-slate-200 px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vehicle Name
                    </th>
                    <th className="border border-slate-200 px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="border border-slate-200 px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.vehicles?.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-6 py-4 text-sm font-medium text-slate-900">
                        {i + 1}
                      </td>
                      <td className="border border-slate-200 px-6 py-4 text-sm text-slate-900">
                        {v.name}
                      </td>
                      <td className="border border-slate-200 px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-xs font-medium rounded-full text-slate-700">
                          {v.color}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-6 py-4 text-sm font-semibold text-right text-slate-900">
                        {v.quantity}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No vehicles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

