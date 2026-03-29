import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  leftIcon,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full relative mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <select
          className={`
            w-full px-4 py-3.5 pr-12 rounded-md border border-gray-300 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-[#38b2ac] focus:border-[#38b2ac]
            transition-all duration-200
            ${leftIcon ? 'pl-12' : ''}
            ${error ? 'border-red-400 focus:ring-red-400 ring-1 ring-red-400 bg-red-50 dark:bg-red-900/20' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;

