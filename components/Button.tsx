import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, disabled, className, ...props }) => {
  const baseClasses = "h-12 w-full flex items-center justify-center rounded-lg text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900";
  
  const variantClasses = {
    primary: "bg-[#0E7490] text-white hover:bg-[#0C5E74] focus:ring-[#0E7490]",
    secondary: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:ring-slate-400"
  };

  const disabledClasses = "disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

export default Button;