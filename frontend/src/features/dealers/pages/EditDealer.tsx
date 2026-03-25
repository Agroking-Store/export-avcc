import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditDealer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", contact: "", email: "", address: "", gstNumber: "",
  });

  useEffect(() => {
    axios.get(`http://localhost:5000/api/v1/dealers/${id}`)
      .then(res => setForm(res.data.data))
      .catch(console.error);
  }, [id]);

  const handleSubmit = async () => {
    try {
      await axios.put(`http://localhost:5000/api/v1/dealers/${id}`, form);
      navigate("/dealers");
    } catch {
      alert("Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Edit Dealer</h2>
          <p className="text-sm text-slate-500">Update dealer details</p>
        </div>
        <button onClick={() => navigate("/dealers")} className="text-sm text-slate-500 hover:text-slate-700">← Back to Dealers</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Dealer Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Contact Number *</label>
            <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">GST Number</label>
            <input type="text" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">Update Dealer</button>
          <button onClick={() => navigate("/dealers")} className="px-6 py-2.5 border text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditDealer;