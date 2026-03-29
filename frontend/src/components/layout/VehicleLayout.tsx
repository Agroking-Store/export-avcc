import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import VehicleNavbar from './VehicleNavbar';

const VehicleLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'book'>('dashboard');

  // Determine active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/vehicles/list') || path.includes('/vehicles/add') || path.includes('/vehicles/edit') || path.includes('/vehicles/view/')) {
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

  // Determine header content based on current route
  const getHeaderContent = () => {
    const path = location.pathname;
    
    // Check for booking page FIRST (most specific)
    if (path.includes('/vehicles/book')) {
      return {
        title: 'Book Vehicle',
        subtitle: 'Reserve vehicles for your clients',
        color: 'from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900',
        navbarColor: 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30',
        navbarBorderColor: 'border-purple-300 dark:border-purple-600',
        borderColor: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-700 dark:text-purple-300',
        contentBg: 'bg-white dark:bg-gray-900',
        contentBorder: 'border-purple-100 dark:border-purple-800/50'
      };
    }
    
    // Check for list-related pages (second priority)
    if (path.includes('/vehicles/list') || path.includes('/vehicles/add') || path.includes('/vehicles/edit') || path.includes('/vehicles/view/')) {
      // Check if it's actually a vehicle details page (has vehicle ID)
      const isVehicleDetails = path.match(/\/vehicles\/view\/[a-f0-9]+$/i);
      if (isVehicleDetails) {
        return {
          title: 'Vehicle List',
          subtitle: 'Browse and manage your vehicle inventory',
          color: 'from-green-600 to-green-700 dark:from-green-800 dark:to-green-900',
          navbarColor: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
          navbarBorderColor: 'border-green-300 dark:border-green-600',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          contentBg: 'bg-white dark:bg-gray-900',
          contentBorder: 'border-green-100 dark:border-green-800/50'
        };
      } else if (path.includes('/vehicles/list') || path.includes('/vehicles/add') || path.includes('/vehicles/edit')) {
        return {
          title: 'Vehicle List',
          subtitle: 'Browse and manage your vehicle inventory',
          color: 'from-green-600 to-green-700 dark:from-green-800 dark:to-green-900',
          navbarColor: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
          navbarBorderColor: 'border-green-300 dark:border-green-600',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          contentBg: 'bg-white dark:bg-gray-900',
          contentBorder: 'border-green-100 dark:border-green-800/50'
        };
      }
    }
    
    // Default fallback for dashboard or any unmatched routes
    return {
      title: 'Vehicle Dashboard',
      subtitle: 'Manage your vehicle inventory and bookings',
      color: 'from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900',
      navbarColor: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
      navbarBorderColor: 'border-blue-300 dark:border-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      contentBg: 'bg-white dark:bg-gray-900',
      contentBorder: 'border-blue-100 dark:border-blue-800/50'
    };
  };

  const headerContent = getHeaderContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Vehicle Header */}
      <div className={`bg-gradient-to-r ${headerContent.color} text-white shadow-lg`}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{headerContent.title}</h1>
              <p className="text-blue-100 text-sm mt-1">{headerContent.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Navbar */}
      <VehicleNavbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        themeColor={headerContent.color}
        navbarBg={headerContent.navbarColor}
        borderColor={headerContent.borderColor}
        textColor={headerContent.textColor}
      />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className={`${headerContent.contentBg} rounded-2xl shadow-sm border ${headerContent.contentBorder} space-y-6`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default VehicleLayout;
