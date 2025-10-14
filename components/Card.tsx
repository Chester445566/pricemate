import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-[#F7F8FA] dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-sm transition hover:shadow-lg dark:hover:border-slate-600 ${className}`}>
      {children}
    </div>
  );
};

export default Card;