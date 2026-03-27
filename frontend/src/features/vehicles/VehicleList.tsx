import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Search, Filter, Plus } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { useNavigate } from "react-router-dom";

interface PaginatedVehicles {
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const getVehicleId = (vehicle: any): string => {
    return vehicle._id || vehicle.id || '';
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
      };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();

      const response = await vehicleApi.getVehicles(params);
      if (response.success && response.data) {
        const rawVehicles = response.data.data || [];
        setVehicles(rawVehicles as Vehicle[]);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      alert('Invalid vehicle ID');
      return;
    }
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await vehicleApi.delete(id);
      fetchVehicles();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, currentPage]);

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'Booked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const visibleVehicles = vehicles.filter(vehicle => getVehicleId(vehicle));

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b bg-slate-50 dark:bg-gray-700/50 border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg placeholder-slate-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/vehicles/add')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-300 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Vehicle Name</th>
                <th className="px-6 py-4 text-left font-semibold">Color</th>
                <th className="px-6 py-4 text-left font-semibold">Engine No</th>
                <th className="px-6 py-4 text-left font-semibold">Chassis No</th>
                <th className="px-6 py-4 text-center font-semibold">Quantity</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {visibleVehicles.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-gray-400">
                    No vehicles found matching your criteria
                  </td>
                </tr>
              ) : (
                visibleVehicles.map((vehicle) => (
                  <tr key={getVehicleId(vehicle)} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{vehicle.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                        {vehicle.color}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900 dark:text-white">{vehicle.engineNo}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900 dark:text-white">{vehicle.chassisNo}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">{vehicle.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/vehicles/edit/${getVehicleId(vehicle)}`)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(getVehicleId(vehicle))}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-gray-400">
                Page {currentPage} of {totalPages} ({vehicles.length} vehicles)
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleList;

