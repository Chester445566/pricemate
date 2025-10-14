import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useEstimate } from '../context/EstimateContext';
import { EstimateResult } from '../types';
import Spinner from '../components/Spinner';
import PriceCard from '../components/PriceCard';
import Card from '../components/Card';
import Button from '../components/Button';
import RatingScale from '../components/RatingScale';
import FeedbackRating from '../components/FeedbackRating';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formData, clearState } = useEstimate();
  
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [listing, setListing] = useState<{ title: string; description: string; hints: string[] } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No estimate ID found.");
      setIsLoading(false);
      return;
    }

    const fetchEstimate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.getEstimate(id);
        setResult(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  const handleGenerateListing = async () => {
    if (!formData || !result) return;
    setIsGenerating(true);
    setGenerationError(null);
    setListing(null);
    try {
        const generated = await apiService.generateListingDescription(formData, result.prices.recommended);
        setListing(generated);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate listing.';
        setGenerationError(errorMessage);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    clearState();
    navigate('/');
  };
  
  const renderAdjustment = (key: string, value: number) => {
    const labels: { [key: string]: string } = {
        condition: 'الحالة',
        age: 'عمر المنتج',
        seasonality: 'الموسمية',
        region: 'المنطقة',
        damage: 'الأضرار الملحوظة',
    };
    const tooltips: { [key: string]: string } = {
        condition: 'تأثير حالة المنتج على السعر.',
        age: 'تأثير عمر المنتج على السعر.',
        seasonality: 'تأثير الموسم الحالي على الطلب والسعر.',
        region: 'تأثير المنطقة الجغرافية على السعر.',
        damage: 'تأثير الأضرار الملحوظة على السعر.',
    };

    if (value === 0) return null;

    return <RatingScale key={key} label={labels[key]} value={value} tooltip={tooltips[key]} />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-16">
        <Spinner />
        <p className="mt-4 text-slate-600 dark:text-slate-400">...جاري حساب أفضل سعر لمنتجك</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center pt-16 space-y-4">
        <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</p>
        <Button onClick={() => navigate(-1)} variant="secondary">العودة</Button>
      </div>
    );
  }
  
  if (!result) {
    return <div className="text-center pt-16">لم يتم العثور على بيانات.</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-200 mb-1">السعر المقترح</h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">بناءً على تحليل السوق لمنتجك</p>
        <div className="grid grid-cols-1 gap-3">
            <PriceCard label="بيع سريع" value={result.prices.fast} />
            <PriceCard label="السعر الموصى به" value={result.prices.recommended} highlight />
            <PriceCard label="أعلى سعر متوقع" value={result.prices.max} />
        </div>
      </div>

      {result.adjustments && (
        <Card>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">عوامل التسعير</h3>
            <div className="space-y-3">
                {Object.entries(result.adjustments).map(([key, value]) => renderAdjustment(key, value as number))}
            </div>
        </Card>
      )}

      {formData && (
        <Card>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">إنشاء إعلانك</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">استخدم الذكاء الاصطناعي لكتابة وصف جذاب لإعلانك.</p>
            {!listing && (
                <Button onClick={handleGenerateListing} isLoading={isGenerating}>
                    إنشاء وصف إعلان
                </Button>
            )}
            {generationError && <p className="text-red-600 dark:text-red-400 text-sm mt-2 text-center">{generationError}</p>}
        </Card>
      )}

      {listing && (
        <Card className="border-cyan-600 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-900/50">
          <h3 className="text-base font-semibold text-cyan-800 dark:text-cyan-200 mb-2">{listing.title}</h3>
          <textarea
            readOnly
            value={listing.description}
            className="w-full h-32 p-2 text-sm bg-white/80 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          />
          <div className="mt-3">
             <h4 className="text-sm font-semibold text-cyan-800 dark:text-cyan-200 mb-2">نصائح لبيع أسرع:</h4>
             <ul className="list-disc list-inside text-sm text-cyan-700 dark:text-cyan-300 space-y-1">
                {listing.hints.map((hint, index) => <li key={index}>{hint}</li>)}
             </ul>
          </div>
        </Card>
      )}
      
      {id && <FeedbackRating estimateId={id} />}

      <div className="pt-4">
        <Button onClick={handleStartOver} variant="secondary">
            بدء تقييم جديد
        </Button>
      </div>
    </div>
  );
};

export default ResultPage;