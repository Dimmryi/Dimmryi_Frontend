const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type AnalyticsListingType = 'sale' | 'rent';
export type AnalyticsPropertyType = 'flat' | 'private house' | 'commercial real estate';
export type AnalyticsMarketType = 'primary' | 'secondary' | 'all';
export type AnalyticsCurrency = 'USD' | 'UAH' | 'EUR';
export type AnalyticsConfidence = 'high' | 'medium' | 'low';

export interface PriceAnalyticsSnapshot {
    _id: string;
    region: string;
    city?: string;
    listingType: AnalyticsListingType;
    propertyType: AnalyticsPropertyType;
    marketType: AnalyticsMarketType;
    periodMonth: string;
    averagePrice: number;
    medianPrice: number;
    pricePerSquareMeter: number;
    sampleSize: number;
    currency: AnalyticsCurrency;
    source: string;
    sourceUrl?: string;
    confidence: AnalyticsConfidence;
    note?: string;
    updatedAt?: string;
}

export type PriceAnalyticsPayload = Omit<PriceAnalyticsSnapshot, '_id' | 'updatedAt'>;

export interface PriceAnalyticsFilters {
    region?: string;
    city?: string;
    listingType?: AnalyticsListingType;
    propertyType?: AnalyticsPropertyType;
    marketType?: AnalyticsMarketType;
    limit?: number;
}

const buildSearch = (filters: PriceAnalyticsFilters) => {
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            search.set(key, String(value));
        }
    });
    const query = search.toString();
    return query ? `?${query}` : '';
};

const parseJson = async (response: Response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Request failed: ${response.status}`);
    }
    return data;
};

export const fetchPriceAnalytics = async (filters: PriceAnalyticsFilters) => {
    const response = await fetch(`${API_URL}/api/price-analytics${buildSearch(filters)}`, {
        credentials: 'include',
    });

    if (response.status === 404) {
        return { snapshots: [], updatedPeriod: 'monthly' as const };
    }

    return parseJson(response) as Promise<{ snapshots: PriceAnalyticsSnapshot[]; updatedPeriod: 'monthly' }>;
};

export const fetchAdminPriceAnalytics = async (filters: PriceAnalyticsFilters = {}) => {
    const response = await fetch(`${API_URL}/api/admin/price-analytics${buildSearch(filters)}`, {
        credentials: 'include',
    });
    return parseJson(response) as Promise<PriceAnalyticsSnapshot[]>;
};

export const savePriceAnalyticsSnapshot = async (payload: PriceAnalyticsPayload) => {
    const response = await fetch(`${API_URL}/api/admin/price-analytics`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return parseJson(response) as Promise<PriceAnalyticsSnapshot>;
};

export const deletePriceAnalyticsSnapshot = async (snapshotId: string) => {
    const response = await fetch(`${API_URL}/api/admin/price-analytics/${encodeURIComponent(snapshotId)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return parseJson(response);
};
