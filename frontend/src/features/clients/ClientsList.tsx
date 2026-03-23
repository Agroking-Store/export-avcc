import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ClientsList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const limit = 5;

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?"
    );
  
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`http://localhost:5000/api/v1/clients/${id}`);
  
      // ✅ SUCCESS MESSAGE HERE
      alert("Client deleted successfully");
  
      // Refresh UI
      setClients((prev) =>
        prev.filter((client) => client._id !== id)
      );
    } catch (error) {
      console.error("Delete failed", error);
      alert("Error deleting client");
    }
  };

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
      setTotal(res.data.total);
  
    } catch (error) {
      console.error("Error fetching clients", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchClients();
}, [search, currentPage]);

useEffect(() => {
  setCurrentPage(1);
}, [search]);

  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-gray-500 text-sm">
            Manage all your export clients
          </p>
        </div>

        <button
          onClick={() => navigate("/clients/add")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          + Add Client
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-6">Loading clients...</div>
        ) : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-600">
            <tr>
              <th className="px-6 py-3">Client ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 text-center">Country</th>
              <th className="px-6 py-3 text-center">Contact</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3 text-center">Total Orders</th>
              <th className="px-6 py-3 text-center">Last Transaction</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

        <tbody>
          {clients.map((client) => (
            <tr
              key={client._id}
              className="border-b hover:bg-gray-50 align-middle"
            >
              {/* Client ID */}
              <td className="px-6 py-4">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                  {client.clientCode || `CL-${client._id.slice(-4).toUpperCase()}`}
                </span>
              </td>
        
              {/* Name + Company */}
              <td className="px-6 py-4">
                <div className="font-medium">{client.name}</div>
                <div className="text-xs text-gray-500">
                  {client.companyName || "-"}
                </div>
              </td>
        
              {/* Country */}
              <td className="px-6 py-4 text-center">
                {client.country}
              </td>
        
              {/* Contact */}
              <td className="px-6 py-4 text-center">
                {client.phone}
              </td>
        
              {/* Email */}
              <td className="px-6 py-4">
                {client.email || "-"}
              </td>
              
              <td className="px-6 py-4 text-center">
                {client.totalOrders || 0}
              </td>
              
              <td className="px-6 py-4 text-center">
                {client.lastTransaction
                  ? new Date(client.lastTransaction).toLocaleDateString()
                  : "-"}
              </td>
        
              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-4">
                    <button
                      className="text-gray-700 hover:text-blue-600"
                      onClick={() => navigate(`/clients/${client._id}`)}
                    >
                      View
                    </button>
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => navigate(`/clients/edit/${client._id}`)}
                  >
                    Edit
                  </button>
        
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDelete(client._id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{start}</span> –{" "}
            <span className="font-medium">{end}</span> of{" "}
            <span className="font-medium">{total}</span>
          </p>
        
          <div className="flex items-center gap-2">
        
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-md border bg-gray-100 hover:bg-gray-200"
            >
              Prev
            </button>
        
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  currentPage === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 border hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
        
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-md border bg-gray-100 hover:bg-gray-200"
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