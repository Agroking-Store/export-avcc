import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Car, Hash, Palette, Check, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';
import { orderApi } from '../../../services/orderApi';

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
    if (!searchParams.get('name') && orderId) {
      const fetchOrder = async () => {
        try {
          const res = await axios.get(`${apiConfig.baseURL}/orders/${orderId}`);
          const data = res.data.order || res.data;

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
      await orderApi.update(orderId!, {
        vehicleColorUpdate: {
          expandedIndex: parseInt(expandedIndex),
          color,
        },
      });

      setShowSuccess(true);
      toast.success('Vehicle updated successfully!');

      setTimeout(() => {
        navigate(`/vehicles/view/${orderId}`, { replace: true });
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const colorSuggestions = [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green',
    'Brown', 'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Pink'
  ];

  const getColorGradient = (colorValue: string) => {
    const colorLower = colorValue.toLowerCase();
    const gradients: Record<string, string> = {
      red: "from-red-500 to-red-600",
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      black: "from-gray-700 to-gray-900",
      white: "from-gray-300 to-gray-400",
      silver: "from-gray-400 to-gray-500",
      grey: "from-gray-500 to-gray-600",
      gray: "from-gray-500 to-gray-600",
      yellow: "from-yellow-500 to-yellow-600",
      orange: "from-orange-500 to-orange-600",
      purple: "from-purple-500 to-purple-600",
      brown: "from-amber-700 to-amber-800",
      beige: "from-amber-200 to-amber-300",
      gold: "from-amber-500 to-amber-600",
      pink: "from-pink-500 to-pink-600",
    };
    return gradients[colorLower] || "from-slate-500 to-slate-600";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 lg:p-10 animate-in fade-in duration-500">

      {/* Header and Back Button */}
      <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Unit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure individual unit details and configurations</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden max-w-3xl mx-auto transition-all hover:shadow-lg">

        {/* Dynamic Gradient Header */}
        <div className={`bg-gradient-to-r ${getColorGradient(color)} p-8 relative overflow-hidden transition-colors duration-500`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/20 rounded-full blur-3xl"></div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">
                Editing Model
              </p>
              <h1 className="text-4xl font-black text-white tracking-tight">{name || "Vehicle"}</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
              <Car className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="relative mt-6 flex items-center gap-4 text-white/95 text-sm font-bold">
            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
              <Hash size={14} /> Unit No: {srNo || "–"}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white/80 shadow-inner"
                style={{ backgroundColor: color.toLowerCase() || 'transparent' }}
              />
              <span className="capitalize">{color || '–'}</span>
            </span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-8">

            {/* Info Cards Grid — matching VehicleView layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Serial Identifier (read-only) */}
              <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Hash size={14} className="text-blue-500" /> Serial Identifier
                </p>
                <h3 className="text-2xl font-bold text-[#2D3748] dark:text-gray-100">{srNo || '–'}</h3>
              </div>

              {/* Vehicle Model (read-only) */}
              <div className="group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 flex flex-col justify-center border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Car size={14} className="text-indigo-500" /> Vehicle Model
                </p>
                <h3 className="text-2xl font-bold text-[#2D3748] dark:text-gray-100">{name || '–'}</h3>
              </div>

              {/* Paint Job — editable, spans full width */}
              <div className="md:col-span-2 group bg-[#F8F9FB] dark:bg-gray-800 rounded-2xl p-6 border border-[#F1F3F6] dark:border-gray-700 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md">
                <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Palette size={14} className="text-emerald-500" /> Paint Job Configuration
                </p>

                {/* Color Input */}
                <div className="relative flex items-center mb-4">
                  <div
                    className="absolute left-4 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 shadow-sm transition-all duration-300"
                    style={{ backgroundColor: color.toLowerCase() || 'transparent' }}
                  />
                  <input
                    name="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-[#E2E8F0] dark:border-gray-600 rounded-xl px-4 py-3 pl-11 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g., Cherry Red, Royal Blue"
                    required
                  />
                </div>

                {/* Color Presets */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-[#E2E8F0] dark:border-gray-600">
                  <p className="text-[10px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-widest mb-3">Quick Presets</p>
                  <div className="flex flex-wrap gap-2">
                    {colorSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 ${
                          color.toLowerCase() === c.toLowerCase()
                            ? 'bg-[#1877F2] border-[#1877F2] text-white shadow-md shadow-blue-200'
                            : 'bg-[#F8F9FB] dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-500 shadow-inner"
                          style={{ backgroundColor: c.toLowerCase() }}
                        />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Success Banner */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-[#EBFDF5] dark:bg-emerald-900/30 border border-[#D1FAE5] dark:border-emerald-800/50 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-lg text-emerald-600 dark:text-emerald-300">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Vehicle unit updated successfully!</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">Redirecting...</p>
                </div>
              </div>
            )}

            {/* Action Buttons — matching VehicleView footer style */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading || showSuccess}
                className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                <X size={16} /> Discard Changes
              </button>

              <button
                type="submit"
                disabled={loading || showSuccess}
                className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 active:scale-95"
              >
                {loading ? "Updating..." : <><Save size={18} /> Save Configurations</>}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleEdit;