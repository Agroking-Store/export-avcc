import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, FileText } from 'lucide-react';

const DealerNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={16} />, path: '/dealers/dashboard' },
    { name: 'Dealers', icon: <Store size={16} />, path: '/dealers' },
    { name: 'Orders', icon: <FileText size={16} />, path: '/dealers/orders' },
  ];

  const getIsActive = (path: string) => {
    if (path === '/dealers/dashboard') {
      return location.pathname === '/dealers/dashboard';
    }
    if (path === '/dealers') {
      return (
        location.pathname === '/dealers' ||
        location.pathname.startsWith('/dealers/add') ||
        location.pathname.startsWith('/dealers/edit') ||
        /^\/dealers\/[a-f0-9]+$/.test(location.pathname)
      );
    }
    if (path === '/dealers/orders') {
      return (
        location.pathname === '/dealers/orders' ||
        location.pathname.startsWith('/dealers/orders')
      );
    }
    return false;
  };

  return (
  <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">

      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
            getIsActive(item.path)
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default DealerNav;