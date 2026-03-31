import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Search, Plus } from "lucide-react";
import DealerNav from "../components/DealerNav";
import { apiConfig } from "../../../config/apiConfig";

const DealerOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/orders`, {
        params: { search, page: currentPage, limit },
      });
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [search, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <div className="space-y-6">
      <DealerNav />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dealer Orders</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">All orders in the system</p>
        </div>
        <button onClick={() => navigate("/dealers/orders/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">All Orders</span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Search orders..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Voucher No</th>
                <th className="px-6 py-3 text-left">Dealer</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Grand Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-600 dark:text-slate-200 px-2 py-1 rounded text-xs">{order.orderId}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.voucherNo}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{order.dealerName || "-"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">${order.grandTotal?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/dealers/orders/${order._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Prev</button>
            <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerOrdersList;