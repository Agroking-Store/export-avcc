import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import DealerNav from "../components/DealerNav";

const DealerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/v1/dealers/${id}`)
      .then(res => setDealer(res.data.data))
      .catch(console.error);
  }, [id]);

  if (!dealer) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <DealerNav />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dealer Details</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">ID: {dealer.dealerId || dealer._id.slice(-6)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/dealers/edit/${dealer._id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            <Pencil size={16} /> Edit
          </button>
          <button onClick={() => navigate("/dealers")}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            ← Back
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-6">Dealer Information</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Name", value: dealer.name },
            { label: "Contact", value: dealer.contact },
            { label: "Email", value: dealer.email || "-" },
            { label: "Address", value: dealer.address || "-" },
            { label: "GST Number", value: dealer.gstNumber || "-" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;