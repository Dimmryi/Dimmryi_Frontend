import { FormEvent, useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import {
    deletePriceAnalyticsSnapshot,
    fetchAdminPriceAnalytics,
    savePriceAnalyticsSnapshot,
    type AnalyticsConfidence,
    type AnalyticsCurrency,
    type AnalyticsListingType,
    type AnalyticsMarketType,
    type AnalyticsPropertyType,
    type PriceAnalyticsPayload,
    type PriceAnalyticsSnapshot,
} from '../services/PriceAnalyticsService';

const initialForm: PriceAnalyticsPayload = {
    region: 'Харківська область',
    city: 'Харків',
    listingType: 'sale',
    propertyType: 'flat',
    marketType: 'all',
    periodMonth: new Date().toISOString().slice(0, 7),
    averagePrice: 0,
    medianPrice: 0,
    pricePerSquareMeter: 0,
    sampleSize: 0,
    currency: 'USD',
    source: '',
    sourceUrl: '',
    confidence: 'medium',
    note: '',
};

const AdminPriceAnalytics = () => {
    const role = useAppSelector((state) => state.registration.role);
    const isAdmin = role === 'admin';
    const [form, setForm] = useState<PriceAnalyticsPayload>(initialForm);
    const [snapshots, setSnapshots] = useState<PriceAnalyticsSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadSnapshots = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchAdminPriceAnalytics();
            setSnapshots(data);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося завантажити таблицю цін.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadSnapshots();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const updateForm = <Key extends keyof PriceAnalyticsPayload>(field: Key, value: PriceAnalyticsPayload[Key]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            await savePriceAnalyticsSnapshot(form);
            setMessage('Місячні дані збережено.');
            await loadSnapshots();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося зберегти дані.');
        }
    };

    const handleDelete = async (snapshotId: string) => {
        const confirmed = window.confirm('Видалити цей рядок аналітики?');
        if (!confirmed) return;

        setMessage('');
        setError('');
        try {
            await deletePriceAnalyticsSnapshot(snapshotId);
            setMessage('Рядок видалено.');
            await loadSnapshots();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося видалити рядок.');
        }
    };

    if (!isAdmin) {
        return (
            <main className="dm-admin-price-page">
                <section className="dm-admin-price-page__gate">
                    <span>Адмін-доступ</span>
                    <h1>Аналітика цін доступна лише адміністратору</h1>
                    <p>Увійдіть під admin-акаунтом, щоб додавати місячні дані з відкритих джерел.</p>
                </section>
            </main>
        );
    }

    return (
        <main className="dm-admin-price-page">
            <section className="dm-admin-price-page__hero">
                <div>
                    <span>Адміністрування</span>
                    <h1>Місячні дані цін</h1>
                    <p>Додавайте один snapshot на місяць для регіону, сегмента ринку і джерела. Якщо такий рядок вже існує, він буде оновлений.</p>
                </div>
            </section>

            <form className="dm-admin-price-form" onSubmit={handleSubmit}>
                <label><span>Регіон</span><input value={form.region} onChange={(event) => updateForm('region', event.target.value)} /></label>
                <label><span>Місто</span><input value={form.city || ''} onChange={(event) => updateForm('city', event.target.value)} /></label>
                <label>
                    <span>Тип угоди</span>
                    <select value={form.listingType} onChange={(event) => updateForm('listingType', event.target.value as AnalyticsListingType)}>
                        <option value="sale">Продаж</option>
                        <option value="rent">Оренда</option>
                    </select>
                </label>
                <label>
                    <span>Тип нерухомості</span>
                    <select value={form.propertyType} onChange={(event) => updateForm('propertyType', event.target.value as AnalyticsPropertyType)}>
                        <option value="flat">Квартира</option>
                        <option value="private house">Приватний будинок</option>
                        <option value="commercial real estate">Комерційна</option>
                    </select>
                </label>
                <label>
                    <span>Ринок</span>
                    <select value={form.marketType} onChange={(event) => updateForm('marketType', event.target.value as AnalyticsMarketType)}>
                        <option value="all">Увесь</option>
                        <option value="primary">Первинний</option>
                        <option value="secondary">Вторинний</option>
                    </select>
                </label>
                <label><span>Місяць</span><input type="month" value={form.periodMonth} onChange={(event) => updateForm('periodMonth', event.target.value)} /></label>
                <label><span>Середня ціна</span><input type="number" value={form.averagePrice} onChange={(event) => updateForm('averagePrice', Number(event.target.value))} /></label>
                <label><span>Медіанна ціна</span><input type="number" value={form.medianPrice} onChange={(event) => updateForm('medianPrice', Number(event.target.value))} /></label>
                <label><span>Ціна за м²</span><input type="number" required value={form.pricePerSquareMeter} onChange={(event) => updateForm('pricePerSquareMeter', Number(event.target.value))} /></label>
                <label><span>Кількість спостережень</span><input type="number" value={form.sampleSize} onChange={(event) => updateForm('sampleSize', Number(event.target.value))} /></label>
                <label>
                    <span>Валюта</span>
                    <select value={form.currency} onChange={(event) => updateForm('currency', event.target.value as AnalyticsCurrency)}>
                        <option value="USD">USD</option>
                        <option value="UAH">UAH</option>
                        <option value="EUR">EUR</option>
                    </select>
                </label>
                <label><span>Джерело</span><input required value={form.source} onChange={(event) => updateForm('source', event.target.value)} /></label>
                <label><span>URL джерела</span><input value={form.sourceUrl || ''} onChange={(event) => updateForm('sourceUrl', event.target.value)} /></label>
                <label>
                    <span>Довіра</span>
                    <select value={form.confidence} onChange={(event) => updateForm('confidence', event.target.value as AnalyticsConfidence)}>
                        <option value="high">Висока</option>
                        <option value="medium">Середня</option>
                        <option value="low">Низька</option>
                    </select>
                </label>
                <label className="is-wide"><span>Нотатка</span><textarea value={form.note || ''} onChange={(event) => updateForm('note', event.target.value)} /></label>
                <button className="dm-btn dm-btn--accent" type="submit">Зберегти місячні дані</button>
            </form>

            {message ? <p className="dm-admin-price-page__notice">{message}</p> : null}
            {error ? <p className="dm-admin-price-page__error">{error}</p> : null}

            <section className="dm-admin-price-table">
                <div className="dm-admin-price-table__head">
                    <h2>Таблиця snapshot-ів</h2>
                    <span>{isLoading ? 'Завантаження...' : `${snapshots.length} рядків`}</span>
                </div>
                <div className="dm-admin-price-table__scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Місяць</th>
                                <th>Регіон</th>
                                <th>Сегмент</th>
                                <th>Ціна м²</th>
                                <th>Медіана</th>
                                <th>Джерело</th>
                                <th>Довіра</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {snapshots.map((snapshot) => (
                                <tr key={snapshot._id}>
                                    <td>{snapshot.periodMonth}</td>
                                    <td>{snapshot.region}{snapshot.city ? `, ${snapshot.city}` : ''}</td>
                                    <td>{snapshot.listingType} · {snapshot.propertyType} · {snapshot.marketType}</td>
                                    <td>{snapshot.pricePerSquareMeter} {snapshot.currency}</td>
                                    <td>{snapshot.medianPrice || '-'}</td>
                                    <td>{snapshot.sourceUrl ? <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer">{snapshot.source}</a> : snapshot.source}</td>
                                    <td>{snapshot.confidence}</td>
                                    <td><button type="button" onClick={() => handleDelete(snapshot._id)}>Видалити</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};

export default AdminPriceAnalytics;
