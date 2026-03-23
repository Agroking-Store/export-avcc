import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddClient = () => {
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
      await axios.post("http://localhost:5000/api/v1/clients", form);
      alert("Client added successfully ✅");
      navigate("/clients");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error adding client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Add Client</h1>
          <p className="text-gray-500 text-sm">
            Create a new client for vehicle export
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
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter client name"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Enter country"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email ID
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter address"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600"
            >
              {loading ? "Saving..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;