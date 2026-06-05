import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useIsAdmin } from '../app/hooks';
import type { Listing } from './ListingCard';
import { Icons } from './Icons';
import { PlaceholderImage } from './PlaceholderImage';
import {
    createVerificationRequest,
    uploadVerificationFile,
    type VerificationDocumentType,
    type VerificationRequestType,
} from '../services/VerificationService';

interface MyListing extends Listing {
    owner?: string;
    ownerId?: string;
    verificationStatus?: VerificationStatus;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || '';

type VerificationStatus = 'notVerified' | 'pending' | 'documentsVerified' | 'representativeVerified' | 'rejected';

interface VerificationFormState {
    requestType: VerificationRequestType;
    documentType: VerificationDocumentType;
    comment: string;
    files: File[];
}

const initialVerificationForm: VerificationFormState = {
    requestType: 'owner',
    documentType: 'technicalPassport',
    comment: '',
    files: [],
};

const typeLabel = (value?: string) => {
    const map: Record<string, string> = {
        rent: 'Оренда',
        sale: 'Продаж',
        flat: 'Квартира',
        'private house': 'Приватний будинок',
        'commercial real estate': 'Комерційна',
        newBuilding: 'Новобудова',
        secondaryHousing: 'Вторинне житло',
    };

    return value ? map[value] || value : 'Нерухомість';
};

const formatDate = (value?: number | string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'Без дати';

    return new Date(numeric).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatPrice = (value: number | string) => {
    const numeric = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric.toLocaleString('uk-UA') : String(value);
};

const verificationStatusLabel = (value?: VerificationStatus) => {
    const labels: Record<VerificationStatus, string> = {
        notVerified: 'Не перевірено',
        pending: 'Очікує перевірки',
        documentsVerified: 'Документи перевірені',
        representativeVerified: 'Представник перевірений',
        rejected: 'Відхилено',
    };

    return labels[value || 'notVerified'];
};

const verificationStatusClass = (value?: VerificationStatus) => `is-${value || 'notVerified'}`;

const requestTypeOptions: Array<{ value: VerificationRequestType; label: string }> = [
    { value: 'owner', label: 'Я власник' },
    { value: 'representative', label: 'Я представник' },
];

const documentTypeOptions: Array<{ value: VerificationDocumentType; label: string }> = [
    { value: 'technicalPassport', label: 'Технічний паспорт' },
    { value: 'ownershipExtract', label: 'Витяг / право власності' },
    { value: 'representativeDocument', label: 'Документ представника' },
];

const getCloudinaryPublicId = (url: string) => {
    const marker = '/upload/';
    const uploadIndex = url.indexOf(marker);
    if (uploadIndex === -1) return '';

    const afterUpload = url.slice(uploadIndex + marker.length).split('?')[0];
    const withoutTransforms = afterUpload.replace(/^(?:[^/]+\/)*v\d+\//, '');
    return withoutTransforms.replace(/\.[^/.]+$/, '');
};

const deleteCloudinaryAsset = async (url: string, resourceType: 'image' | 'video') => {
    if (!CLOUD_NAME) return;

    const publicId = getCloudinaryPublicId(url);
    if (!publicId) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePath = resourceType === 'video' ? 'generate-signature-to-delete-video' : 'generate-signature';
    const signatureResponse = await fetch(`${API_URL}/${signaturePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId, timestamp }),
    });
    const signature = await signatureResponse.json().catch(() => null);

    if (!signatureResponse.ok || !signature) return;

    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            public_id: publicId,
            api_key: signature.api_key,
            timestamp: signature.timestamp,
            signature: signature.signature,
        }),
    });
};

const MyListings = () => {
    const userId = useAppSelector((state) => state.registration.userId);
    const userName = useAppSelector((state) => state.registration.userName);
    const isAdmin = useIsAdmin();

    const [listings, setListings] = useState<MyListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [activeVerificationListingId, setActiveVerificationListingId] = useState('');
    const [verificationForm, setVerificationForm] = useState<VerificationFormState>(initialVerificationForm);
    const [verificationSubmittingId, setVerificationSubmittingId] = useState('');

    const heading = isAdmin ? 'Усі оголошення' : userName ? `${userName}, ваші оголошення` : 'Мої оголошення';

    const stats = useMemo(() => {
        const rent = listings.filter((listing) => listing.listingType === 'rent').length;
        const sale = listings.filter((listing) => listing.listingType === 'sale').length;
        const withVideo = listings.filter((listing) => listing.video?.some(Boolean) || listing.videoUrl).length;

        return { rent, sale, withVideo };
    }, [listings]);

    const loadListings = useCallback(async () => {
        setError('');
        setMessage('');

        if (!isAdmin && !userId) {
            setListings([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const url = isAdmin
                ? `${API_URL}/listings`
                : `${API_URL}/api/listings/ownerId/${encodeURIComponent(userId)}`;
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) throw new Error(`Listings request failed: ${response.status}`);

            const data = await response.json();
            setListings(Array.isArray(data) ? data.filter((item) => item?._id) : []);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося завантажити оголошення.');
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, userId]);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const handleDelete = async (listing: MyListing) => {
        const confirmed = window.confirm('Видалити це оголошення? Фото і відео також будуть прибрані з Cloudinary, якщо доступні.');
        if (!confirmed) return;

        setError('');
        setMessage('');

        const images = listing.image?.filter((item): item is string => Boolean(item)) ?? [];
        const videos = [
            ...(listing.video?.filter((item): item is string => Boolean(item)) ?? []),
            ...(listing.videoUrl ? [listing.videoUrl] : []),
        ];

        try {
            const response = await fetch(`${API_URL}/api/listing/${listing._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

            await Promise.allSettled([
                fetch(`${API_URL}/api/comments/listingId/${listing._id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                }),
                ...images.map((url) => deleteCloudinaryAsset(url, 'image')),
                ...videos.map((url) => deleteCloudinaryAsset(url, 'video')),
            ]);

            setListings((current) => current.filter((item) => item._id !== listing._id));
            setMessage('Оголошення видалено.');
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося видалити оголошення.');
        }
    };

    const openVerificationForm = (listingId: string) => {
        setError('');
        setMessage('');
        setVerificationForm(initialVerificationForm);
        setActiveVerificationListingId((current) => (current === listingId ? '' : listingId));
    };

    const handleVerificationSubmit = async (listing: MyListing) => {
        if (!listing._id) return;
        if (!verificationForm.files.length) {
            setError('Додайте хоча б один документ для перевірки.');
            return;
        }

        setError('');
        setMessage('');
        setVerificationSubmittingId(listing._id);

        try {
            const uploadedFiles = await Promise.all(verificationForm.files.map(uploadVerificationFile));
            await createVerificationRequest(listing._id, {
                requestType: verificationForm.requestType,
                documentType: verificationForm.documentType,
                files: uploadedFiles,
                comment: verificationForm.comment,
            });

            setListings((current) =>
                current.map((item) =>
                    item._id === listing._id ? { ...item, verificationStatus: 'pending' } : item,
                ),
            );
            setActiveVerificationListingId('');
            setVerificationForm(initialVerificationForm);
            setMessage('Заявку на перевірку надіслано. Документи не будуть показані публічно.');
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося надіслати заявку на перевірку.');
        } finally {
            setVerificationSubmittingId('');
        }
    };

    return (
        <main className="dm-my-listings-page">
            <section className="dm-section dm-my-listings-head">
                <div>
                    <span className="dm-kicker">{isAdmin ? 'Admin listings' : 'Profile listings'}</span>
                    <h1>{heading}</h1>
                    <p>Керуйте власними оголошеннями, перевіряйте медіа та швидко переходьте на сторінку обʼєкта.</p>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/listings/new">
                    {Icons.plus()} Додати оголошення
                </Link>
            </section>

            <section className="dm-section dm-my-listings-section">
                <div className="dm-my-listings-stats" aria-label="Статистика оголошень">
                    <div><span>Усього</span><strong>{listings.length}</strong></div>
                    <div><span>Продаж</span><strong>{stats.sale}</strong></div>
                    <div><span>Оренда</span><strong>{stats.rent}</strong></div>
                    <div><span>З відео</span><strong>{stats.withVideo}</strong></div>
                </div>

                {error ? <p className="dm-listings-status is-error">{error}</p> : null}
                {message ? <p className="dm-listings-status is-success">{message}</p> : null}

                {isLoading ? (
                    <p className="dm-listings-status">Завантажую оголошення...</p>
                ) : listings.length === 0 ? (
                    <div className="dm-empty-state">
                        <div className="dm-empty-state__icon">{Icons.info({ width: 28, height: 28 })}</div>
                        <h2>Оголошень ще немає</h2>
                        <p>Коли ви створите перше оголошення, воно зʼявиться тут разом із кнопками керування.</p>
                        <Link className="dm-btn dm-btn--accent" to="/listings/new">Створити оголошення</Link>
                    </div>
                ) : (
                    <ul className="dm-my-listings-grid">
                        {listings.map((listing, index) => {
                            const coverImage = listing.image?.find((image): image is string => Boolean(image)) || '';
                            const isRent = listing.listingType === 'rent';
                            const hasVideo = Boolean(listing.video?.some(Boolean) || listing.videoUrl);
                            const title = listing.apartmentDetails || listing.description || typeLabel(listing.propertyType);
                            const displayNumber = listing.listingNumber ?? index + 1;
                            const verificationStatus = listing.verificationStatus || 'notVerified';
                            const canRequestVerification =
                                listing.ownerId === userId &&
                                verificationStatus !== 'pending' &&
                                verificationStatus !== 'documentsVerified' &&
                                verificationStatus !== 'representativeVerified';
                            const isVerificationFormOpen = activeVerificationListingId === listing._id;
                            const isVerificationSubmitting = verificationSubmittingId === listing._id;

                            return (
                                <li className="dm-my-listing-card" key={listing._id}>
                                    <Link className="dm-my-listing-card__media" to={`/details/${listing._id}`}>
                                        {coverImage ? <img src={coverImage} alt={title} /> : <PlaceholderImage label={listing.propertyType || 'listing'} tone="warm" />}
                                        <span className={isRent ? 'is-rent' : 'is-sale'}>{typeLabel(listing.listingType)}</span>
                                        {listing.typeOfNovelty === 'newBuilding' ? <em>Новобудова</em> : null}
                                        {hasVideo ? <b aria-label="Є відео" /> : null}
                                    </Link>

                                    <div className="dm-my-listing-card__body">
                                        <div className="dm-my-listing-card__top">
                                            <span>#{displayNumber}</span>
                                            <span>{formatDate(listing.date)}</span>
                                        </div>
                                        <h2>{title}</h2>
                                        <div className="dm-my-listing-card__price">
                                            ₴{formatPrice(listing.price)}
                                            {isRent ? <span>/ міс</span> : null}
                                        </div>
                                        <div className="dm-my-listing-card__chips">
                                            <span>{typeLabel(listing.propertyType)}</span>
                                            {listing.numbersOfRooms ? <span>{Icons.bed()} {listing.numbersOfRooms}</span> : null}
                                            {listing.totalArea ? <span>{Icons.area()} {listing.totalArea} м²</span> : null}
                                            {listing.numberOfFloor ? <span>{Icons.layers()} {listing.numberOfFloor}</span> : null}
                                        </div>
                                        <p className="dm-my-listing-card__location">
                                            {Icons.pin()} <span>{listing.location}</span>
                                        </p>
                                        {isAdmin && listing.owner ? <p className="dm-my-listing-card__owner">Власник: {listing.owner}</p> : null}
                                        <div className="dm-my-listing-verification">
                                            <span className={`dm-my-listing-verification__badge ${verificationStatusClass(verificationStatus)}`}>
                                                {verificationStatusLabel(verificationStatus)}
                                            </span>
                                            {canRequestVerification ? (
                                                <button className="dm-btn dm-btn--ghost dm-btn--sm" type="button" onClick={() => openVerificationForm(listing._id)}>
                                                    {isVerificationFormOpen ? 'Закрити перевірку' : 'Подати на перевірку'}
                                                </button>
                                            ) : null}
                                        </div>
                                        {isVerificationFormOpen ? (
                                            <div className="dm-verification-request-form">
                                                <div className="dm-verification-request-form__row">
                                                    <label>
                                                        <span>Тип перевірки</span>
                                                        <select
                                                            value={verificationForm.requestType}
                                                            onChange={(event) =>
                                                                setVerificationForm((current) => ({
                                                                    ...current,
                                                                    requestType: event.target.value as VerificationRequestType,
                                                                }))
                                                            }
                                                        >
                                                            {requestTypeOptions.map((option) => (
                                                                <option key={option.value} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label>
                                                        <span>Документ</span>
                                                        <select
                                                            value={verificationForm.documentType}
                                                            onChange={(event) =>
                                                                setVerificationForm((current) => ({
                                                                    ...current,
                                                                    documentType: event.target.value as VerificationDocumentType,
                                                                }))
                                                            }
                                                        >
                                                            {documentTypeOptions.map((option) => (
                                                                <option key={option.value} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                </div>
                                                <label>
                                                    <span>Файл документа</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        multiple
                                                        onChange={(event) =>
                                                            setVerificationForm((current) => ({
                                                                ...current,
                                                                files: Array.from(event.target.files || []),
                                                            }))
                                                        }
                                                    />
                                                </label>
                                                <label>
                                                    <span>Коментар для модератора</span>
                                                    <textarea
                                                        value={verificationForm.comment}
                                                        onChange={(event) =>
                                                            setVerificationForm((current) => ({
                                                                ...current,
                                                                comment: event.target.value,
                                                            }))
                                                        }
                                                        placeholder="Наприклад: документ підтверджує адресу та площу об’єкта."
                                                    />
                                                </label>
                                                <p>Документи зберігаються окремо від фото оголошення і не відображаються публічно.</p>
                                                <button
                                                    className="dm-btn dm-btn--accent dm-btn--sm"
                                                    type="button"
                                                    disabled={isVerificationSubmitting}
                                                    onClick={() => handleVerificationSubmit(listing)}
                                                >
                                                    {isVerificationSubmitting ? 'Надсилаємо...' : 'Надіслати заявку'}
                                                </button>
                                            </div>
                                        ) : null}
                                        <div className="dm-my-listing-card__actions">
                                            <Link className="dm-btn dm-btn--ghost dm-btn--sm" to={`/details/${listing._id}`}>Переглянути</Link>
                                            <Link className="dm-btn dm-btn--ghost dm-btn--sm" to={`/listings/edit/${listing._id}`}>Редагувати</Link>
                                            <button className="dm-btn dm-btn--danger dm-btn--sm" type="button" onClick={() => handleDelete(listing)}>Видалити</button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </main>
    );
};

export default MyListings;
