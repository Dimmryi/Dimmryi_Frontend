import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import {
    fetchAdminVerificationRequests,
    reviewVerificationRequest,
    type AdminVerificationRequest,
    type VerificationRequestStatus,
    type VerificationReviewDecision,
} from '../services/VerificationService';

type StatusFilter = VerificationRequestStatus | 'all';

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'pending', label: 'Очікують' },
    { value: 'approved', label: 'Схвалені' },
    { value: 'rejected', label: 'Відхилені' },
    { value: 'all', label: 'Усі' },
];

const requestTypeLabels = {
    owner: 'Власник',
    representative: 'Представник власника',
};

const documentTypeLabels = {
    technicalPassport: 'Технічний паспорт',
    ownershipExtract: 'Витяг про право власності',
    representativeDocument: 'Документ представника',
};

const statusLabels = {
    pending: 'Очікує перевірки',
    approved: 'Схвалено',
    rejected: 'Відхилено',
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

const listingText = (listing: Record<string, unknown> | null | undefined, key: string) => {
    const value = listing?.[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const getListingTitle = (request: AdminVerificationRequest) => {
    const listingNumber = listingText(request.listing, 'listingNumber');
    const propertyType = listingText(request.listing, 'propertyType');
    const listingType = listingText(request.listing, 'listingType');

    return [listingNumber ? `#${listingNumber}` : '', propertyType, listingType].filter(Boolean).join(' · ') || request.listingId;
};

const getListingAddress = (request: AdminVerificationRequest) => {
    return listingText(request.listing, 'location') || 'Адреса не вказана';
};

const getListingPrice = (request: AdminVerificationRequest) => {
    const price = listingText(request.listing, 'price');
    const currency = listingText(request.listing, 'currency') === 'USD' ? '$' : '₴';
    return price ? `${currency}${price}` : 'Ціну не вказано';
};

const AdminVerifications = () => {
    const role = useAppSelector((state) => state.registration.role);
    const isAdmin = role === 'admin';
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [requests, setRequests] = useState<AdminVerificationRequest[]>([]);
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const visibleRequestsCount = useMemo(() => requests.length, [requests]);

    useEffect(() => {
        if (!isAdmin) return;

        let isMounted = true;
        setIsLoading(true);
        setError('');

        fetchAdminVerificationRequests(statusFilter)
            .then((data) => {
                if (isMounted) {
                    setRequests(data);
                }
            })
            .catch((loadError) => {
                if (isMounted) {
                    setError(loadError instanceof Error ? loadError.message : 'Не вдалося завантажити заявки.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isAdmin, statusFilter]);

    const handleReview = async (requestId: string, decision: VerificationReviewDecision) => {
        setActiveRequestId(requestId);
        setMessage('');
        setError('');

        try {
            await reviewVerificationRequest(requestId, {
                decision,
                rejectionReason: decision === 'rejected' ? rejectionReasons[requestId] || '' : '',
            });
            const nextRequests = await fetchAdminVerificationRequests(statusFilter);
            setRequests(nextRequests);
            setMessage(decision === 'rejected' ? 'Заявку відхилено.' : 'Оголошення позначено як перевірене.');
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : 'Не вдалося зберегти рішення.');
        } finally {
            setActiveRequestId('');
        }
    };

    if (!isAdmin) {
        return (
            <main className="dm-admin-verifications-page">
                <section className="dm-admin-verifications-page__gate">
                    <span>Адмін-доступ</span>
                    <h1>Перевірки доступні лише адміністратору</h1>
                    <p>Увійдіть під обліковим записом адміністратора, щоб переглядати документи та змінювати статус оголошень.</p>
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
                    <h1>Перевірка власників</h1>
                    <p>
                        Переглядайте приватні документи, звіряйте їх з оголошенням і позначайте об’єкт як перевірений власником
                        або представником.
                    </p>
                </div>
                <strong>{visibleRequestsCount}</strong>
            </section>

            <section className="dm-admin-verifications-page__toolbar" aria-label="Фільтр заявок">
                {statusFilters.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        className={statusFilter === filter.value ? 'is-active' : ''}
                        onClick={() => setStatusFilter(filter.value)}
                    >
                        {filter.label}
                    </button>
                ))}
            </section>

            {message && <p className="dm-admin-verifications-page__notice">{message}</p>}
            {error && <p className="dm-admin-verifications-page__error">{error}</p>}
            {isLoading && <p className="dm-admin-verifications-page__empty">Завантажуємо заявки...</p>}

            {!isLoading && requests.length === 0 && (
                <section className="dm-admin-verifications-page__empty">
                    <h2>Заявок немає</h2>
                    <p>Коли власник або представник відправить документи на перевірку, вони з’являться тут.</p>
                </section>
            )}

            <section className="dm-admin-verifications-page__grid">
                {requests.map((request) => (
                    <article className="dm-admin-verification-card" key={request._id}>
                        <header>
                            <div>
                                <span className={`dm-admin-verification-card__status is-${request.status}`}>
                                    {statusLabels[request.status]}
                                </span>
                                <h2>{getListingTitle(request)}</h2>
                                <p>{getListingAddress(request)}</p>
                            </div>
                            <Link to={`/details/${request.listingId}`}>Відкрити оголошення</Link>
                        </header>

                        <div className="dm-admin-verification-card__meta">
                            <span>{requestTypeLabels[request.requestType]}</span>
                            <span>{documentTypeLabels[request.documentType]}</span>
                            <span>{getListingPrice(request)}</span>
                            <span>{formatDate(request.createdAt)}</span>
                        </div>

                        <div className="dm-admin-verification-card__person">
                            <strong>{request.user?.name || 'Користувач без імені'}</strong>
                            <span>{request.user?.email || request.userId}</span>
                        </div>

                        {request.comment && (
                            <p className="dm-admin-verification-card__comment">{request.comment}</p>
                        )}

                        <div className="dm-admin-verification-card__files">
                            <strong>Документи</strong>
                            {request.files.map((file, index) => (
                                <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer">
                                    {file.originalName || `Документ ${index + 1}`}
                                </a>
                            ))}
                        </div>

                        {request.status === 'pending' ? (
                            <footer>
                                <textarea
                                    value={rejectionReasons[request._id] || ''}
                                    onChange={(event) =>
                                        setRejectionReasons((current) => ({
                                            ...current,
                                            [request._id]: event.target.value,
                                        }))
                                    }
                                    placeholder="Причина відхилення, якщо документи не підходять"
                                />
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => handleReview(request._id, 'documentsVerified')}
                                        disabled={activeRequestId === request._id}
                                    >
                                        Підтвердити власника
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReview(request._id, 'representativeVerified')}
                                        disabled={activeRequestId === request._id}
                                    >
                                        Підтвердити представника
                                    </button>
                                    <button
                                        type="button"
                                        className="is-danger"
                                        onClick={() => handleReview(request._id, 'rejected')}
                                        disabled={activeRequestId === request._id}
                                    >
                                        Відхилити
                                    </button>
                                </div>
                            </footer>
                        ) : (
                            <footer className="dm-admin-verification-card__reviewed">
                                <span>Розглянуто: {formatDate(request.reviewedAt)}</span>
                                {request.rejectionReason && <span>Причина: {request.rejectionReason}</span>}
                            </footer>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
};

export default AdminVerifications;
