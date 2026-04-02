import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BookVehicle = () => {
  const navigate = useNavigate();

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    vehicleId: "",
    clientId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const getVehicleId = (vehicle: any): string => {
    return vehicle._id || vehicle.id || '';
  };

  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const response = await vehicleApi.getVehicles({ status: 'Available', limit: 50 });
        if (response.success && response.data) {
          setAvailableVehicles(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch available vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/clients`);
        setClients(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchAvailableVehicles();
    fetchClients();
  }, []);

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
    if (!form.vehicleId || !form.clientId || !form.amount || !form.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        vehicleId: form.vehicleId,
        clientId: form.clientId,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes || '',
      };
      const response = await vehicleApi.bookVehicle(bookingData);
      if (response.success) {
        toast.success("Vehicle booked successfully!");
        navigate("/vehicles/list");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
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
            Book Vehicle
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Create new booking
          </p>
        </div>

        <div></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Booking Details Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
            Booking Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Vehicle */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Select Vehicle *
              </label>
              <select
                name="vehicleId"
                value={form.vehicleId}
                onChange={handleChange}
                disabled={loadingVehicles}
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a vehicle...</option>
                {availableVehicles.map((vehicle) => (
                  <option key={getVehicleId(vehicle)} value={getVehicleId(vehicle)}>
                    {vehicle.name} - {vehicle.color} (Engine: {vehicle.engineNo})
                  </option>
                ))}
              </select>
              {loadingVehicles && <p className="text-xs text-gray-500 mt-1">Loading vehicles...</p>}
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Client *
              </label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                disabled={loadingClients}
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select client...</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} - {client.companyName || client.country}
                  </option>
                ))}
              </select>
              {loadingClients && <p className="text-xs text-gray-500 mt-1">Loading clients...</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Booking Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 
                           text-black dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-300
                           rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes..."
              className="w-full border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 
                         text-black dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-300
                         rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 resize-vertical"
            ></textarea>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">


          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 
                       text-white rounded-lg transition shadow-md hover:shadow-lg"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default BookVehicle;

