import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DealerNav from "../components/DealerNav";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";

const DealerOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    axios.get(`${apiConfig.baseURL}/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(console.error);
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    try {
      await axios.patch(`${apiConfig.baseURL}/orders/${id}/status`, { status });
      setOrder({ ...order, status });
      toast.success("Status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (!order) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <DealerNav />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Order #{order.orderId}</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">{new Date(order.date).toLocaleDateString()}</p>
        </div>
        <button onClick={() => navigate("/dealers/orders")}
          className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
          ← Back to Orders
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Order ID", value: order.orderId },
            { label: "Voucher No", value: order.voucherNo },
            { label: "Date", value: new Date(order.date).toLocaleDateString() },
            { label: "Grand Total", value: `$${order.grandTotal?.toLocaleString()}` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Status Update */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Status:</label>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.status === "Confirmed"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}>{order.status}</span>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-4">Vehicles ({order.vehicles?.length})</h3>
        <div className="space-y-4">
          {order.vehicles?.map((v: any, i: number) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-3">Vehicle {i + 1}</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "HSN Code", value: v.hsnCode },
                  { label: "Vehicle Name", value: v.vehicleName },
                  { label: "Exterior Colour", value: v.exteriorColour },
                  { label: "Chassis No", value: v.chassisNo },
                  { label: "Engine No", value: v.engineNo },
                  { label: "Engine Capacity", value: v.engineCapacity },
                  { label: "Fuel Type", value: v.fuelType },
                  { label: "Country of Origin", value: v.countryOfOrigin },
                  { label: "Year of Manufacture", value: v.yom },
                  { label: "FOB Amount", value: `$${v.fobAmount}` },
                  { label: "Freight", value: `$${v.freight}` },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealerOrderDetails;