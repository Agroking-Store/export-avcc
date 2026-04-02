import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, List } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header */}
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
            Dashboard • Vehicle List
          </p>
        </div>
      </div>

      {/* Navbar Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 px-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <div
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 text-sm font-medium whitespace-nowrap border-b-2 cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Body Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <Outlet />
      </div>
    </div>
  );
};

export default VehicleNavbar;
