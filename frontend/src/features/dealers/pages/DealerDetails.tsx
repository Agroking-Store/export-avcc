import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const DealerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/v1/dealers/${id}`)
      .then(res => setDealer(res.data.data))
      .catch(console.error);
  }, [id]);

  if (!dealer) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dealer Details</h2>
          <p className="text-sm text-slate-500">{dealer._id.slice(-4)}</p>
        </div>
        <button onClick={() => navigate("/dealers")} className="text-sm text-slate-500 hover:text-slate-700">← Back to Dealers</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Dealer Information</h3>
        <div className="grid grid-cols-3 gap-6">
          <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{dealer.name}</p></div>
          <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium">{dealer.contact}</p></div>
          <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{dealer.email || "-"}</p></div>
          <div><p className="text-sm text-slate-500">Address</p><p className="font-medium">{dealer.address || "-"}</p></div>
          <div><p className="text-sm text-slate-500">GST Number</p><p className="font-medium">{dealer.gstNumber || "-"}</p></div>
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;