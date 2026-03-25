import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../common/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice"; // Assuming your logout action is here
import { useTheme } from "../../context/ThemeContext";
import { Moon, Sun, Bell, User, LogOut } from "lucide-react";

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 transition-colors duration-200 z-10">
      <div className="flex-1">
        {(location.pathname === '/clients' || location.pathname === '/orders') && <Navbar />}
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
          <Bell size={20} />
        </button>

        {/* Profile Dropdown Wrapper */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 ml-2 border border-blue-200 dark:border-blue-800 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <User size={20} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in py-1">
              <Link
                to="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <User size={16} />
                My Profile
              </Link>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
