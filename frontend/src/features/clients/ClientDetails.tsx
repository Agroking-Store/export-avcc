import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiConfig } from "../../config/apiConfig";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/clients/${id}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  if (loading || !data) return <div className="p-6">Loading...</div>;

  const { client, orders, totalOrders, lastTransaction } = data;

  return (
    <div className="p-6">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate("/clients")}
            className="text-blue-600 text-sm mb-2"
          >
            ← Back to Clients
          </button>

          <h1 className="text-2xl font-semibold">
            {client.name}
          </h1>

          <p className="text-gray-500 text-sm">
            {client.clientCode}
          </p>
        </div>

        <button
          onClick={() => navigate(`/clients/edit/${client._id}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Edit Client
        </button>
      </div>

      {/* 🔹 Info + Summary */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Client Info */}
        <div className="col-span-2 bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Client Information</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium">{client.name}</p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{client.phone}</p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p>{client.email || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Country</p>
              <p>{client.country}</p>
            </div>

            <div>
              <p className="text-gray-500">Company</p>
              <p>{client.companyName || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  client.isActive
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {client.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-gray-500 text-sm">Address</p>
            <p>{client.address || "-"}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Summary</h2>

          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-xl font-semibold">{totalOrders}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Last Transaction</p>
              <p className="text-sm font-medium">
                {lastTransaction
                  ? new Date(lastTransaction).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Orders Table */}
      <div className="bg-white rounded-xl shadow mt-6">
        <div className="p-4 border-b font-semibold">
          Orders
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Order ID</th>
              <th className="px-6 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.length > 0 ? (
              orders.map((order: any) => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-6 py-3">
                    {order._id}
                  </td>
                  <td className="px-6 py-3">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={2}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientDetails;