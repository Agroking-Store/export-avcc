import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Download, Search, Filter, Plus } from "lucide-react";

const OrdersList = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/v1/orders",
        {
          params: {
            search,
            status: statusFilter === "All" ? undefined : statusFilter,
            page: currentPage,
            limit,
          },
        }
      );

      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, currentPage]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/v1/orders/${id}`);
      fetchOrders();
    } catch {
      alert("Delete failed");
    }
  };

  const handleDownloadPDF = (id: string) => {
    console.log("Download PDF for order:", id);
    // TODO: Implement PDF download API call
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "PI Generated": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Orders
          </h2>
          <p className="text-sm text-slate-500">
            Manage all your export orders
          </p>
        </div>

        <button
          onClick={() => navigate("/orders/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
        >
          <Plus size={18} />
          Create New Order
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="PI Generated">PI Generated</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search order ID or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">ORDER ID</th>
                <th className="px-6 py-3 text-left">Client Name</th>
                <th className="px-6 py-3 text-left">No. of Vehicles</th>
                <th className="px-6 py-3 text-left">Grand Total (USD)</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-t hover:bg-slate-50">
                    
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                        {order.orderId}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium">{order.clientName || order.clientId}</div>
                      <div className="text-xs text-gray-500">
                        {order.clientCountry || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {order.vehicles ? order.vehicles.length : 0}
                    </td>

                    <td className="px-6 py-4">
                      ${order.grandTotal?.toLocaleString() || "0"}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {order.date 
                        ? new Date(order.date).toLocaleDateString()
                        : new Date(order.createdAt).toLocaleDateString()
                      }
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/orders/edit/${order._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(order._id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                        >
                          <Download size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(order._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersList;