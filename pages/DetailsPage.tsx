import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimate } from '../context/EstimateContext';
import { EstimateFormData } from '../types';
import { apiService } from '../services/apiService';
import { analyzeImageWithGemini } from '../services/geminiService';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import SearchableSelect from '../components/SearchableSelect';

const categoryOptions = [
    { value: 'phones', label: 'جوالات' },
    { value: 'laptops', label: 'لابتوبات' },
    { value: 'appliances_small', label: 'أجهزة صغيرة' },
    { value: 'furniture', label: 'أثاث' },
    { value: 'tablets', label: 'أجهزة لوحية' },
    { value: 'gaming_consoles', label: 'منصات ألعاب' },
    { value: 'cameras', label: 'كاميرات' },
];

const DetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { imageBase64, setFormData: setContextFormData } = useEstimate();
  
  const [showFormFields, setShowFormFields] = useState(!imageBase64); // Hide form initially if there's an image
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EstimateFormData>({
    category: 'phones',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    condition: 'LikeNew',
    accessories: '',
    region: 'JED'
  });

  useEffect(() => {
    const analyze = async () => {
      if (imageBase64) {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
          // Assuming JPEG for simplicity, this could be improved
          const result = await analyzeImageWithGemini(imageBase64, 'image/jpeg');
          setFormData(prev => ({
            ...prev,
            brand: result.detectedBrand || '',
            model: result.detectedModel || '',
            accessories: prev.accessories || result.description || '',
          }));
        } catch (e) {
          console.error("Image analysis failed:", e);
          setAnalysisError('فشل تحليل الصورة. لا بأس، يمكنك إكمال البيانات يدوياً.');
        } finally {
          setIsAnalyzing(false); // Analysis is finished, allow the 'Continue' button to show
        }
      }
    };
    analyze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      setContextFormData(formData); // Save form data to context before API call
      const payload = {
        ...formData,
        imageUri: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null
      };
      const result = await apiService.createEstimate(payload);
      navigate(`/result/${result.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setSubmitError(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* --- Image Preview & Analysis Section --- */}
      {imageBase64 && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={`data:image/jpeg;base64,${imageBase64}`}
              alt="Product preview"
              className={`w-full h-48 object-cover rounded-xl border-2 ${analysisError ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'} ${isAnalyzing ? 'opacity-50' : ''}`}
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-xl">
                <Spinner />
                <p className="text-white mt-2 text-sm">...جاري تحليل الصورة</p>
              </div>
            )}
          </div>
          {analysisError && !showFormFields && <p className="text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg text-sm text-center">{analysisError}</p>}
        </div>
      )}
      
      {/* --- Continue Button --- */}
      {!showFormFields && imageBase64 && !isAnalyzing && (
        <div className="pt-4">
            <Button onClick={() => setShowFormFields(true)}>
                متابعة
            </Button>
        </div>
      )}

      {/* --- Main Form --- */}
      {showFormFields && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {analysisError && <p className="text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg text-sm text-center">{analysisError}</p>}

          <SearchableSelect
            label="الفئة"
            id="category"
            options={categoryOptions}
            value={formData.category}
            onChange={handleCategoryChange}
            placeholder="ابحث عن فئة..."
          />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="الماركة" id="brand" name="brand" value={formData.brand} onChange={handleChange} required placeholder="مثال: أبل" />
            <InputField label="الموديل" id="model" name="model" value={formData.model} onChange={handleChange} required placeholder="مثال: آيفون 14 برو" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="سنة الشراء" id="year" name="year" type="number" value={formData.year} onChange={handleChange} required placeholder="مثال: 2023" />
            <InputField
                label="الحالة"
                id="condition"
                name="condition"
                as="select"
                value={formData.condition}
                onChange={handleChange}
                required
            >
                <option value="New">جديد</option>
                <option value="LikeNew">كالجديد</option>
                <option value="Used">مستخدم</option>
                <option value="HeavyUse">استخدام كثيف</option>
            </InputField>
          </div>

          <InputField label="الملحقات (اختياري)" id="accessories" name="accessories" value={formData.accessories} onChange={handleChange} placeholder="مثال: الشاحن الأصلي، العلبة" helpText="اذكر جميع الملحقات المرفقة لتقدير أدق." />

          <InputField
            label="المنطقة"
            id="region"
            name="region"
            as="select"
            value={formData.region}
            onChange={handleChange}
            required
          >
            <option value="JED">جدة</option>
            <option value="RUH">الرياض</option>
            <option value="DMM">الدمام</option>
          </InputField>

          {submitError && <p className="text-red-600 dark:text-red-400 text-sm text-center whitespace-pre-line">{submitError}</p>}

          <div className="pt-4">
            <Button type="submit" isLoading={isSubmitting} disabled={isAnalyzing}>
              احسب السعر
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DetailsPage;