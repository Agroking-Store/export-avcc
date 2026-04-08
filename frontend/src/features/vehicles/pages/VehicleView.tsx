import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Car, Edit3, Hash, Palette } from 'lucide-react';

const VehicleView = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleName = searchParams.get('name') || '';
  const vehicleColor = searchParams.get('color') || '';
  const srNo = searchParams.get('srNo') || '';
  const expandedIndex = searchParams.get('expandedIndex') || vehicleIndex || '0';

  // Generate a nice gradient based on color
  const getColorGradient = (color: string) => {
    const colorLower = color.toLowerCase();
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
          onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
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
        <div className={`bg-gradient-to-r ${getColorGradient(vehicleColor)} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Vehicle Details</p>
              <h1 className="text-2xl font-bold text-white">{vehicleName}</h1>
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
                style={{ backgroundColor: vehicleColor.toLowerCase() }}
              />
              <span className="capitalize">{vehicleColor}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Serial Number */}
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

            {/* Vehicle Name */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                  Vehicle Name
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                  {vehicleName}
                </p>
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Palette className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                  Color
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 shadow-sm"
                    style={{ backgroundColor: vehicleColor.toLowerCase() }}
                  />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {vehicleColor}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  name: vehicleName,
                  color: vehicleColor,
                  srNo,
                  expandedIndex,
                });
                navigate(
                  `/vehicles/view/${orderId}/edit-vehicle/${expandedIndex}?${params.toString()}`
                );
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Edit3 size={18} />
              Edit Vehicle
            </button>
            <button
              onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleView;