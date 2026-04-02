import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const VehicleView = () => {
  const { id: orderId, vehicleIndex } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleName = searchParams.get('name') || '';
  const vehicleColor = searchParams.get('color') || '';
  const srNo = searchParams.get('srNo') || '';
  // expandedIndex is the unique slot number — used to identify this specific vehicle copy
  const expandedIndex = searchParams.get('expandedIndex') || vehicleIndex || '0';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
          className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Vehicle Details</h1>
      </div>

      {/* Vehicle Card */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 border border-gray-200 dark:border-gray-600 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM13 6l3 5h3l1 2v3h-2" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sr No</label>
            <div className="bg-white dark:bg-gray-600 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600">
              {srNo}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle Name</label>
            <div className="bg-white dark:bg-gray-600 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 font-semibold">
              {vehicleName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Color</label>
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <div
                className="w-4 h-4 rounded-full border-2 border-slate-300"
                style={{ backgroundColor: vehicleColor.toLowerCase() }}
              />
              <span className="font-semibold">{vehicleColor}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  name: vehicleName,
                  color: vehicleColor,
                  srNo,
                  expandedIndex,
                });
                navigate(`/vehicles/view/${orderId}/edit-vehicle/${expandedIndex}?${params.toString()}`);
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Vehicle
            </button>
            <button
              onClick={() => navigate(`/vehicles/view/${orderId}`, { replace: true })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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