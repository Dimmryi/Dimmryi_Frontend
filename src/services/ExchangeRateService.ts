const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UsdUahRate {
    baseCurrency: 'USD';
    targetCurrency: 'UAH';
    rate: number;
    source: 'NBU';
    sourceUrl: string;
    fetchedAt: string;
    cached?: boolean;
    stale?: boolean;
}

export const fetchUsdUahRate = async () => {
    const response = await fetch(`${API_URL}/api/exchange-rates/usd-uah`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || `Exchange rate request failed: ${response.status}`);
    }

    return data as UsdUahRate;
};
