import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePriceAlerts } from '../context/PriceAlertContext';
import Card from '../components/Card';
import Button from '../components/Button';

const categoryLabels: { [key: string]: string } = {
  phones: 'هاتف',
  laptops: 'لابتوب',
  tablets: 'تابلت',
  furniture: 'أثاث',
  gaming_consoles: 'ألعاب',
  cameras: 'كاميرا',
};

const AlertsPage: React.FC = () => {
  const { alerts, removeAlert, clearAlerts } = usePriceAlerts();
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 space-y-4 text-center">
        <div className="text-5xl">🔔</div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">لا توجد تنبيهات</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          يمكنك ضبط تنبيه سعر عند الحصول على تقدير لمنتجك.
        </p>
        <Button onClick={() => navigate('/')} variant="secondary">
          تقييم منتج
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">تنبيهات الأسعار</h2>
        <button
          onClick={clearAlerts}
          className="text-xs text-red-500 dark:text-red-400 hover:underline"
        >
          حذف الكل
        </button>
      </div>

      {alerts.map(alert => {
        const reached = alert.currentEstimate <= alert.targetPrice;
        return (
          <Card key={alert.id} className={reached ? 'border-green-500 dark:border-green-500' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  {reached && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                      تم الوصول ✓
                    </span>
                  )}
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {categoryLabels[alert.category] || alert.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {alert.productName}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>
                    التقدير الحالي:{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {alert.currentEstimate.toLocaleString()} ريال
                    </span>
                  </p>
                  <p>
                    السعر المستهدف:{' '}
                    <span className={`font-medium ${reached ? 'text-green-600 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                      {alert.targetPrice.toLocaleString()} ريال
                    </span>
                  </p>
                  <p className="text-slate-400 dark:text-slate-500">
                    {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                aria-label="حذف التنبيه"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        );
      })}

      <Button onClick={() => navigate('/')} variant="secondary">
        تقييم منتج جديد
      </Button>
    </div>
  );
};

export default AlertsPage;
