import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../config/apiConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      navigate("/orders/list", {
        state: { success: "Order status updated successfully ✅" }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating status ❌");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Confirmed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PI Generated": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Loading...
          </h1>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-300">
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-300">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Order #{order.orderId}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {new Date(order.date).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={() => navigate("/orders/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to Orders
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        
        {/* SECTION 1: STATUS & VOUCHER */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
              {status}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Voucher: <span className="font-medium">{order.voucherNo}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Update Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updatingStatus}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >

                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>

              </select>
              <button
                onClick={() => updateStatus(status)}
                disabled={updatingStatus}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 
                           dark:bg-blue-500 dark:hover:bg-blue-600 
                           text-white rounded-lg transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: CLIENT INFO */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">
            Client Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Name</p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {order.clientId?.name || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Company</p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {order.clientId?.companyName || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Phone</p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {order.clientId?.phone || '-'}
              </p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Address</p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {order.clientId?.address || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: VEHICLES */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">
            Vehicles ({order.vehicles?.length || 0})
          </h2>

          {order.vehicles && order.vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200">
                  <tr>
                    <th className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      #
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Vehicle Name
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Color
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {order.vehicles.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {i + 1}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {v.name}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-xs font-medium rounded-full text-slate-800 dark:text-gray-200">
                          {v.color}
                        </span>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-6 py-4 text-sm font-semibold text-left text-gray-900 dark:text-gray-100">
                        {v.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No vehicles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

