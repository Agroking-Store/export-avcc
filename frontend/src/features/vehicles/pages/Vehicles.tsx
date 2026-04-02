import React, { useState, useEffect } from 'react';
import { Car, BadgeCheck } from 'lucide-react';
import { vehicleApi, VehicleStats } from '../../../services/vehicleApi';

const Vehicles: React.FC = () => {
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await vehicleApi.getStats();
        if (response.success) {
          setStats(response.data!);
        }
      } catch (error) {
        console.error('Failed to fetch vehicle stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8 text-center transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Total Vehicles</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {loadingStats ? '...' : stats?.total ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8 text-center transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Available</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {loadingStats ? '...' : stats?.available ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
