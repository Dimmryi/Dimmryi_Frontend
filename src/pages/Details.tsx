import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { PlaceholderImage } from '../components/PlaceholderImage';
import type { Listing } from '../components/ListingCard';
import DetailsMap from '../components/DetailsMap';
import { useLanguage } from '../LanguageProvider';
import { useAppSelector, useIsAdmin } from '../app/hooks';
import { fetchListings } from '../services/ListingService';
import { useFavorites } from '../hooks/useFavorites';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface DetailsListing extends Listing {
    owner?: string;
    ownerId?: string;
    title?: string;
}

interface ReviewComment {
    commentsAuthor: string;
    authorId?: string;
    comment: string;
    rating: string;
    timePublication: string;
}

type GalleryItem = {
    type: 'image' | 'video';
    url: string;
};

const getListingTitle = (listing?: DetailsListing | null) =>
    listing?.title || listing?.apartmentDetails?.slice(0, 72) || listing?.description?.slice(0, 72) || "Об'єкт нерухомості";

const getGallery = (listing?: DetailsListing | null): GalleryItem[] => {
    const images = listing?.image?.filter((item): item is string => Boolean(item)).map((url) => ({ type: 'image' as const, url })) ?? [];
    const videos = listing?.video?.filter((item): item is string => Boolean(item)).map((url) => ({ type: 'video' as const, url })) ?? [];
    const legacyVideo = listing?.videoUrl ? [{ type: 'video' as const, url: listing.videoUrl }] : [];
    const uniqueVideos = [...videos, ...legacyVideo].filter(
        (item, index, items) => items.findIndex((candidate) => candidate.url === item.url) === index,
    );

    return [...images, ...uniqueVideos];
};

const isVideoMedia = (item?: GalleryItem) => item?.type === 'video';

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

const timeAgoFromTimestamp = (timestamp: string) => {
    const published = Number(timestamp);
    if (!Number.isFinite(published)) return '';

    const diffMinutes = Math.max(0, Math.floor((Date.now() - published) / 60000));
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    const minutes = diffMinutes % 60;

    if (days) return `${days} дн. тому`;
    if (hours) return `${hours} год. тому`;
    return `${Math.max(minutes, 1)} хв. тому`;
};

const getPropertyLabel = (listing?: DetailsListing | null) => {
    if (!listing) return 'Нерухомість';
    if (listing.propertyType === 'flat') return 'Квартира';
    if (listing.propertyType === 'private house') return 'Приватний будинок';
    if (listing.propertyType === 'commercial real estate') return 'Комерційна нерухомість';
    return 'Нерухомість';
};

const getTransactionLabel = (listing?: DetailsListing | null) => (listing?.listingType === 'rent' ? 'Оренда' : 'Продаж');

const ratingStars = (rating: string) => '★★★★★'.slice(0, Math.max(0, Math.min(Number(rating) || 0, 5)));

const Details = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();
    const { translate } = useLanguage();
    const isAdmin = useIsAdmin();
    const { isFavorite: isFavoriteListing, toggleFavorite } = useFavorites();
    const { isRegistered, userName, userId } = useAppSelector((state) => state.registration);
    const [listing, setListing] = useState<DetailsListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeMedia, setActiveMedia] = useState(0);
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadListing = async () => {
            if (!listingId) {
                setError('Не вдалося визначити ID оголошення.');
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
                        if (!fallback) setError('Оголошення не знайдено.');
                    }
                } catch {
                    if (!cancelled) setError('Не вдалося завантажити деталі оголошення.');
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
        setActiveMedia(0);
    }, [listing?._id]);

    useEffect(() => {
        if (!listingId) return;
        let cancelled = false;

        fetch(`${API_URL}/api/comments/listingId/${listingId}`)
            .then((response) => (response.ok ? response.json() : []))
            .then((data) => {
                if (!cancelled) setComments(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!cancelled) setComments([]);
            });

        return () => {
            cancelled = true;
        };
    }, [listingId, reviewMessage]);

    const gallery = useMemo(() => getGallery(listing), [listing]);
    const currentMedia = gallery[activeMedia] || gallery[0] || null;
    const isFavorite = isFavoriteListing(listing?._id);
    const isOwnListing = Boolean(
        userId && listing && (listing.ownerId === userId || (!listing.ownerId && listing.owner && listing.owner === userName)),
    );
    const canOpenOwnerChat = Boolean(listingId && listing?.ownerId && !isOwnListing);
    const canAdminDeleteOwner = Boolean(isAdmin && listing && !isOwnListing && (listing.ownerId || listing.owner));

    const handleToggleFavorite = () => {
        toggleFavorite(listing?._id);
    };

    const handleSubmitReview = async (event: FormEvent) => {
        event.preventDefault();
        setReviewError('');
        setReviewMessage('');

        if (!listingId || (!comment.trim() && !rating)) return;
        if (!isRegistered) {
            setReviewError('Щоб залишити відгук, увійдіть або зареєструйтесь.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    listingId,
                    commentsAuthor: userName,
                    authorId: userId,
                    timePublication: Date.now().toString(),
                    comment: comment.trim(),
                    rating,
                }),
            });

            if (!response.ok) throw new Error(await response.text());
            const data = await response.json().catch(() => null);
            setComment('');
            setRating('');
            setReviewMessage(data?.message || 'Відгук збережено.');
        } catch (err) {
            setReviewError(err instanceof Error ? err.message : 'Не вдалося зберегти відгук.');
        }
    };

    const handleAdminDeleteOwner = async () => {
        if (!listing || isOwnListing) return;
        const targetId = listing.ownerId;
        const targetName = listing.owner;
        const targetLabel = targetName || targetId || 'цього користувача';

        if (!confirm(`Видалити користувача ${targetLabel} та пов'язані з ним дані?`)) return;

        setDeleteMessage('');

        try {
            if (targetId) {
                await fetch(`${API_URL}/listings/ownerId/${encodeURIComponent(targetId)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                await fetch(`${API_URL}/api/comments/author/${encodeURIComponent(targetId)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                await fetch(`${API_URL}/api/users/${encodeURIComponent(targetId)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            } else if (targetName) {
                await fetch(`${API_URL}/api/listings/owner/${encodeURIComponent(targetName)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                await fetch(`${API_URL}/api/users/name/${encodeURIComponent(targetName)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            }

            setDeleteMessage('Користувача видалено.');
            navigate('/listings');
        } catch (err) {
            setDeleteMessage(err instanceof Error ? err.message : 'Не вдалося видалити користувача.');
        }
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
                            onClick={handleToggleFavorite}
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
                                {currentMedia ? (
                                    isVideoMedia(currentMedia) ? (
                                        <video
                                            className="dm-details-gallery__video"
                                            src={currentMedia.url}
                                            controls
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : (
                                        <div className="dm-details-gallery__image-frame">
                                            <img
                                                className="dm-details-gallery__blur"
                                                src={currentMedia.url}
                                                alt=""
                                                aria-hidden="true"
                                            />
                                            <img
                                                className="dm-details-gallery__main-image"
                                                src={currentMedia.url}
                                                alt={getListingTitle(listing)}
                                            />
                                        </div>
                                    )
                                ) : (
                                    <PlaceholderImage label={listing.propertyType || 'property'} tone="warm" />
                                )}
                                <div className="dm-details-gallery__badges">
                                    <span className="dm-details-badge dm-details-badge--accent">{getTransactionLabel(listing)}</span>
                                    <span className="dm-details-badge">{getPropertyLabel(listing)}</span>
                                    {listing.typeOfNovelty === 'newBuilding' ? <span className="dm-details-badge">Новобудова</span> : null}
                                </div>
                            </div>
                            {gallery.length > 1 ? (
                                <div className="dm-details-gallery__thumbs">
                                    {gallery.map((item, index) => (
                                        <button
                                            key={`${item.type}-${item.url}-${index}`}
                                            type="button"
                                            className={'dm-details-thumb ' + (index === activeMedia ? 'is-active' : '')}
                                            onClick={() => setActiveMedia(index)}
                                            aria-label={
                                                isVideoMedia(item)
                                                    ? `Показати відео ${index + 1}`
                                                    : `Показати фото ${index + 1}`
                                            }
                                        >
                                            {isVideoMedia(item) ? (
                                                <>
                                                    <video src={item.url} muted playsInline preload="metadata" />
                                                    <span className="dm-details-thumb__play" aria-hidden="true" />
                                                </>
                                            ) : (
                                                <img src={item.url} alt={`${getListingTitle(listing)} ${index + 1}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="dm-details-section dm-details-hero-card">
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
                                    <span title="Кімнати">
                                        {Icons.bed()} {listing.numbersOfRooms}
                                    </span>
                                ) : null}
                                {listing.totalArea ? (
                                    <span title="Площа">
                                        {Icons.area()} {listing.totalArea} м²
                                    </span>
                                ) : null}
                                {listing.numberOfFloor ? (
                                    <span title="Поверх">
                                        {Icons.layers()} {listing.numberOfFloor}
                                        {listing.numberOfStoreysOfBuilding ? ` / ${listing.numberOfStoreysOfBuilding}` : ''}
                                    </span>
                                ) : null}
                                {listing.contact ? (
                                    <span title="Контакт">
                                        {Icons.info()} {listing.contact}
                                    </span>
                                ) : null}
                                {listing.listingNumber ? <span title="Номер оголошення">№ {listing.listingNumber}</span> : null}
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

                        <section className="dm-details-section dm-review">
                            <div className="dm-review__head">
                                <div>
                                    <h2 className="dm-details-section__title">Відгуки</h2>
                                    <p>{comments.length} коментарів</p>
                                </div>
                                <span className="dm-review__stars">{comments.length ? '★★★★★' : '☆'}</span>
                            </div>

                            {isRegistered ? (
                                <form className="dm-review-form" onSubmit={handleSubmitReview}>
                                    <div className="dm-review-form__avatar">{(userName || 'U').charAt(0).toUpperCase()}</div>
                                    <div className="dm-review-form__main">
                                        <textarea
                                            name="comment"
                                            rows={3}
                                            value={comment}
                                            onChange={(event) => setComment(event.target.value)}
                                            placeholder="Напишіть короткий відгук про це оголошення"
                                        />
                                        <div className="dm-review-form__bar">
                                            <select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Оцінка">
                                                <option value="">Оцінка</option>
                                                <option value="1">★</option>
                                                <option value="2">★★</option>
                                                <option value="3">★★★</option>
                                                <option value="4">★★★★</option>
                                                <option value="5">★★★★★</option>
                                            </select>
                                            <button className="dm-btn dm-btn--accent dm-btn--sm" type="submit">
                                                Надіслати
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="dm-review-auth">
                                    {Icons.info()}
                                    <span>Щоб залишити відгук, потрібно увійти або зареєструватись.</span>
                                    <Link to="/login">Увійти</Link>
                                </div>
                            )}

                            {reviewMessage ? <div className="dm-review-message is-success">{reviewMessage}</div> : null}
                            {reviewError ? <div className="dm-review-message is-error">{reviewError}</div> : null}

                            <div className="dm-review-list">
                                {comments.length ? (
                                    comments.map((item, index) => (
                                        <article className="dm-review-item" key={`${item.authorId || item.commentsAuthor}-${index}`}>
                                            <div className="dm-review-item__avatar">
                                                {(item.commentsAuthor || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="dm-review-item__top">
                                                    <strong>@{item.commentsAuthor || 'user'}</strong>
                                                    <span>{timeAgoFromTimestamp(item.timePublication)}</span>
                                                    {item.rating ? <em>{ratingStars(item.rating)}</em> : null}
                                                </div>
                                                {item.comment ? <p>{item.comment}</p> : null}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="dm-review-empty">Поки немає відгуків.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="dm-details-sidebar">
                        <section className="dm-details-section">
                            <h2 className="dm-details-section__title">Контакт та публікація</h2>
                            <div className="dm-details-meta dm-details-meta--icon">
                                <div>
                                    <span>{Icons.info()}</span>
                                    <strong>{getTransactionLabel(listing)}</strong>
                                    <em>Тип угоди</em>
                                </div>
                                <div>
                                    <span>{Icons.layers()}</span>
                                    <strong>{getPropertyLabel(listing)}</strong>
                                    <em>Тип нерухомості</em>
                                </div>
                                <div>
                                    <span>{Icons.loc()}</span>
                                    <strong>{listing.owner || 'Не вказано'}</strong>
                                    <em>Власник</em>
                                </div>
                                <div>
                                    <span>{Icons.pin()}</span>
                                    <strong>{formatDate(listing.date)}</strong>
                                    <em>Опубліковано</em>
                                </div>
                            </div>

                            {canOpenOwnerChat ? (
                                <Link className="dm-details-chat-cta" to={`/chat/${listingId}`}>
                                    {Icons.info()} Написати власнику
                                </Link>
                            ) : null}

                            {canAdminDeleteOwner ? (
                                <button className="dm-admin-danger" type="button" onClick={handleAdminDeleteOwner}>
                                    {Icons.close()} Видалити користувача {listing.owner ? `@${listing.owner}` : ''}
                                </button>
                            ) : null}
                            {isAdmin && isOwnListing ? (
                                <div className="dm-admin-note">Це ваше оголошення, тому видалення користувача приховано.</div>
                            ) : null}
                            {deleteMessage ? <div className="dm-review-message is-error">{deleteMessage}</div> : null}
                        </section>

                        <section className="dm-details-section">
                            <h2 className="dm-details-section__title">Розташування на мапі</h2>
                            <DetailsMap location={listing.location} />
                        </section>
                    </aside>
                </div>
            </section>
        </main>
    );
};

export default Details;
