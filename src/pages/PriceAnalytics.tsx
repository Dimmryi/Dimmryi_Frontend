import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    fetchPriceAnalytics,
    type AnalyticsListingType,
    type AnalyticsMarketType,
    type AnalyticsPropertyType,
    type PriceAnalyticsSnapshot,
} from '../services/PriceAnalyticsService';
import { useCurrency } from '../CurrencyProvider';

const listingTypeOptions: Array<{ value: AnalyticsListingType; label: string }> = [
    { value: 'sale', label: 'Продаж' },
    { value: 'rent', label: 'Оренда' },
];

const propertyTypeOptions: Array<{ value: AnalyticsPropertyType; label: string }> = [
    { value: 'flat', label: 'Квартира' },
    { value: 'private house', label: 'Приватний будинок' },
    { value: 'commercial real estate', label: 'Комерційна нерухомість' },
];

const marketTypeOptions: Array<{ value: AnalyticsMarketType; label: string }> = [
    { value: 'all', label: 'Увесь ринок' },
    { value: 'primary', label: 'Первинний' },
    { value: 'secondary', label: 'Вторинний' },
];

const confidenceLabels = {
    high: 'Висока довіра',
    medium: 'Середня довіра',
    low: 'Низька довіра',
};

const formatMonth = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return value;
    return new Intl.DateTimeFormat('uk-UA', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
};

const PriceChart = ({ snapshots }: { snapshots: PriceAnalyticsSnapshot[] }) => {
    const { displayCurrency, convertPrice, formatPrice } = useCurrency();
    const points = snapshots
        .filter((snapshot) => snapshot.pricePerSquareMeter > 0)
        .map((snapshot) => ({
            snapshot,
            pricePerSquareMeter: convertPrice(snapshot.pricePerSquareMeter, snapshot.currency),
        }));
    if (points.length < 2) {
        return (
            <div className="dm-price-chart is-empty">
                <p>Для графіка потрібно щонайменше два місячні значення.</p>
            </div>
        );
    }

    const values = points.map((point) => point.pricePerSquareMeter);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const width = 760;
    const height = 300;
    const padding = {
        top: 36,
        right: 28,
        bottom: 58,
        left: 86,
    };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const chartBottom = height - padding.bottom;

    const coords = points.map((point, index) => {
        const x = padding.left + (index / Math.max(points.length - 1, 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.pricePerSquareMeter - min) / range) * chartHeight;
        return { x, y, point };
    });
    const line = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');

    return (
        <div className="dm-price-chart">
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Графік цін за останні 12 місяців">
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartBottom} />
                <line x1={padding.left} y1={chartBottom} x2={width - padding.right} y2={chartBottom} />
                <text x={padding.left - 10} y={padding.top + 4} textAnchor="end">{formatPrice(max, displayCurrency)}</text>
                <text x={padding.left - 10} y={chartBottom + 4} textAnchor="end">{formatPrice(min, displayCurrency)}</text>
                <polyline points={line} />
                {coords.map((coord) => (
                    <g key={coord.point.snapshot._id}>
                        <circle cx={coord.x} cy={coord.y} r="5" />
                        <title>
                            {formatMonth(coord.point.snapshot.periodMonth)}: {formatPrice(coord.point.snapshot.pricePerSquareMeter, coord.point.snapshot.currency)} / м²
                        </title>
                    </g>
                ))}
                {coords.map((coord, index) => (
                    <text key={`${coord.point.snapshot._id}-label`} x={coord.x} y={chartBottom + 34} textAnchor={index === 0 ? 'start' : index === coords.length - 1 ? 'end' : 'middle'}>
                        {formatMonth(coord.point.snapshot.periodMonth)}
                    </text>
                ))}
            </svg>
        </div>
    );
};

const PriceAnalytics = () => {
    const [filters, setFilters] = useState({
        region: 'Харківська область',
        city: 'Харків',
        listingType: 'sale' as AnalyticsListingType,
        propertyType: 'flat' as AnalyticsPropertyType,
        marketType: 'all' as AnalyticsMarketType,
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [snapshots, setSnapshots] = useState<PriceAnalyticsSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { convertPrice, formatPrice } = useCurrency();

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setError('');

        fetchPriceAnalytics({ ...appliedFilters, limit: 12 })
            .then((data) => {
                if (isMounted) setSnapshots(data.snapshots || []);
            })
            .catch((caughtError) => {
                if (isMounted) setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося завантажити аналітику.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [appliedFilters]);

    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    const change = useMemo(() => {
        if (!latest || !previous || !previous.pricePerSquareMeter) return null;
        const latestValue = convertPrice(latest.pricePerSquareMeter, latest.currency);
        const previousValue = convertPrice(previous.pricePerSquareMeter, previous.currency);
        return ((latestValue - previousValue) / previousValue) * 100;
    }, [convertPrice, latest, previous]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setAppliedFilters(filters);
    };

    return (
        <main className="dm-price-analytics-page">
            <section className="dm-price-analytics-hero">
                <div>
                    <span>Аналітика цін</span>
                    <h1>Ринковий орієнтир за відкритими джерелами</h1>
                    <p>
                        Дані оновлюються раз на місяць і показують динаміку за останній рік. Це не оцінка конкретного об’єкта,
                        а орієнтир для розуміння ринку.
                    </p>
                </div>
                <Link to="/real-estate-estimator" className="dm-btn dm-btn--accent">AI-оцінка об’єкта</Link>
            </section>

            <form className="dm-price-analytics-filters" onSubmit={handleSubmit}>
                <label>
                    <span>Регіон</span>
                    <input value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} />
                </label>
                <label>
                    <span>Місто</span>
                    <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} />
                </label>
                <label>
                    <span>Тип угоди</span>
                    <select value={filters.listingType} onChange={(event) => setFilters((current) => ({ ...current, listingType: event.target.value as AnalyticsListingType }))}>
                        {listingTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <label>
                    <span>Тип нерухомості</span>
                    <select value={filters.propertyType} onChange={(event) => setFilters((current) => ({ ...current, propertyType: event.target.value as AnalyticsPropertyType }))}>
                        {propertyTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <label>
                    <span>Ринок</span>
                    <select value={filters.marketType} onChange={(event) => setFilters((current) => ({ ...current, marketType: event.target.value as AnalyticsMarketType }))}>
                        {marketTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <button className="dm-btn dm-btn--accent" type="submit">Показати</button>
            </form>

            {error ? <p className="dm-price-analytics-status is-error">{error}</p> : null}
            {isLoading ? <p className="dm-price-analytics-status">Завантажуємо дані...</p> : null}

            {!isLoading && snapshots.length === 0 ? (
                <section className="dm-price-analytics-empty">
                    <h2>Ще немає даних для аналітики</h2>
                    <p>Адміністратор може додати місячні дані з відкритих джерел на сторінці керування аналітикою.</p>
                </section>
            ) : null}

            {latest ? (
                <>
                    <section className="dm-price-analytics-cards">
                        <article>
                            <span>Ціна за м²</span>
                            <strong>{formatPrice(latest.pricePerSquareMeter, latest.currency)}</strong>
                            <p>{change === null ? 'Недостатньо даних для зміни' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% до попереднього місяця`}</p>
                        </article>
                        <article>
                            <span>Медіанна ціна</span>
                            <strong>{formatPrice(latest.medianPrice, latest.currency)}</strong>
                            <p>{latest.sampleSize ? `${latest.sampleSize} спостережень` : 'Обсяг вибірки не вказано'}</p>
                        </article>
                        <article>
                            <span>Джерело</span>
                            <strong>{latest.source}</strong>
                            <p>{confidenceLabels[latest.confidence]}</p>
                        </article>
                    </section>

                    <section className="dm-price-analytics-panel">
                        <div className="dm-price-analytics-panel__head">
                            <div>
                                <span>Останні 12 місяців</span>
                                <h2>Динаміка ціни за м²</h2>
                            </div>
                            {latest.sourceUrl ? <a href={latest.sourceUrl} target="_blank" rel="noreferrer">Відкрити джерело</a> : null}
                        </div>
                        <PriceChart snapshots={snapshots} />
                    </section>
                </>
            ) : null}
        </main>
    );
};

export default PriceAnalytics;
