import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimate } from '../context/EstimateContext';
import { useCounter } from '../context/CounterContext';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setImageBase64 } = useEstimate();
  const { count, incrementCount } = useCounter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsReadingFile(true);
      setImagePreviewUrl(null);
      setSelectedImageBase64(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        const base64String = resultUrl.split(',')[1];
        setImagePreviewUrl(resultUrl);
        setSelectedImageBase64(base64String);
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        console.error("Error reading file.");
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handlePrimaryAction = () => {
    incrementCount();
    setImageBase64(selectedImageBase64); // This will be null if no image is selected
    navigate('/details');
  };

  return (
    <div className="flex flex-col items-center text-center pt-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">أهلاً بك في PriceMate</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">احصل على تسعيرة دقيقة لمنتجك في ثوانٍ</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 pt-1">
          {count > 0 ? `${count.toLocaleString('ar-SA')} منتجاً تم تقييمه حتى الآن` : 'كن أول من يقيّم منتجاً!'}
        </p>
      </div>

      {imagePreviewUrl && (
        <div className="w-full max-w-sm px-4">
            <img src={imagePreviewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-700" />
        </div>
      )}

      <div className="w-full max-w-sm space-y-4">
        <Button onClick={handlePrimaryAction} variant="primary" disabled={isReadingFile}>
          {imagePreviewUrl ? 'متابعة مع الصورة' : 'ابدأ التسعير'}
        </Button>
        <Button onClick={handlePickImage} variant="secondary" isLoading={isReadingFile}>
          {imagePreviewUrl ? 'تغيير الصورة' : 'اختيار صورة'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-500 pt-4">
        نحن نحترم خصوصيتك. الصور المستخدمة يتم تحليلها فقط لغرض التسعير ولا يتم تخزينها.
      </p>
    </div>
  );
};

export default HomePage;
