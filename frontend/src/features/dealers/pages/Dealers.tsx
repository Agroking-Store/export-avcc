import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Search, Filter, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import DealerNav from "../components/DealerNav";

const Dealers = () => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 5;

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/v1/dealers", {
        params: { search, page: currentPage, limit },
      });
      setDealers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDealers(); }, [search, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/dealers/${deleteId}`);
      toast.success("Dealer deleted!");
      setDeleteId(null);
      fetchDealers();
    } catch {
      toast.error("Delete failed");
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Delete Dealer</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this dealer?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <DealerNav />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dealers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all your dealers</p>
        </div>
        <button onClick={() => navigate("/dealers/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
          <UserPlus size={18} /> Add Dealer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Filter size={16} /> Filter: All Dealers
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Search dealer..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Dealer ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">GST Number</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.length === 0 && !loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 dark:text-slate-400">No dealers found</td></tr>
              ) : (
                dealers.map((dealer) => (
                  <tr key={dealer._id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-600 dark:text-slate-200 px-2 py-1 rounded text-xs">
                        {dealer.dealerId || dealer._id.slice(-4)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{dealer.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dealer.contact}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dealer.email || "-"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dealer.address || "-"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dealer.gstNumber || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`/dealers/${dealer._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded"><Eye size={18} /></button>
                        <button onClick={() => navigate(`/dealers/edit/${dealer._id}`)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-slate-600 rounded"><Pencil size={18} /></button>
                        <button onClick={() => setDeleteId(dealer._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 rounded"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-gray-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
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

export default Dealers;