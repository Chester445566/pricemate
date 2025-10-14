import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const titles: { [key: string]: string } = {
    '/': 'قيّم منتجك',
    '/details': 'تفاصيل المنتج',
  };

  // Match dynamic routes like /result/:id
  const getTitle = () => {
    if (location.pathname.startsWith('/result/')) {
        return 'نتيجة التسعير';
    }
    return titles[location.pathname] || 'PriceMate';
  }

  const showBackButton = location.pathname !== '/';

  return (
    <header className="py-4 relative flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
      <div className="absolute left-0">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mx-auto">{getTitle()}</h1>
      
      <div className="absolute right-0">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;