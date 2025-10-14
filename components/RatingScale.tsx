import React from 'react';

interface RatingScaleProps {
  label: string;
  value: number; // Expecting a value e.g., from -0.5 to 0.5
  tooltip: string;
}

const RatingScale: React.FC<RatingScaleProps> = ({ label, value, tooltip }) => {
  const barColor = value > 0 ? 'bg-green-500' : 'bg-red-500';
  const barWidth = `${Math.abs(value) * 100}%`;

  return (
    <div className="w-full" title={tooltip}>
      <div className="flex justify-between items-center mb-1 text-xs text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span className={`font-semibold ${value > 0 ? 'text-green-700 dark:text-green-400' : value < 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
        <div className="h-full w-1/2 left-1/2 absolute bg-slate-300 dark:bg-slate-600 transform -translate-x-1/2"></div>
        <div 
          className={`h-full absolute ${barColor} rounded-full`}
          style={{ 
            width: barWidth,
            left: value > 0 ? '50%' : `calc(50% - ${barWidth})`
          }}
        ></div>
        <div className="absolute h-full w-px bg-slate-400 dark:bg-slate-500 left-1/2 top-0"></div>
      </div>
    </div>
  );
};

export default RatingScale;