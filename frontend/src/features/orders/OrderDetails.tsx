import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Download } from "lucide-react";
import { apiConfig } from "../../config/apiConfig";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft": return "bg-gray-100 text-gray-700";
    case "Confirmed": return "bg-blue-100 text-blue-700";
    case "PI Generated": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      setOrder(data);
      setClient(data.clientId || null);
    } catch (error) {
      console.error("Error fetching order", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const pdfRes = await axios.get(`${apiConfig.baseURL}/orders/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PI_${order?.orderId || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error downloading PDF");
    } finally {
      setDownloading(false);
    }
  };

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-base font-medium text-gray-800">{value || "-"}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 px-6 py-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600">Order Details</h1>
          <p className="text-sm text-gray-500">{order?.orderId || "Loading..."}</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate("/orders")} className="text-gray-500 hover:text-black text-sm">
            ← Back to Orders
          </button>
          <button
            onClick={() => navigate(`/orders/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
          >
            <Pencil size={15} /> Edit Order
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
          >
            <Download size={15} />
            {downloading ? "Downloading..." : "Download PI"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      )}

      {!loading && order && (
        <div className="space-y-6">

          {/* STATUS BADGE */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className="text-sm text-gray-400">
              Voucher No: <span className="text-gray-700 font-medium">{order.voucherNo || "-"}</span>
            </span>
            <span className="text-sm text-gray-400">
              Date: <span className="text-gray-700 font-medium">
                {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
              </span>
            </span>
          </div>

          {/* CLIENT INFO */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-semibold mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Field label="Client Name" value={client?.name} />
              <Field label="Company" value={client?.companyName} />
              <Field label="Country" value={client?.country} />
              <Field label="Contact" value={client?.phone} />
              <Field label="Email" value={client?.email} />
              <div className="md:col-span-2 lg:col-span-3">
                <Field label="Address" value={client?.address} />
              </div>
            </div>
          </div>

          {/* ORDER INFO */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-semibold mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Field label="Incoterm" value={order.incoterm} />
              <Field label="Port of Loading" value={order.portOfLoading} />
              <Field label="Port of Discharge" value={order.portOfDischarge} />
              <Field label="Payment Terms" value={order.paymentTerms} />
              <Field label="Buyer's Reference" value={order.buyerRef} />
            </div>
          </div>

          {/* VEHICLES */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-semibold mb-4">
              Vehicles <span className="text-gray-400 font-normal text-sm">({order.vehicles?.length || 0} total)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Sl</th>
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Chassis No</th>
                    <th className="px-4 py-3 text-left">Engine No</th>
                    <th className="px-4 py-3 text-left">Colour</th>
                    <th className="px-4 py-3 text-left">Fuel</th>
                    <th className="px-4 py-3 text-left">YOM</th>
                    <th className="px-4 py-3 text-right">FOB (USD)</th>
                    <th className="px-4 py-3 text-right">Freight</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.vehicles || []).map((v: any, i: number) => (
                    <tr key={i} className="border-t hover:bg-white">
                      <td className="px-4 py-3 text-gray-500">{v.slNo || i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{v.vehicleName}</div>
                        <div className="text-xs text-gray-400">{v.hsnCode}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{v.chassisNo}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.engineNo}</td>
                      <td className="px-4 py-3">{v.exteriorColour || "-"}</td>
                      <td className="px-4 py-3">{v.fuelType}</td>
                      <td className="px-4 py-3">{v.yom}</td>
                      <td className="px-4 py-3 text-right">${v.fobAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${v.freight?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">
                        ${v.totalAmount?.toLocaleString() || ((v.fobAmount + v.freight) * v.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-semibold mb-4">Order Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
                <p className="text-lg font-bold text-gray-800">{order.vehicles?.length || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Grand Total</p>
                <p className="text-lg font-bold text-blue-600">USD {order.grandTotal?.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Amount in Words</p>
              <p className="text-sm font-medium text-gray-700">USD {order.grandTotalInWords} Only</p>
            </div>
          </div>

          {/* BANK DETAILS */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-semibold mb-4">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Field label="Bank Name" value={order.bankName} />
              <Field label="Account No" value={order.accountNo} />
              <Field label="Branch" value={order.branch} />
              <Field label="IFS Code" value={order.ifscCode} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default OrderDetails;