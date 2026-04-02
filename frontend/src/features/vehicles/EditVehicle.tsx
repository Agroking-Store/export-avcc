import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, ArrowLeft } from "lucide-react";
import { vehicleApi, Vehicle } from "../../services/vehicleApi";
import { toast } from "react-toastify";

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    color: "",
    engineNo: "",
    chassisNo: "",
    status: "Available" as 'Available' | 'Booked',
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const res = await vehicleApi.getById(id!);
      const vehicleData = res.data;
      setForm({
        name: vehicleData.name || "",
        color: vehicleData.color || "",
        engineNo: vehicleData.engineNo || "",
        chassisNo: vehicleData.chassisNo || "",
        status: vehicleData.status || "Available",
      });
    } catch (error: any) {
      toast.error("Failed to load vehicle");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await vehicleApi.update(id!, form as Partial<Vehicle>);
      if (response.success) {
        toast.success("Vehicle updated successfully!");
        navigate("/vehicles/list");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating vehicle");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-green-600 dark:text-green-400">
            Edit Vehicle
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Update vehicle details
          </p>
        </div>

        <button
          onClick={() => navigate("/vehicles/list")}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back to List
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Vehicle Details Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Vehicle Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Name */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Vehicle Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter vehicle name"
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="Red, Blue, Black ..."
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Engine No */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Engine No *
              </label>
              <input
                type="text"
                name="engineNo"
                value={form.engineNo}
                onChange={handleChange}
                placeholder="Enter engine number"
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Chassis No */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Chassis No *
              </label>
              <input
                type="text"
                name="chassisNo"
                value={form.chassisNo}
                onChange={handleChange}
                placeholder="Enter chassis number"
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>



            {/* Status */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Status *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
              </select>
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/vehicles")}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-700 dark:text-white 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 
                       dark:bg-green-500 dark:hover:bg-green-600 
                       text-white rounded-lg transition shadow-md hover:shadow-lg"
          >
            {loading ? "Updating ..." : "Update Vehicle"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditVehicle;

