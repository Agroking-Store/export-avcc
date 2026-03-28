import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, LayoutDashboard, List, CalendarPlus } from 'lucide-react';

interface VehicleNavbarProps {
  activeTab: 'dashboard' | 'list' | 'book';
  onTabChange: (tab: 'dashboard' | 'list' | 'book') => void;
  themeColor?: string;
  navbarBg?: string;
  borderColor?: string;
  navbarBorderColor?: string;
  textColor?: string;
}

// Maps textColor values from VehicleLayout to their correct border equivalents
const textColorToBorderColor: Record<string, string> = {
  'text-blue-700 dark:text-blue-300':   'border-blue-600 dark:border-blue-400',
  'text-green-700 dark:text-green-300': 'border-green-600 dark:border-green-400',
  'text-purple-700 dark:text-purple-300': 'border-purple-600 dark:border-purple-400',
};

const VehicleNavbar: React.FC<VehicleNavbarProps> = ({ activeTab, onTabChange, navbarBg, borderColor, navbarBorderColor, textColor }) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'list' as const, label: 'Vehicle List', icon: List },
    { id: 'book' as const, label: 'Book Vehicle', icon: CalendarPlus },
  ];

  return (
    <div className={`border-b ${navbarBorderColor || borderColor || 'border-gray-200 dark:border-gray-700'} shadow-sm ${navbarBg || ''}`}>
      <div className="container mx-auto px-6 py-4">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            let tabTextColor = 'text-slate-600 dark:text-gray-400';
            let tabBorderColor = 'border-slate-300 dark:border-gray-600';

            if (isActive) {
              tabTextColor = textColor || 'text-blue-600 dark:text-blue-400';
              // Use the explicit map so the underline always gets a proper blue (or themed) color
              tabBorderColor =
                (textColor && textColorToBorderColor[textColor]) ||
                'border-blue-600 dark:border-blue-400';
            }

            return (
              <div
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium cursor-pointer whitespace-nowrap transition-all duration-200 text-sm ${
                  isActive
                    ? `border-b-4 ${tabBorderColor} ${tabTextColor}`
                    : 'border-b-2 border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? tabTextColor : ''} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default VehicleNavbar;