import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchClient = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${apiConfig.baseURL}/clients/${id}`
      );

      setData(res.data);
    } catch (error) {
      console.error("Error fetching client", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const client = data?.client;
  const orders = data?.orders || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Client Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {client?.clientCode || "CL-000"}
          </p>
        </div>

        <button
          onClick={() => navigate("/clients/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to Clients
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-300">
          Loading...
        </div>
      )}

      {/* Content */}
      {!loading && client && (
        <>
          {/* SECTION 1: CLIENT INFO */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-6">
            <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
              Client Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Name</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{client.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Phone</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{client.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Country</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{client.country}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Email</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {client.email || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Company</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {client.companyName || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Status</p>
                <span className="px-3 py-1 rounded-full text-xs 
                 bg-green-100 dark:bg-green-900/30 
                 text-green-700 dark:text-green-300">
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Address</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {client.address || "-"}
                </p>
              </div>

            </div>
          </div>

          {/* SECTION 2: SUMMARY */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-6">
            <h2 className="text-base font-semibold mb-4">
              Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
                  Total Orders
                </p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {data.totalOrders || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
                  Last Transaction
                </p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                  {data.lastTransaction
                    ? new Date(data.lastTransaction).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: ORDERS */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-base font-semibold mb-4">
              Orders
            </h2>

            {orders.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Vehicles</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr
                        key={order._id}
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="cursor-pointer border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                      >
                        <td className="px-4 py-2 font-semibold text-blue-600">
                          {order.orderId}
                        </td>
                  
                        <td className="px-4 py-2">
                          {order.vehicles?.filter(v => v != null).reduce((sum: number, v: any) => sum + (v.quantity ?? 0), 0) ?? 0}
                        </td>
                  
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              order.status === "Confirmed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                  
                        <td className="px-4 py-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientDetails;