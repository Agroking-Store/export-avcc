import { apiConfig } from "@/config/apiConfig";
import axios from "axios";
import { useEffect, useState } from "react";
export interface Client {
    id: string;          // from backend DTO (or _id fallback)
    clientCode: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    companyName: string;
}
const ClientsTable = () => {

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
     const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiConfig.baseURL}/clients/getLatestClients`);
            
            setClients(res.data);
            console.log(clients)
        } catch (error) {
            console.error("Error fetching client", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchClients();
    }, []);
    if (loading) return <p>Loading clients...</p>;
    if (clients.length === 0) return <p>No clients found</p>;

   



    return <>
  <div className="bg-white rounded-xl shadow border">
  {/* Header */}
  <div className="p-4 border-b flex justify-between items-center">
    <h2 className="text-lg font-semibold">Clients</h2>
    <span className="text-sm text-gray-500">
      Total: {clients.length}
    </span>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-left">
      <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
        <tr>
          <th className="px-4 py-3">Client Code</th>
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">Company</th>
          <th className="px-4 py-3">Email</th>
          <th className="px-4 py-3">Phone</th>
          <th className="px-4 py-3">Country</th>
        </tr>
      </thead>

      <tbody className="divide-y">
        {clients.map((client) => (
          <tr
            key={client.id}
            className="hover:bg-gray-50 transition"
          >
            <td className="px-4 py-3 font-medium text-blue-600">
              {client.clientCode}
            </td>
            <td className="px-4 py-3">{client.name}</td>
            <td className="px-4 py-3">{client.companyName}</td>
            <td className="px-4 py-3 text-gray-600">
              {client.email}
            </td>
            <td className="px-4 py-3">{client.phone}</td>
            <td className="px-4 py-3">{client.country}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
</>
};


export default ClientsTable;