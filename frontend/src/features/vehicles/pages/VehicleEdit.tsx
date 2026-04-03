import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Car, Hash, Palette, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';

const VehicleEdit = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [name, setName] = useState(searchParams.get('name') || '');
  const [color, setColor] = useState(searchParams.get('color') || '');
  const [srNo] = useState(searchParams.get('srNo') || '');

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
                const colorOverride = data.vehicleColors?.find(
                  (vc: any) => vc.expandedIndex === idx
                );
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
      await axios.put(`${apiConfig.baseURL}/orders/${orderId}`, {
        vehicleColorUpdate: {
          expandedIndex: parseInt(expandedIndex),
          color,
        },
      });

      // Show success state
      setShowSuccess(true);
      toast.success('Vehicle updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/vehicles/view/${orderId}`, { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Common color suggestions
  const colorSuggestions = [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 
    'Brown', 'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Pink'
  ];

  // Generate a nice gradient based on color
  const getColorGradient = (colorValue: string) => {
    const colorLower = colorValue.toLowerCase();
    const gradients: Record<string, string> = {
      red: 'from-red-500 to-red-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      black: 'from-gray-700 to-gray-900',
      white: 'from-gray-300 to-gray-400',
      silver: 'from-gray-400 to-gray-500',
      grey: 'from-gray-500 to-gray-600',
      gray: 'from-gray-500 to-gray-600',
      yellow: 'from-yellow-500 to-yellow-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      brown: 'from-amber-700 to-amber-800',
      beige: 'from-amber-200 to-amber-300',
      gold: 'from-amber-500 to-amber-600',
      pink: 'from-pink-500 to-pink-600',
    };
    return gradients[colorLower] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back to Order</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getColorGradient(color)} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Edit Vehicle</p>
              <h1 className="text-2xl font-bold text-white">{name}</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Car className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-4 text-white/90 text-sm">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              Sr No: {srNo}
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white/50"
                style={{ backgroundColor: color.toLowerCase() }}
              />
              <span className="capitalize">{color}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-4">
              {/* Serial Number - Read Only */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg">
                  <Hash className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    Serial Number
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                    {srNo}
                  </p>
                </div>
              </div>

              {/* Vehicle Name - Read Only */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    Vehicle Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                    {name}
                  </p>
                </div>
              </div>

              {/* Color - Editable */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <Palette className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                      Color <span className="text-red-500">*</span>
                    </p>
                  </div>
                </div>
                <div className="pl-16">
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    placeholder="Enter vehicle color (e.g., Red, Blue, White)"
                    required
                  />

                  {/* Color Suggestions */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {colorSuggestions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${
                            color === c
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: c.toLowerCase() }}
                          />
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Vehicle updated successfully!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Redirecting to order details...
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading || showSuccess}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Vehicle
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading || showSuccess}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleEdit;