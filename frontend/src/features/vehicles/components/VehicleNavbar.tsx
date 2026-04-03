import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, List, Car } from 'lucide-react';

const VehicleNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (
      path.includes('/vehicles/list') ||
      path.includes('/vehicles/add') ||
      path.includes('/vehicles/edit') ||
      path.includes('/vehicles/view/')
    ) {
      setActiveTab('list');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'dashboard' | 'list') => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      navigate('/vehicles');
    } else {
      navigate('/vehicles/list');
    }
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'list' as const, label: 'Vehicle List', icon: List },
  ];

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shrink-0 shadow-inner">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Vehicle Module
            </h1>
            <p className="text-sm text-blue-100 mt-1 opacity-90">
              Manage your vehicle inventory and orders efficiently
            </p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
      </div>

      {/* Navbar Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 px-2">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Body Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <Outlet />
      </div>
    </div>
  );
};

export default VehicleNavbar;