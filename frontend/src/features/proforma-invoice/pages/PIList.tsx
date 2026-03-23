import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";

const PIList = () => {
  const navigate = useNavigate();

  const [pis, setPis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 5;

  const fetchPIs = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices`,
        {
          params: {
            search,
            page: currentPage,
            limit,
          },
        }
      );

      setPis(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching PIs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPIs();
  }, [search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-200 text-gray-700";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "sent_to_buyer":
        return "bg-blue-100 text-blue-700";
      case "lc_received":
        return "bg-purple-100 text-purple-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100";
    }
  };

  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  const handleDelete = async (id: string) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this PI?"
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(
      `${apiConfig.baseURL}/proforma-invoices/${id}`
    );

    alert("PI deleted successfully");

    // refresh list
    fetchPIs();
  } catch (error) {
    console.error("Delete failed", error);
    alert("Error deleting PI");
  }
};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Proforma Invoices
          </h1>
          <p className="text-gray-500 text-sm">
            Manage all PIs
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice/add")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          + Create PI
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search PI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            Loading...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="px-6 py-3">PI Number</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3 text-center">Total</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {pis.map((pi) => (
                <tr
                  key={pi._id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium">
                    {pi.piNumber}
                  </td>

                  <td className="px-6 py-4">
                    {pi.client_id?.name} (
                    {pi.client_id?.clientCode})
                  </td>

                  <td className="px-6 py-4 text-center">
                    ${pi.totalAmount}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${getStatusColor(
                        pi.status
                      )}`}
                    >
                      {pi.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {new Date(
                      pi.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4">
                      
                      {/* View */}
                      <button
                        onClick={() =>
                          navigate(`/proforma-invoice/${pi._id}`)
                        }
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </button>
                  
                      {/* Edit */}
                      <button
                        onClick={() =>
                          navigate(`/proforma-invoice/edit/${pi._id}`)
                        }
                        className="text-green-600 hover:underline"
                      >
                        Edit
                      </button>
                  
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(pi._id)}
                        className="text-red-500 hover:underline"
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-gray-500">
            Showing {start} – {end} of {total}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setCurrentPage(i + 1)
                  }
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "border"
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
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

export default PIList;