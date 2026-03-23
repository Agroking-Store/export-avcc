import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    country: "",
    email: "",
    address: "",
    companyName: "",
  });

  const [loading, setLoading] = useState(false);

  // Fetch existing client
  const fetchClient = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/v1/clients/${id}`
      );

     const client = res.data.client;

     setForm({
       name: client.name || "",
       phone: client.phone || "",
       country: client.country || "",
       email: client.email || "",
       address: client.address || "",
       companyName: client.companyName || "",
     });
    } catch (error) {
      console.error("Error fetching client", error);
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.country) {
      alert("Name, Contact Number and Country are required");
      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `http://localhost:5000/api/v1/clients/${id}`,
        form
      );

      alert("Client updated successfully ✅");
      navigate("/clients");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error updating client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Client</h1>
          <p className="text-gray-500 text-sm">
            Update client details
          </p>
        </div>

        <button
          onClick={() => navigate("/clients")}
          className="text-blue-500 hover:underline"
        >
          ← Back to Clients
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Client Details</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium mb-1">
                Client Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Country *
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg"
            >
              {loading ? "Updating..." : "Update Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;