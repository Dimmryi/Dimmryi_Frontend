import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { PlaceholderImage } from '../components/PlaceholderImage';
import type { Listing } from '../components/ListingCard';
import DetailsMap from '../components/DetailsMap';
import { useLanguage } from '../LanguageProvider';
import { fetchListings } from '../services/ListingService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FAVORITES_STORAGE_KEY = 'favoriteListings';

interface DetailsListing extends Listing {
    owner?: string;
    ownerId?: string;
    title?: string;
}

const readFavoriteIds = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
        return [];
    }
};

const getListingTitle = (listing?: DetailsListing | null) =>
    listing?.title || listing?.apartmentDetails?.slice(0, 72) || listing?.description?.slice(0, 72) || "Об'єкт нерухомості";

const getGallery = (listing?: DetailsListing | null) =>
    listing?.image?.filter((item): item is string => Boolean(item)) ?? [];

const formatPrice = (price: number | string) => {
    const numeric = Number(String(price).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric.toLocaleString('uk-UA') : String(price);
};

const formatDate = (value?: number | string) => {
    if (!value) return 'Не вказано';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return new Date(numeric).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

const getPropertyLabel = (listing?: DetailsListing | null) => {
    if (!listing) return 'Нерухомість';
    if (listing.propertyType === 'flat') return 'Квартира';
    if (listing.propertyType === 'private house') return 'Приватний будинок';
    if (listing.propertyType === 'commercial real estate') return 'Комерційна нерухомість';
    return 'Нерухомість';
};

const getTransactionLabel = (listing?: DetailsListing | null) => (listing?.listingType === 'rent' ? 'Оренда' : 'Продаж');

const Details = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();
    const { translate } = useLanguage();
    const [listing, setListing] = useState<DetailsListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoriteIds());

    useEffect(() => {
        let cancelled = false;

        const loadListing = async () => {
            if (!listingId) {
                setError("Не вдалося визначити ID оголошення.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/listing/${listingId}`);
                if (!response.ok) throw new Error(`Listing request failed: ${response.status}`);
                const data = (await response.json()) as DetailsListing;
                if (!cancelled) setListing(data);
            } catch {
                try {
                    const allListings = (await fetchListings()) as DetailsListing[];
                    const fallback = allListings.find((item) => item._id === listingId) || null;
                    if (!cancelled) {
                        setListing(fallback);
                        if (!fallback) setError("Оголошення не знайдено.");
                    }
                } catch {
                    if (!cancelled) setError("Не вдалося завантажити деталі оголошення.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadListing();

        return () => {
            cancelled = true;
        };
    }, [listingId]);

    useEffect(() => {
        setActiveImage(0);
    }, [listing?._id]);

    const gallery = useMemo(() => getGallery(listing), [listing]);
    const currentImage = gallery[activeImage] || gallery[0] || '';
    const isFavorite = listing?._id ? favoriteIds.includes(listing._id) : false;

    const toggleFavorite = () => {
        if (!listing?._id) return;
        setFavoriteIds((current) => {
            const next = current.includes(listing._id)
                ? current.filter((id) => id !== listing._id)
                : [...current, listing._id];
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    if (loading) {
        return (
            <main className="dm-page dm-details-page">
                <section className="dm-details-shell dm-details-shell--loading">
                    <div className="dm-details-skeleton dm-details-skeleton--hero" />
                    <div className="dm-details-skeleton-grid">
                        <div className="dm-details-skeleton dm-details-skeleton--card" />
                        <div className="dm-details-skeleton dm-details-skeleton--card" />
                    </div>
                </section>
            </main>
        );
    }

    if (error || !listing) {
        return (
            <main className="dm-page dm-details-page">
                <section className="dm-details-shell dm-details-empty">
                    <p>{error || 'Оголошення не знайдено.'}</p>
                    <Link className="dm-btn dm-btn--accent" to="/listings">
                        До всіх оголошень
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="dm-page dm-details-page">
            <section className="dm-details-shell">
                <div className="dm-details-topbar">
                    <button className="dm-btn dm-btn--ghost dm-btn--sm" type="button" onClick={() => navigate(-1)}>
                        <span className="dm-details-backmark">←</span> Назад
                    </button>
                    <div className="dm-details-topbar__actions">
                        <button
                            className={'dm-btn dm-btn--ghost dm-btn--sm ' + (isFavorite ? 'is-active' : '')}
                            type="button"
                            onClick={toggleFavorite}
                        >
                            {Icons.heart()} {isFavorite ? 'Збережено' : 'Зберегти'}
                        </button>
                        <Link className="dm-btn dm-btn--accent dm-btn--sm" to="/listings">
                            Усі оголошення
                        </Link>
                    </div>
                </div>

                <div className="dm-details-main">
                    <div className="dm-details-primary">
                        <div className="dm-details-gallery">
                            <div className="dm-details-gallery__hero">
                                {currentImage ? (
                                    <img src={currentImage} alt={getListingTitle(listing)} />
                                ) : (
                                    <PlaceholderImage label={listing.propertyType || 'property'} tone="warm" />
                                )}
                                <div className="dm-details-gallery__badges">
                                    <span className="dm-details-badge dm-details-badge--accent">{getTransactionLabel(listing)}</span>
                                    <span className="dm-details-badge">{getPropertyLabel(listing)}</span>
                                    {listing.typeOfNovelty === 'newBuilding' ? (
                                        <span className="dm-details-badge">Новобудова</span>
                                    ) : null}
                                </div>
                            </div>
                            {gallery.length > 1 ? (
                                <div className="dm-details-gallery__thumbs">
                                    {gallery.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            className={'dm-details-thumb ' + (index === activeImage ? 'is-active' : '')}
                                            onClick={() => setActiveImage(index)}
                                        >
                                            <img src={image} alt={`${getListingTitle(listing)} ${index + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="dm-details-section">
                            <div className="dm-details-heading">
                                <div>
                                    <div className="dm-eyebrow">Деталі об'єкта</div>
                                    <h1 className="dm-h2">{getListingTitle(listing)}</h1>
                                </div>
                                <div className="dm-details-price">
                                    ₴{formatPrice(listing.price)}
                                    {listing.listingType === 'rent' ? <span>{translate('mapSection.properties.perMonth')}</span> : null}
                                </div>
                            </div>
                            <div className="dm-details-location">
                                {Icons.pin()} {listing.location}
                            </div>
                            <div className="dm-details-specs">
                                {listing.numbersOfRooms ? (
                                    <span>
                                        {Icons.bed()} {listing.numbersOfRooms} кімн.
                                    </span>
                                ) : null}
                                {listing.totalArea ? (
                                    <span>
                                        {Icons.area()} {listing.totalArea} м²
                                    </span>
                                ) : null}
                                {listing.numberOfFloor ? (
                                    <span>
                                        {Icons.bath()} {listing.numberOfFloor}
                                        {listing.numberOfStoreysOfBuilding ? ` / ${listing.numberOfStoreysOfBuilding} поверх` : ' поверх'}
                                    </span>
                                ) : null}
                                {listing.listingNumber ? <span>№ {listing.listingNumber}</span> : null}
                            </div>
                        </div>

                        <div className="dm-details-grid">
                            <section className="dm-details-section">
                                <h2 className="dm-details-section__title">Планування та особливості</h2>
                                <p className="dm-details-copy">
                                    {listing.apartmentDetails || "Для цього об'єкта деталі планування ще не заповнені."}
                                </p>
                            </section>

                            <section className="dm-details-section">
                                <h2 className="dm-details-section__title">Опис об'єкта</h2>
                                <p className="dm-details-copy">
                                    {listing.description || "Опис об'єкта поки недоступний, але основні характеристики вже збережені."}
                                </p>
                            </section>
                        </div>
                    </div>

                    <aside className="dm-details-sidebar">
                        <section className="dm-details-section">
                            <h2 className="dm-details-section__title">Контакт та публікація</h2>
                            <dl className="dm-details-meta">
                                <div>
                                    <dt>Тип угоди</dt>
                                    <dd>{getTransactionLabel(listing)}</dd>
                                </div>
                                <div>
                                    <dt>Тип нерухомості</dt>
                                    <dd>{getPropertyLabel(listing)}</dd>
                                </div>
                                <div>
                                    <dt>Контакт</dt>
                                    <dd>{listing.contact || 'Не вказано'}</dd>
                                </div>
                                <div>
                                    <dt>Власник</dt>
                                    <dd>{listing.owner || 'Не вказано'}</dd>
                                </div>
                                <div>
                                    <dt>Опубліковано</dt>
                                    <dd>{formatDate(listing.date)}</dd>
                                </div>
                                <div>
                                    <dt>Адреса</dt>
                                    <dd>{listing.location}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="dm-details-section">
                            <h2 className="dm-details-section__title">Розташування на мапі</h2>
                            <DetailsMap location={listing.location} title={getListingTitle(listing)} />
                        </section>
                    </aside>
                </div>
            </section>
        </main>
    );
};

export default Details;
