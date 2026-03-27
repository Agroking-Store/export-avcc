import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Send, X, ArrowLeft } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { useNavigate } from "react-router-dom";

const BookVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    vehicleId: '',
    clientId: '',
    quantity: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.clientId || !formData.quantity || !formData.amount || !formData.date) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        vehicleId: formData.vehicleId,
        clientId: formData.clientId,
        quantity: Number(formData.quantity),
        amount: Number(formData.amount),
        date: formData.date,
        notes: formData.notes || '',
      };
      const response = await vehicleApi.bookVehicle(bookingData);
      if (response.success) {
        alert('Vehicle booked successfully! Quantity reduced, status updated if needed.');
        navigate('/vehicles');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Calendar size={28} className="text-blue-600 dark:text-blue-400" />
          Book a Vehicle
        </h2>
        <p className="text-slate-600 dark:text-gray-400 mb-8">Select an available vehicle and book it for a client</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Select Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              disabled={loadingVehicles}
              className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="">Choose a vehicle...</option>
              {availableVehicles.map((vehicle) => (
                <option key={getVehicleId(vehicle)} value={getVehicleId(vehicle)}>
                  {vehicle.name} - {vehicle.color} (Engine: {vehicle.engineNo}) - Qty: {vehicle.quantity}
                </option>
              ))}
            </select>
            {loadingVehicles && <p className="text-sm text-slate-500 mt-1">Loading available vehicles...</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              disabled={loadingClients}
              className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="">Select client...</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} - {client.companyName || client.country}
                </option>
              ))}
            </select>
            {loadingClients && <p className="text-sm text-slate-500 mt-1">Loading clients...</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Booking Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full p-3 border border-slate-300 Asc dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Booking Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-sm border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
              <Calendar className="absolute Asc left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              Asc value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              placeholder="Additional booking notes..."
            ></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue Asc -600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                  Booking...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Confirm Booking
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="px-6 py-3 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookVehicle;
