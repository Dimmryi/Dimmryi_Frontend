import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import {
    fetchAdminPromotionRequests,
    updatePromotionRequest,
    type AdminPromotionRequest,
    type PromotionRequestStatus,
} from '../services/PromotionRequestService';

type StatusFilter = PromotionRequestStatus | 'all';

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'new', label: 'Нові' },
    { value: 'inProgress', label: 'В роботі' },
    { value: 'completed', label: 'Завершені' },
    { value: 'rejected', label: 'Відхилені' },
    { value: 'all', label: 'Усі' },
];

const statusLabels: Record<PromotionRequestStatus, string> = {
    new: 'Нова заявка',
    inProgress: 'В роботі',
    completed: 'Завершено',
    rejected: 'Відхилено',
};

const requestTypeLabels = {
    'existing-listing-promotion': 'Просування оголошення',
    'new-property-shoot': 'Професійна зйомка нового об’єкта',
};

const statusTone: Record<PromotionRequestStatus, 'pending' | 'approved' | 'rejected'> = {
    new: 'pending',
    inProgress: 'pending',
    completed: 'approved',
    rejected: 'rejected',
};

const formatDate = (value?: string | null) => {
    if (!value) return 'Дата не вказана';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatPrice = (request: AdminPromotionRequest) => {
    const price = request.listing?.price;
    if (!price) return 'Ціну не вказано';
    const currency = request.listing?.currency === 'USD' ? '$' : '₴';
    return `${currency}${price}`;
};

const getRequestTitle = (request: AdminPromotionRequest) => {
    if (request.requestType === 'new-property-shoot') return 'Новий об’єкт для зйомки';
    const number = request.listingNumber || request.listing?.listingNumber;
    return number ? `Оголошення №${number}` : request.listingId || 'Оголошення без номера';
};

const AdminPromotionRequests = () => {
    const role = useAppSelector((state) => state.registration.role);
    const isAdmin = role === 'admin';
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('new');
    const [requests, setRequests] = useState<AdminPromotionRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<Record<string, number | undefined>>({});
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const visibleRequestsCount = useMemo(() => requests.length, [requests]);

    const loadRequests = useCallback(async () => {
        if (!isAdmin) return;

        setIsLoading(true);
        setError('');

        try {
            const data = await fetchAdminPromotionRequests(statusFilter);
            setRequests(data.items);
            setTotal(data.total);
            setCounts(data.counts);
            setAdminNotes(
                data.items.reduce<Record<string, string>>((acc, request) => {
                    acc[request._id] = request.adminNote || '';
                    return acc;
                }, {}),
            );
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Не вдалося завантажити заявки на просування.');
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, statusFilter]);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

    const handleUpdate = async (requestId: string, status: PromotionRequestStatus) => {
        setActiveRequestId(requestId);
        setMessage('');
        setError('');

        try {
            await updatePromotionRequest(requestId, {
                status,
                adminNote: adminNotes[requestId] || '',
            });
            await loadRequests();
            setMessage('Статус заявки оновлено.');
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : 'Не вдалося оновити заявку.');
        } finally {
            setActiveRequestId('');
        }
    };

    if (!isAdmin) {
        return (
            <main className="dm-admin-verifications-page">
                <section className="dm-admin-verifications-page__gate">
                    <span>Адмін-доступ</span>
                    <h1>Заявки на просування доступні лише адміністратору</h1>
                    <p>Увійдіть під обліковим записом адміністратора, щоб переглядати заявки та змінювати їх статус.</p>
                    <Link to="/login" className="dm-btn dm-btn--accent">Увійти</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="dm-admin-verifications-page">
            <section className="dm-admin-verifications-page__hero">
                <div>
                    <span>Адміністрування</span>
                    <h1>Заявки на просування</h1>
                    <p>
                        Переглядайте заявки на професійну зйомку або просування існуючих оголошень.
                        Загальна кількість заявок зберігається окремо від поточного фільтра.
                    </p>
                </div>
                <strong>{total}</strong>
            </section>

            <section className="dm-admin-verifications-page__toolbar" aria-label="Фільтр заявок на просування">
                {statusFilters.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        className={statusFilter === filter.value ? 'is-active' : ''}
                        onClick={() => setStatusFilter(filter.value)}
                    >
                        {filter.label}
                        {filter.value !== 'all' ? ` (${counts[filter.value] || 0})` : ''}
                    </button>
                ))}
            </section>

            {message && <p className="dm-admin-verifications-page__notice">{message}</p>}
            {error && <p className="dm-admin-verifications-page__error">{error}</p>}
            {isLoading && <p className="dm-admin-verifications-page__empty">Завантажуємо заявки...</p>}

            {!isLoading && requests.length === 0 && (
                <section className="dm-admin-verifications-page__empty">
                    <h2>Заявок немає</h2>
                    <p>Коли користувач Standard або Premium відправить заявку на просування, вона з’явиться тут.</p>
                </section>
            )}

            <section className="dm-admin-verifications-page__grid">
                {requests.map((request) => (
                    <article className="dm-admin-verification-card" key={request._id}>
                        <header>
                            <div>
                                <span className={`dm-admin-verification-card__status is-${statusTone[request.status]}`}>
                                    {statusLabels[request.status]}
                                </span>
                                <h2>{getRequestTitle(request)}</h2>
                                <p>{request.listing?.location || 'Адреса ще не прив’язана до оголошення'}</p>
                            </div>
                            {request.listingId ? <Link to={`/details/${request.listingId}`}>Відкрити оголошення</Link> : null}
                        </header>

                        <div className="dm-admin-verification-card__meta">
                            <span>{requestTypeLabels[request.requestType]}</span>
                            <span>{request.subscribeType || 'План не вказано'}</span>
                            <span>{formatPrice(request)}</span>
                            <span>{formatDate(request.createdAt)}</span>
                            <span>Показано: {visibleRequestsCount}</span>
                        </div>

                        <div className="dm-admin-verification-card__person">
                            <strong>{request.name || 'Користувач без імені'}</strong>
                            <span>{request.email || request.userId}</span>
                        </div>

                        <footer>
                            <textarea
                                value={adminNotes[request._id] || ''}
                                onChange={(event) =>
                                    setAdminNotes((current) => ({
                                        ...current,
                                        [request._id]: event.target.value,
                                    }))
                                }
                                placeholder="Внутрішня нотатка адміністратора"
                            />
                            <div>
                                <button
                                    type="button"
                                    onClick={() => handleUpdate(request._id, 'inProgress')}
                                    disabled={activeRequestId === request._id}
                                >
                                    В роботу
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdate(request._id, 'completed')}
                                    disabled={activeRequestId === request._id}
                                >
                                    Завершено
                                </button>
                                <button
                                    type="button"
                                    className="is-danger"
                                    onClick={() => handleUpdate(request._id, 'rejected')}
                                    disabled={activeRequestId === request._id}
                                >
                                    Відхилити
                                </button>
                            </div>
                            {request.reviewedAt ? (
                                <div className="dm-admin-verification-card__reviewed">
                                    <span>Останнє оновлення: {formatDate(request.reviewedAt)}</span>
                                </div>
                            ) : null}
                        </footer>
                    </article>
                ))}
            </section>
        </main>
    );
};

export default AdminPromotionRequests;
