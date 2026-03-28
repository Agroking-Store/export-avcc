import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";

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
        `${apiConfig.baseURL}/clients/${id}`
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
      toast.error("Name, Contact Number and Country are required");
      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `${apiConfig.baseURL}/clients/${id}`,
        form
      );

      navigate("/clients/list", {
        state: { success: "Client updated successfully ✅" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Edit Client
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Update client details
          </p>
        </div>

        <button
          onClick={() => navigate("/clients/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to Clients
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Client Details Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Client Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Name */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Client Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Contact Number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Country *
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-800 
           text-black dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-300
           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">

          <button
            type="button"
            onClick={() => navigate("/clients/list")}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 
           bg-white dark:bg-gray-700 
           text-gray-700 dark:text-white 
           rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
           dark:bg-blue-500 dark:hover:bg-blue-600 
           text-white rounded-lg transition"
          >
            {loading ? "Updating..." : "Update Client"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default EditClient;