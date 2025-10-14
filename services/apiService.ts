import { EstimateFormData, EstimateResult } from '../types';

// --- Development Settings ---
// Set to `true` to use mock data and bypass the need for a running local server.
// Set to `false` to connect to the real backend API at API_BASE_URL.
const MOCK_API = true;
// --------------------------

const API_BASE_URL = 'http://localhost:4000';

// Helper to simulate network delay for mock responses
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK DATA STORE ---
const mockEstimates: { [key: string]: EstimateResult } = {
    'mock-estimate-phones': {
        prices: { recommended: 2850, fast: 2650, max: 3000 },
        stats: { p25: 2600, median: 2800, p75: 2950, sampleSize: 45, outliersRemoved: 2 },
        adjustments: { condition: -0.1, age: -0.25, seasonality: 0, region: 0.05, damage: 0 }
    },
    'mock-estimate-laptops': {
        prices: { recommended: 3500, fast: 3255, max: 3745 },
        stats: { p25: 3300, median: 3550, p75: 3800, sampleSize: 28, outliersRemoved: 1 },
        adjustments: { condition: 0, age: -0.15, seasonality: -0.05, region: 0, damage: -0.05 }
    },
    'mock-estimate-furniture': {
        prices: { recommended: 450, fast: 418, max: 481 },
        stats: { p25: 400, median: 450, p75: 500, sampleSize: 15, outliersRemoved: 0 },
        adjustments: { condition: -0.1, age: -0.08, seasonality: 0, region: 0, damage: 0 }
    },
    'mock-estimate-tablets': {
        prices: { recommended: 1450, fast: 1348, max: 1551 },
        stats: { p25: 1300, median: 1450, p75: 1600, sampleSize: 33, outliersRemoved: 2 },
        adjustments: { condition: -0.05, age: -0.20, seasonality: 0, region: 0.05, damage: 0 }
    },
    'mock-estimate-gaming_consoles': {
        prices: { recommended: 1100, fast: 1023, max: 1177 },
        stats: { p25: 1000, median: 1150, p75: 1250, sampleSize: 52, outliersRemoved: 4 },
        adjustments: { condition: 0, age: -0.3, seasonality: 0.1, region: 0, damage: -0.05 }
    },
    'mock-estimate-cameras': {
        prices: { recommended: 2150, fast: 2000, max: 2300 },
        stats: { p25: 2000, median: 2100, p75: 2250, sampleSize: 21, outliersRemoved: 1 },
        adjustments: { condition: -0.15, age: -0.1, seasonality: 0, region: -0.05, damage: -0.1 }
    },
    'mock-estimate-default': {
        prices: { recommended: 970, fast: 902, max: 1038 },
        stats: { p25: 920, median: 965, p75: 990, sampleSize: 10, outliersRemoved: 0 },
        adjustments: { condition: 0, age: -0.2, seasonality: 0, region: 0, damage: -0.07 }
    }
};

// --- Centralized Error Handling Logic ---

/**
 * Handles network-level errors (e.g., "Failed to fetch") by throwing a user-friendly message.
 */
const handleFetchError = (error: unknown, context: string): never => {
    console.error(`Fetch Error in ${context}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const message = `فشل الاتصال بالخادم على ${API_BASE_URL}.\nيرجى التأكد من أن الخادم المحلي يعمل وأنك متصل بالشبكة.`;
        throw new Error(message);
    }
    throw new Error('حدث خطأ غير متوقع في الشبكة. يرجى المحاولة مرة أخرى.');
};

/**
 * Handles API error responses (e.g., 4xx, 5xx) by parsing a JSON body for a specific message.
 */
const handleResponseError = async (response: Response, context: string): Promise<never> => {
    let errorMessage = `حدث خطأ في الخادم (الحالة: ${response.status})`;
    try {
        const errorData = await response.json();
        if (errorData && (errorData.message || errorData.error)) {
            errorMessage = errorData.message || errorData.error;
        }
    } catch (e) {
        console.error(`Could not parse JSON from error response in ${context}.`);
    }

    console.error(`API Error in ${context}:`, response.status, errorMessage);

    if (response.status === 404) {
        throw new Error('المورد المطلوب غير موجود.');
    }

    throw new Error(errorMessage);
};

/**
 * A centralized fetch wrapper that includes robust error handling for all API calls.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, context: string): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            // This will throw and be caught by the outer catch block
            await handleResponseError(response, context);
        }
        return response.json() as Promise<T>;
    } catch (error) {
        // Re-throw errors from handleResponseError or handle fetch errors
        if (error instanceof Error) {
            throw error;
        }
        handleFetchError(error, context);
    }
}

// --- API Service Methods ---

interface CreateEstimatePayload extends EstimateFormData {
  imageUri: string | null;
}
interface CreateEstimateResponse {
  id: string;
}

export const apiService = {
  createEstimate: async (payload: CreateEstimatePayload): Promise<CreateEstimateResponse> => {
    if (MOCK_API) {
      console.log("--- MOCK API: createEstimate ---", payload);
      await delay(500);
      const mockId = `mock-estimate-${payload.category || 'default'}`;
      return { id: mockId };
    }

    return apiFetch<CreateEstimateResponse>('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, 'createEstimate');
  },

  getEstimate: async (id: string): Promise<EstimateResult> => {
    if (MOCK_API) {
        console.log("--- MOCK API: getEstimate ---", { id });
        await delay(800);
        return mockEstimates[id] || mockEstimates['mock-estimate-default'];
    }

    return apiFetch<EstimateResult>(`/api/estimates/${id}`, {}, 'getEstimate');
  },

  generateListingDescription: async (item: EstimateFormData, price: number): Promise<{title: string; description: string; hints: string[]}> => {
    if (MOCK_API) {
        console.log("--- MOCK API: generateListingDescription ---", { item, price });
        await delay(400);
        
        const title = `${item.brand} ${item.model} ${item.year} حالة ${item.condition}`;
        let description = `${title}\nملحقات: ${item.accessories || 'لا يوجد'}`;
        
        const hints = [
            'التقاط صور في إضاءة جيدة ومن زوايا متعددة',
            'كن صادقاً بشأن أي عيوب أو خدوش',
            'استخدم تسعير البيع السريع لسرعة الإغلاق'
        ];
        
        switch (item.category) {
            case 'phones':
                description += '\nصحة البطارية: ممتازة';
                hints.unshift('اذكر نسبة صحة البطارية إن أمكن');
                break;
            case 'laptops':
                description += '\nالمواصفات: Core i7, 16GB RAM, 512GB SSD';
                hints.unshift('اذكر مواصفات الجهاز (RAM, سعة التخزين)');
                break;
            case 'tablets':
                description += '\nمساحة التخزين: 128GB, واي فاي فقط';
                hints.unshift('وضح إذا كان الجهاز يدعم شريحة اتصال أم واي فاي فقط');
                break;
            case 'gaming_consoles':
                description += '\nيأتي مع يد تحكم واحدة وأسطوانة لعبة FIFA 23';
                hints.unshift('اذكر الألعاب أو الملحقات الإضافية المرفقة');
                break;
            case 'cameras':
                description += '\nمع عدسة 18-55mm الأصلية';
                hints.unshift('اذكر نوع العدسة المرفقة وعدد الشاتر إن أمكن');
                break;
        }

        description += `\nالموقع: ${item.region}\nالسعر: ${price} ريال`;

        return { 
            title, 
            description, 
            hints
        };
    }
    
    return apiFetch<{title: string; description: string; hints: string[]}>('/api/listings/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, price }),
    }, 'generateListingDescription');
  }
};