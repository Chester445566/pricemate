import React, { useState, useEffect } from 'react';
import Card from './Card';

interface FeedbackRatingProps {
  estimateId: string;
}

const STORAGE_PREFIX = 'priceMateRating_';

const FeedbackRating: React.FC<FeedbackRatingProps> = ({ estimateId }) => {
  const storageKey = `${STORAGE_PREFIX}${estimateId}`;
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedRating = window.localStorage.getItem(storageKey);
        if (storedRating) {
          setSavedRating(parseInt(storedRating, 10));
        }
      }
    } catch (e) {
      console.error("Failed to read rating from localStorage", e);
    }
  }, [storageKey]);

  const handleRate = (rating: number) => {
    try {
      window.localStorage.setItem(storageKey, rating.toString());
      setSavedRating(rating);
    } catch (e) {
      console.error("Failed to save rating to localStorage", e);
    }
  };

  const currentRating = hoverRating || savedRating;

  return (
    <Card>
      <div className="text-center">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
          {savedRating ? 'شكراً لتقييمك!' : 'ما مدى دقة التسعيرة؟'}
        </h3>
        {savedRating ? (
          <div className="flex justify-center items-center space-x-1" dir="ltr">
             {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-7 h-7 ${
                        savedRating >= star
                        ? 'text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              (1 = غير دقيق، 5 = دقيق جداً)
            </p>
            <div className="flex justify-center items-center space-x-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform transform hover:scale-125 focus:outline-none"
                  aria-label={`Rate ${star} out of 5`}
                >
                  <svg
                    className={`w-8 h-8 ${
                      (currentRating || 0) >= star
                        ? 'text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FeedbackRating;