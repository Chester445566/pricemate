import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { usePriceAlerts } from '../context/PriceAlertContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts } = usePriceAlerts();

  const titles: { [key: string]: string } = {
    '/': 'قيّم منتجك',
    '/details': 'تفاصيل المنتج',
    '/alerts': 'تنبيهات الأسعار',
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
      
      <div className="absolute right-0 flex items-center gap-1">
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full"
          aria-label="تنبيهات الأسعار"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-cyan-500" />
          )}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;