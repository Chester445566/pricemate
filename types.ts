
export interface EstimateFormData {
  category: string;
  brand: string;
  model: string;
  year: string;
  condition: string;
  accessories: string;
  region: string;
}

export interface Prices {
  recommended: number;
  fast: number;
  max: number;
}

export interface Stats {
  p25: number;
  median: number;
  p75: number;
  sampleSize: number;
  outliersRemoved: number;
}

export interface Adjustments {
    condition: number;
    age: number;
    seasonality: number;
    region: number;
    damage: number;
}

export interface EstimateResult {
  prices: Prices;
  stats: Stats;
  adjustments?: Adjustments;
}
