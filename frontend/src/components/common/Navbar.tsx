import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, LayoutDashboard, Store } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const clientNavItems = [
    { name: 'Clients', icon: <Users size={18} />, path: '/clients' },
    { name: 'Orders', icon: <FileText size={18} />, path: '/orders' },
  ];

  const dealerNavItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dealers/dashboard' },
    { name: 'Dealers', icon: <Store size={18} />, path: '/dealers' },
    { name: 'Orders', icon: <FileText size={18} />, path: '/dealers/orders/add' },
  ];

  const isDealer = location.pathname.startsWith('/dealers');
  const navItems = isDealer ? dealerNavItems : clientNavItems;

  const getIsActive = (itemPath: string) => {
    if (itemPath === '/dealers/dashboard') {
      return location.pathname === '/dealers/dashboard';
    }
    if (itemPath === '/dealers') {
      return (
        location.pathname === '/dealers' ||
        location.pathname.startsWith('/dealers/add') ||
        location.pathname.startsWith('/dealers/edit') ||
        /^\/dealers\/[a-f0-9]+$/.test(location.pathname)
      );
    }
    if (itemPath === '/dealers/orders/add') {
      return location.pathname.startsWith('/dealers/orders');
    }
    if (itemPath === '/clients') {
      return location.pathname.startsWith('/clients');
    }
    if (itemPath === '/orders') {
      return location.pathname.startsWith('/orders');
    }
    return location.pathname === itemPath;
  };

  return (
    <nav className="flex bg-transparent ml-2 rounded-r-2xl border-b border-gray-200/50 dark:border-gray-700/50">
      {navItems.map((item, index) => {
        const isActive = getIsActive(item.path);
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
              isActive
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white'
            } ${index === 0 ? 'rounded-tl-lg' : ''} ${index === navItems.length - 1 ? 'rounded-tr-lg' : ''}`}
          >
            {item.icon}
            <span className="text-sm font-semibold">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;