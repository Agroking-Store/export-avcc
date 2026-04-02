import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';

const VehicleEdit = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  
  // Get data from URL query params first (passed from VehicleView)
  const [name, setName] = useState(searchParams.get('name') || '');
  const [color, setColor] = useState(searchParams.get('color') || '');
  const [srNo, setSrNo] = useState(searchParams.get('srNo') || '');

  // Debug params
  console.log('VehicleEdit params:', { orderId, vehicleIndex, name, color, srNo });

  useEffect(() => {
    // First, set data from URL params if available
    if (searchParams.get('name')) {
      setName(searchParams.get('name') || '');
      setColor(searchParams.get('color') || '');
      setSrNo(searchParams.get('srNo') || '');
    }

    // Then, try to fetch from API to ensure data is accurate
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const res = await axios.get(`${apiConfig.baseURL}/orders/${orderId}`);
        const data = res.data.order || res.data;
        setOrder(data);
        
        // Only update if we don't have data from URL params
        if (!searchParams.get('name') && vehicleIndex !== undefined && data.vehicles) {
          const index = parseInt(vehicleIndex);
          const vehicle = data.vehicles[index];
          if (vehicle) {
            setName(vehicle.name || '');
            setColor(vehicle.color || '');
            setSrNo(vehicle.srNo || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        // Don't show error if we have data from URL params
        if (!searchParams.get('name')) {
          toast.error('Failed to load vehicle data');
        }
      }
    };

    fetchOrder();
  }, [orderId, vehicleIndex, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!orderId || vehicleIndex === undefined) {
      toast.error('Invalid order or vehicle data. Please go back to order details.');
      setLoading(false);
      return;
    }

    console.log('Submitting update:', { orderId, vehicleIndex, color, name, srNo });

    try {
      // Update order.vehicles[vehicleIndex] - map frontend fields to backend fields
      const response = await axios.put(`${apiConfig.baseURL}/orders/${orderId}`, {
        vehiclesUpdate: {
          index: parseInt(vehicleIndex),
          color: color,           // maps to exteriorColour
          name: name,             // maps to vehicleName
          srNo: srNo              // maps to chassisNo
        }
      });

      console.log('Update response:', response.data);
      toast.success('Vehicle updated successfully!');
      navigate(-1); // Back to VehicleDetails
    } catch (error: any) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update vehicle';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
          Edit Vehicle
        </h1>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700 rounded-xl p-8 border border-gray-200 dark:border-gray-600">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sr No
            </label>
            <input
              type="text"
              value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color <span className="text-sm text-red-500">*</span>
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g. Red, Blue, White"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Updating...' : 'Update Vehicle'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleEdit;

