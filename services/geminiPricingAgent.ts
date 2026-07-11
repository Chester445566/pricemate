import { GoogleGenAI, Type } from "@google/genai";
import { EstimateFormData, EstimateResult } from "../types";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const ESTIMATE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recommended: {
      type: Type.NUMBER,
      description:
        "The recommended selling price in SAR based on current market conditions.",
    },
    fast: {
      type: Type.NUMBER,
      description:
        "A lower price for a quick sale, typically 5-10% below recommended.",
    },
    max: {
      type: Type.NUMBER,
      description:
        "The maximum realistic price a patient seller could get, typically 5-10% above recommended.",
    },
    sampleSize: {
      type: Type.NUMBER,
      description:
        "Estimated number of comparable listings you considered (approximate).",
    },
    conditionAdjustment: {
      type: Type.NUMBER,
      description:
        "Price adjustment factor for condition from -1 (heavily damaged) to 0 (no effect) to 0.1 (premium).",
    },
    ageAdjustment: {
      type: Type.NUMBER,
      description:
        "Price adjustment factor for age/depreciation, typically negative.",
    },
    seasonalityAdjustment: {
      type: Type.NUMBER,
      description:
        "Price adjustment factor for seasonal demand, can be positive or negative.",
    },
    regionAdjustment: {
      type: Type.NUMBER,
      description:
        "Price adjustment factor for the region/city, can be positive or negative.",
    },
    damageAdjustment: {
      type: Type.NUMBER,
      description:
        "Price adjustment factor for any noted damage, typically negative or zero.",
    },
  },
  required: [
    "recommended",
    "fast",
    "max",
    "sampleSize",
    "conditionAdjustment",
    "ageAdjustment",
    "seasonalityAdjustment",
    "regionAdjustment",
    "damageAdjustment",
  ],
};

const LISTING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise Arabic listing title for the item.",
    },
    description: {
      type: Type.STRING,
      description:
        "A compelling Arabic listing description including key details, condition, accessories, and price.",
    },
    hints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 actionable Arabic tips for selling this specific item faster.",
    },
  },
  required: ["title", "description", "hints"],
};

const conditionLabels: Record<string, string> = {
  New: "جديد (مع الكرتون)",
  LikeNew: "كالجديد",
  Used: "مستخدم",
  HeavyUse: "استخدام كثيف",
};

const regionLabels: Record<string, string> = {
  JED: "جدة",
  RUH: "الرياض",
  DMM: "الدمام",
};

function buildEstimatePrompt(data: EstimateFormData, imageUri: string | null): string {
  const condition = conditionLabels[data.condition] || data.condition;
  const region = regionLabels[data.region] || data.region;

  let prompt = `You are an expert pricing agent for the Saudi Arabian used-goods market (platforms like Haraj, OpenSooq, and Mstaml). Estimate the fair market price in SAR for this item:

- Category: ${data.category}
- Brand: ${data.brand}
- Model: ${data.model}
- Year of purchase: ${data.year}
- Condition: ${condition}
- Accessories: ${data.accessories || "None"}
- Region: ${region}`;

  if (imageUri) {
    prompt += "\n\nAn image of the item is also provided. Factor the visible condition into your assessment.";
  }

  prompt += `

Consider:
1. Current market prices on Saudi platforms for this exact or very similar item
2. Depreciation based on age and condition
3. Regional demand differences in Saudi Arabia
4. Seasonal factors (current month)
5. Value of included accessories

Return realistic SAR prices. The "fast" price should sell within days, "recommended" within 1-2 weeks, and "max" for a patient seller.`;

  return prompt;
}

export async function getGeminiEstimate(
  data: EstimateFormData,
  imageUri: string | null
): Promise<EstimateResult> {
  if (!ai) {
    throw new Error("API_KEY is not configured. Cannot generate estimate.");
  }

  const prompt = buildEstimatePrompt(data, imageUri);

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: prompt }];
  if (imageUri && imageUri.startsWith("data:")) {
    const [meta, base64] = imageUri.split(",");
    const mimeType = meta.split(":")[1]?.split(";")[0] || "image/jpeg";
    parts.push({ inlineData: { data: base64, mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ESTIMATE_SCHEMA,
    },
  });

  const raw = JSON.parse(response.text.trim());

  const median = raw.recommended;
  const p25 = Math.round(median * 0.93);
  const p75 = Math.round(median * 1.07);

  return {
    prices: {
      recommended: Math.round(raw.recommended),
      fast: Math.round(raw.fast),
      max: Math.round(raw.max),
    },
    stats: {
      p25,
      median,
      p75,
      sampleSize: raw.sampleSize || 20,
      outliersRemoved: Math.max(0, Math.floor((raw.sampleSize || 20) * 0.05)),
    },
    adjustments: {
      condition: raw.conditionAdjustment,
      age: raw.ageAdjustment,
      seasonality: raw.seasonalityAdjustment,
      region: raw.regionAdjustment,
      damage: raw.damageAdjustment,
    },
  };
}

export async function getGeminiListingDescription(
  item: EstimateFormData,
  price: number
): Promise<{ title: string; description: string; hints: string[] }> {
  if (!ai) {
    throw new Error("API_KEY is not configured. Cannot generate listing.");
  }

  const condition = conditionLabels[item.condition] || item.condition;
  const region = regionLabels[item.region] || item.region;

  const prompt = `You are an expert at writing compelling Arabic marketplace listings for the Saudi market. Write a listing for this item:

- Category: ${item.category}
- Brand: ${item.brand}
- Model: ${item.model}
- Year: ${item.year}
- Condition: ${condition}
- Accessories: ${item.accessories || "None"}
- Region: ${region}
- Asking price: ${price} SAR

Write the title and description in Arabic. The description should be detailed, honest, and highlight the item's best features. Include the price and location. Provide 3-5 specific, actionable tips in Arabic for selling this particular type of item faster.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: LISTING_SCHEMA,
    },
  });

  return JSON.parse(response.text.trim());
}
