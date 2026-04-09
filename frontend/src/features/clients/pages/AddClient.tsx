import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";

const AddClient = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    companyName: "",
    address: {
      houseBuilding: "",
      streetArea: "",
      cityTown: "",
      state: "",
      pincode: "",
      country: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      address: {
        ...form.address,
        [e.target.name]: e.target.value,
      },
    });
  };

  const validate = () => {
    if (!form.name.trim()) return "Client name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.companyName.trim()) return "Company name is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${apiConfig.baseURL}/clients/add`, form);

      navigate("/clients/list", {
        state: { success: "Client added successfully ✅" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Add Client
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Create a new client profile
          </p>
        </div>
        <button
          onClick={() => navigate("/clients/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ← Back to Clients
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Details Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Client Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Client Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter client name"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm mb-1">Contact Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Company Name */}
            <div>
              <label className="block text-sm mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                required
                value={form.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Primary Country */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Primary Country</label>
              <input
                type="text"
                name="country"
                required
                value={form.country}
                onChange={handleChange}
                placeholder="Enter primary country of business"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Shipping Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">House / Building No.</label>
              <input
                type="text"
                name="houseBuilding"
                value={form.address.houseBuilding}
                onChange={handleAddressChange}
                placeholder="e.g. Aprtment 12B, The Plaza"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Street / Area</label>
              <input
                type="text"
                name="streetArea"
                value={form.address.streetArea}
                onChange={handleAddressChange}
                placeholder="e.g. Mombasa Road"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">City / Town</label>
              <input
                type="text"
                name="cityTown"
                value={form.address.cityTown}
                onChange={handleAddressChange}
                placeholder="e.g. Pune"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">State / Province</label>
              <input
                type="text"
                name="state"
                value={form.address.state}
                onChange={handleAddressChange}
                placeholder="e.g. Maharashtra"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Pincode / ZIP</label>
              <input
                type="text"
                name="pincode"
                value={form.address.pincode}
                onChange={handleAddressChange}
                placeholder="e.g. 00100"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={form.address.country}
                onChange={handleAddressChange}
                placeholder="e.g. India"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/clients/list")}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition"
          >
            {loading ? "Saving..." : "Add Client"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClient;
