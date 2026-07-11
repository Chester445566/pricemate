import React, { useState } from 'react';
import Button from './Button';

interface PriceAlertModalProps {
  productName: string;
  category: string;
  currentEstimate: number;
  onConfirm: (targetPrice: number) => void;
  onClose: () => void;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  productName,
  category,
  currentEstimate,
  onConfirm,
  onClose,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>(String(currentEstimate));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(targetPrice);
    if (!targetPrice || isNaN(price) || price <= 0) {
      setError('الرجاء إدخال سعر صحيح أكبر من صفر');
      return;
    }
    onConfirm(price);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="alert-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
          ضبط تنبيه سعر
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          سيتم حفظ تنبيه لـ <span className="font-semibold">{productName}</span>. عندما تراجع التقدير مستقبلاً، سنوضح إذا وصل السعر إلى هدفك.
        </p>

        <div className="text-sm text-slate-500 dark:text-slate-400">
          السعر الحالي الموصى به: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{currentEstimate.toLocaleString()} ريال</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              السعر المستهدف (ريال)
            </label>
            <input
              type="number"
              min={1}
              value={targetPrice}
              onChange={e => { setTargetPrice(e.target.value); setError(null); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="أدخل السعر المستهدف"
              dir="ltr"
            />
            {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">حفظ التنبيه</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceAlertModal;
