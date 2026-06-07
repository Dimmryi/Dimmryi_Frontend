import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { fetchUsdUahRate } from './services/ExchangeRateService';

export type Currency = 'UAH' | 'USD';

interface CurrencyContextValue {
    displayCurrency: Currency;
    usdToUahRate: number;
    rateSource: string;
    rateFetchedAt: string;
    isRateLoading: boolean;
    toggleCurrency: () => void;
    setDisplayCurrency: (currency: Currency) => void;
    formatPrice: (price: number | string, sourceCurrency?: Currency | string | null, options?: { compact?: boolean }) => string;
    convertPrice: (price: number | string, sourceCurrency?: Currency | string | null) => number;
}

const FALLBACK_USD_TO_UAH = 40;
const STORAGE_KEY = 'displayCurrency';
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const normalizeCurrency = (value?: Currency | string | null): Currency => (value === 'USD' ? 'USD' : 'UAH');

const parsePrice = (value: number | string) => {
    const numeric = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatNumber = (value: number, compact = false) => {
    if (compact && Math.abs(value) >= 1000) {
        return `${Math.round(value / 1000).toLocaleString('uk-UA')}k`;
    }

    return Math.round(value).toLocaleString('uk-UA');
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [displayCurrency, setDisplayCurrencyState] = useState<Currency>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'USD' ? 'USD' : 'UAH';
    });
    const [usdToUahRate, setUsdToUahRate] = useState(FALLBACK_USD_TO_UAH);
    const [rateSource, setRateSource] = useState('NBU');
    const [rateFetchedAt, setRateFetchedAt] = useState('');
    const [isRateLoading, setIsRateLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsRateLoading(true);

        fetchUsdUahRate()
            .then((rate) => {
                if (!isMounted) return;
                if (Number.isFinite(rate.rate) && rate.rate > 0) {
                    setUsdToUahRate(rate.rate);
                }
                setRateSource(rate.source);
                setRateFetchedAt(rate.fetchedAt);
            })
            .catch(() => {
                if (isMounted) setRateSource('NBU fallback');
            })
            .finally(() => {
                if (isMounted) setIsRateLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const setDisplayCurrency = (currency: Currency) => {
        setDisplayCurrencyState(currency);
        localStorage.setItem(STORAGE_KEY, currency);
    };

    const value = useMemo<CurrencyContextValue>(() => {
        const convertPrice = (price: number | string, sourceCurrency?: Currency | string | null) => {
            const numeric = parsePrice(price);
            const normalizedSource = normalizeCurrency(sourceCurrency);

            if (normalizedSource === displayCurrency) return numeric;
            if (normalizedSource === 'USD' && displayCurrency === 'UAH') return numeric * usdToUahRate;
            if (normalizedSource === 'UAH' && displayCurrency === 'USD') return numeric / usdToUahRate;
            return numeric;
        };

        const formatPrice = (price: number | string, sourceCurrency?: Currency | string | null, options?: { compact?: boolean }) => {
            const converted = convertPrice(price, sourceCurrency);
            const symbol = displayCurrency === 'UAH' ? '₴' : '$';
            return `${symbol}${formatNumber(converted, options?.compact)}`;
        };

        return {
            displayCurrency,
            usdToUahRate,
            rateSource,
            rateFetchedAt,
            isRateLoading,
            setDisplayCurrency,
            toggleCurrency: () => setDisplayCurrency(displayCurrency === 'UAH' ? 'USD' : 'UAH'),
            convertPrice,
            formatPrice,
        };
    }, [displayCurrency, isRateLoading, rateFetchedAt, rateSource, usdToUahRate]);

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used inside CurrencyProvider');
    }
    return context;
};
