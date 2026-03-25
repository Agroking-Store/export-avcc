import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Clients',
      icon: <Users size={18} />,
      path: '/clients',
    },
    {
      name: 'Orders',
      icon: <FileText size={18} />,
      path: '/orders',
    },
  ];

  return (
    <nav className="flex bg-transparent ml-2 rounded-r-2xl border-b border-gray-200/50 dark:border-gray-700/50">
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
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
