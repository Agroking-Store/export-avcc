import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Search, Filter, UserPlus } from "lucide-react";

const ClientsList = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  const fetchClients = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/v1/clients",
        {
          params: {
            search,
            page: currentPage,
            limit,
          },
        }
      );

      setClients(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, currentPage]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/v1/clients/${id}`);
      fetchClients();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen p-4 rounded">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Clients
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
            Manage all your export clients
          </p>
        </div>

        <button
          onClick={() => navigate("/clients/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
        >
          <UserPlus size={18} />
          Add Client
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">

        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 flex justify-between items-center">
          
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-300">
            <Filter size={16} />
            Filter: All Clients
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Search client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-md 
                          bg-white dark:bg-gray-800 
                          text-black dark:text-white 
                          border-slate-300 dark:border-gray-600
                          placeholder-gray-400 dark:placeholder-gray-300
                          focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            
            <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Client ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Country</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-center">Orders</th>
                <th className="px-6 py-3 text-center">Last Txn</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-300">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="border-t border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">
                    
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 px-2 py-1 rounded text-xs">
                        {client.clientCode || client._id.slice(-4)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        {client.companyName || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">{client.country}</td>
                    <td className="px-6 py-4">{client.phone}</td>
                    <td className="px-6 py-4">{client.email || "-"}</td>

                    <td className="px-6 py-4 text-center">
                      {client.totalOrders || 0}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {client.lastTransaction
                        ? new Date(client.lastTransaction).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => navigate(`/clients/${client._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/clients/edit/${client._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(client._id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
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
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded 
                         bg-white dark:bg-gray-700 
                         text-black dark:text-white 
                         border-slate-300 dark:border-gray-600"
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded 
                         bg-white dark:bg-gray-700 
                         text-black dark:text-white 
                         border-slate-300 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientsList;