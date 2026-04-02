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

  const [name, setName] = useState(searchParams.get('name') || '');
  const [color, setColor] = useState(searchParams.get('color') || '');
  const [srNo] = useState(searchParams.get('srNo') || '');

  // expandedIndex = unique slot number for this vehicle copy — this is what backend uses
  const expandedIndex = searchParams.get('expandedIndex') || vehicleIndex || '0';

  useEffect(() => {
    // If params missing (e.g. direct URL access), fetch from API
    if (!searchParams.get('name') && orderId) {
      const fetchOrder = async () => {
        try {
          const res = await axios.get(`${apiConfig.baseURL}/orders/${orderId}`);
          const data = res.data.order || res.data;

          // Rebuild expanded list to find this slot
          let idx = 0;
          const targetIdx = parseInt(expandedIndex);
          for (const v of (data.vehicles || [])) {
            const qty = v.quantity ?? 1;
            for (let q = 0; q < qty; q++) {
              if (idx === targetIdx) {
                const colorOverride = data.vehicleColors?.find((vc: any) => vc.expandedIndex === idx);
                setName(v.name || '');
                setColor(colorOverride ? colorOverride.color : (v.color || ''));
                return;
              }
              idx++;
            }
          }
        } catch (error) {
          console.error('Failed to fetch order:', error);
          toast.error('Failed to load vehicle data');
        }
      };
      fetchOrder();
    }
  }, [orderId, expandedIndex, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error('Invalid order. Please go back.');
      return;
    }
    setLoading(true);

    try {
      // Send vehicleColorUpdate with expandedIndex — backend saves this to vehicleColors[]
      // This only updates THIS specific vehicle copy's color, nothing else changes
      await axios.put(`${apiConfig.baseURL}/orders/${orderId}`, {
        vehicleColorUpdate: {
          expandedIndex: parseInt(expandedIndex),
          color,
        },
      });

      toast.success('Vehicle updated successfully!');
      // Seedha VehicleDetails table pe wapas — edit page history se bhi hata do
      navigate(`/vehicles/view/${orderId}`, { replace: true });
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
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
        <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Edit Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700 rounded-xl p-8 border border-gray-200 dark:border-gray-600">
        <div className="space-y-6">

          {/* Sr No - read only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sr No</label>
            <input
              type="text"
              value={srNo}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>

          {/* Vehicle Name - read only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Name</label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>

          {/* Color - editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color <span className="text-red-500">*</span>
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