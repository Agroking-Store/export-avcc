import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Send, ArrowLeft } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
      toast.error('Please fill all required fields');
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
        // Find the selected vehicle and client for the summary
        const selectedVehicle = availableVehicles.find(v => getVehicleId(v) === formData.vehicleId);
        const selectedClient = clients.find(c => c._id === formData.clientId);
        
        const summaryMessage = (
          <div className="space-y-2">
            <div className="font-semibold text-green-600 dark:text-green-400">Booking Confirmed!</div>
            <div className="text-sm">
              <span className="font-medium">Vehicle:</span> {selectedVehicle?.name} - {selectedVehicle?.color}
            </div>
            <div className="text-sm">
              <span className="font-medium">Client:</span> {selectedClient?.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Quantity:</span> {formData.quantity}
            </div>
            <div className="text-sm">
              <span className="font-medium">Amount:</span> ${Number(formData.amount).toLocaleString()}
            </div>
            <div className="text-sm">
              <span className="font-medium">Date:</span> {new Date(formData.date).toLocaleDateString()}
            </div>
          </div>
        );
        
        toast.success(summaryMessage, {
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
        });
        navigate('/vehicles/list');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Details</h2>
                  <p className="text-gray-600 dark:text-gray-300">Fill in the booking information</p>
                </div>
              </div>

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
                    className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                    className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                    className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                    className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                      className="w-full pl-12 pr-4 py-3 text-sm border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 resize-vertical focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    placeholder="Additional booking notes..."
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl focus:ring-4 focus:ring-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    onClick={() => navigate("/vehicles/list")}
                    className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center gap-1"
                  >
                    <ArrowLeft size={16} />
                    Back to List
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar/Info Section */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Available Vehicles:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{availableVehicles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Registered Clients:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{clients.length}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Verify vehicle availability before booking
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Confirm client details for accurate records
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Set appropriate booking dates
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Add notes for special requirements
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookVehicle;
