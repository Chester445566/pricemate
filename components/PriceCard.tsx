import React from 'react';
import Card from './Card';

interface PriceCardProps {
  label: string;
  value: number;
  highlight?: boolean;
}

const PriceCard: React.FC<PriceCardProps> = ({ label, value, highlight = false }) => {
  return (
    <Card className={highlight ? 'bg-cyan-50 dark:bg-cyan-900/50 border-cyan-600 dark:border-cyan-500' : ''}>
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${highlight ? 'text-cyan-800 dark:text-cyan-200' : 'text-slate-900 dark:text-slate-100'}`}>
          {value.toLocaleString('ar-SA')} <span className="text-xl font-semibold">ريال</span>
        </p>
      </div>
    </Card>
  );
};

export default PriceCard;