import React from 'react';
import { LayoutDashboard, List, CalendarPlus } from 'lucide-react';

interface VehicleNavbarProps {
  activeTab: 'dashboard' | 'list' | 'book';
  onTabChange: (tab: 'dashboard' | 'list' | 'book') => void;
}

const VehicleNavbar: React.FC<VehicleNavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'list'      as const, label: 'Vehicle List', icon: List },
    { id: 'book'      as const, label: 'Book Vehicle', icon: CalendarPlus },
  ];

  return (
    <nav className="flex space-x-8 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <div
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
  );
};

export default VehicleNavbar;