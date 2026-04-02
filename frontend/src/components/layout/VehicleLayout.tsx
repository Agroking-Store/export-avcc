import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import VehicleNavbar from './VehicleNavbar';

const VehicleLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'book'>('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (
      path.includes('/vehicles/list') ||
      path.includes('/vehicles/add') ||
      path.includes('/vehicles/edit') ||
      path.includes('/vehicles/view/')
    ) {
      setActiveTab('list');
    } else if (path.includes('/vehicles/book')) {
      setActiveTab('book');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'dashboard' | 'list' | 'book') => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      navigate('/vehicles');
    } else {
      navigate(`/vehicles/${tab}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="container mx-auto px-6 py-6 space-y-4">

        {/* Header — sits directly on page, no card */}
        <div className="flex items-center gap-4 px-1">
          <div className="bg-blue-600 p-3 rounded-xl shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM13 6l3 5h3l1 2v3h-2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Vehicle Module
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Dashboard &bull; Vehicle List &bull; Book Vehicle
            </p>
          </div>
        </div>

        {/* Navbar Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 px-6">
          <VehicleNavbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Body Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default VehicleLayout;