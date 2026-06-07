import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useIsAdmin } from '../app/hooks';
import { Icons } from './Icons';
import { PlaceholderImage } from './PlaceholderImage';
import { useCurrency } from '../CurrencyProvider';

interface Comment {
    _id: string;
    listingId: string;
    commentsAuthor: string;
    authorId: string;
    timePublication: string;
    comment: string;
    rating: string;
}

interface CommentListing {
    _id: string;
    listingNumber?: number;
    typeOfNovelty?: string;
    numbersOfRooms?: number;
    totalArea?: number;
    numberOfFloor?: number;
    numberOfStoreysOfBuilding?: number;
    apartmentDetails?: string;
    description?: string;
    price: number | string;
    currency?: string;
    image?: Array<string | null>;
    owner?: string;
    ownerId?: string;
    contact?: string;
    location: string;
    date?: string | number;
    listingType: string;
    propertyType: string;
}

const STAR_OPTIONS = ['', '1', '2', '3', '4', '5'] as const;
const STAR_LABELS = ['Оцінка', '★', '★★', '★★★', '★★★★', '★★★★★'];

const typeLabel = (value: string) => {
    const map: Record<string, string> = {
        rent: 'Оренда',
        sale: 'Продаж',
        flat: 'Квартира',
        'private house': 'Будинок',
        'commercial real estate': 'Комерція',
        newBuilding: 'Новобудова',
        secondaryHousing: 'Вторинне житло',
    };
    return map[value] || value;
};

const ratingStars = (rating: string) => '★★★★★'.slice(0, Math.max(0, Math.min(Number(rating) || 0, 5)));

const formatDate = (timestamp: string) => {
    const numeric = Number(timestamp);
    if (!Number.isFinite(numeric)) return '';
    return new Date(numeric).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const MyComments = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const userName = useAppSelector((state) => state.registration.userName);
    const userId = useAppSelector((state) => state.registration.userId);
    const isAdmin = useIsAdmin();
    const { formatPrice } = useCurrency();

    const [listings, setListings] = useState<CommentListing[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [editableComments, setEditableComments] = useState<Record<string, { comment: string; rating: string }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    const listingById = useMemo(
        () => new Map(listings.map((listing) => [listing._id, listing])),
        [listings],
    );

    const loadData = useCallback(async () => {
        setError('');
        setSaveMessage('');

        if (!isAdmin && !userId) {
            setComments([]);
            setListings([]);
            setEditableComments({});
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const commentsUrl = isAdmin
                ? `${API_URL}/comments`
                : `${API_URL}/api/comments/authorId/${encodeURIComponent(userId)}`;

            const commentsResponse = await fetch(commentsUrl, { credentials: 'include' });
            if (!commentsResponse.ok) throw new Error(`Comments request failed: ${commentsResponse.status}`);

            const fetchedComments = (await commentsResponse.json()) as Comment[];
            const safeComments = Array.isArray(fetchedComments) ? fetchedComments.filter((item) => item?._id) : [];

            setComments(safeComments);
            setEditableComments(
                safeComments.reduce<Record<string, { comment: string; rating: string }>>((acc, item) => {
                    acc[item._id] = { comment: item.comment || '', rating: item.rating || '' };
                    return acc;
                }, {}),
            );

            const listingIds = [...new Set(safeComments.map((item) => item.listingId).filter(Boolean))];
            if (!listingIds.length) {
                setListings([]);
                return;
            }

            const listingResults = await Promise.all(
                listingIds.map((id) =>
                    fetch(`${API_URL}/api/listings/${encodeURIComponent(id)}`, { credentials: 'include' })
                        .then((response) => (response.ok ? response.json() : null))
                        .catch(() => null),
                ),
            );

            setListings(
                listingResults
                    .flatMap((item) => (Array.isArray(item) ? item : item ? [item] : []))
                    .filter((item): item is CommentListing => Boolean(item?._id)),
            );
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося завантажити коментарі.');
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, isAdmin, userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCommentChange = (commentId: string, field: 'comment' | 'rating', value: string) => {
        setEditableComments((current) => ({
            ...current,
            [commentId]: { ...current[commentId], [field]: value },
        }));
    };

    const handleSubmitEdit = async (event: FormEvent, commentId: string) => {
        event.preventDefault();
        setError('');
        setSaveMessage('');

        try {
            const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...editableComments[commentId],
                    authorId: userId,
                    commentsAuthor: userName,
                }),
            });

            if (!response.ok) throw new Error(`Update failed: ${response.status}`);
            setSaveMessage('Коментар оновлено.');
            await loadData();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося оновити коментар.');
        }
    };

    const handleDelete = async (commentId: string) => {
        setError('');
        setSaveMessage('');

        try {
            const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
            setSaveMessage('Коментар видалено.');
            await loadData();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Не вдалося видалити коментар.');
        }
    };

    return (
        <main className="dm-my-comments-page">
            <section className="dm-section dm-my-notifications-head dm-my-comments-head">
                <div>
                    <span className="dm-kicker">Reviews</span>
                    <h1>{isAdmin ? 'Усі коментарі' : userName ? `${userName}, ваші коментарі` : 'Мої коментарі'}</h1>
                    <p>Редагуйте власні відгуки до оголошень або швидко переходьте на сторінку об'єкта.</p>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/listings">
                    До оголошень
                </Link>
            </section>

            <section className="dm-section dm-my-comments-section">
                {error ? <p className="dm-listings-status is-error">{error}</p> : null}
                {saveMessage ? <p className="dm-listings-status is-success">{saveMessage}</p> : null}

                {isLoading ? (
                    <p className="dm-listings-status">Завантажую коментарі...</p>
                ) : comments.length === 0 ? (
                    <div className="dm-empty-state">
                        <div className="dm-empty-state__icon">{Icons.info({ width: 28, height: 28 })}</div>
                        <h2>Коментарів ще немає</h2>
                        <p>Коли ви залишатимете відгуки до оголошень, вони з'являться тут.</p>
                        <Link className="dm-btn dm-btn--accent" to="/listings">
                            Переглянути оголошення
                        </Link>
                    </div>
                ) : (
                    <ul className="dm-my-comments-list">
                        {comments.map((comment) => {
                            const listing = listingById.get(comment.listingId);
                            const coverImage = listing?.image?.find((image): image is string => Boolean(image)) || '';
                            const editable = editableComments[comment._id] || { comment: '', rating: '' };
                            const isRent = listing?.listingType === 'rent';

                            return (
                                <li className="dm-my-comment-card" key={comment._id}>
                                    <Link className="dm-my-comment-card__media" to={`/details/${comment.listingId}`}>
                                        {coverImage && listing ? (
                                            <img src={coverImage} alt={typeLabel(listing.propertyType)} />
                                        ) : (
                                            <PlaceholderImage label={listing?.propertyType || 'comment'} tone="warm" />
                                        )}
                                        {listing ? (
                                            <span className={isRent ? 'is-rent' : 'is-sale'}>
                                                {typeLabel(listing.listingType)}
                                            </span>
                                        ) : null}
                                    </Link>

                                    <div className="dm-my-comment-card__body">
                                        <div className="dm-my-comment-card__top">
                                            <div>
                                                <strong>{listing ? typeLabel(listing.propertyType) : 'Оголошення недоступне'}</strong>
                                                <span>{formatDate(comment.timePublication)}</span>
                                            </div>
                                            {comment.rating ? <em>{ratingStars(comment.rating)}</em> : null}
                                        </div>

                                        {listing ? (
                                            <>
                                                <div className="dm-my-comment-card__price">
                                                    {formatPrice(listing.price, listing.currency)}
                                                    {isRent ? <span>/ міс</span> : null}
                                                </div>
                                                <div className="dm-my-comment-card__specs">
                                                    {listing.numbersOfRooms ? <span>{Icons.bed()} {listing.numbersOfRooms}</span> : null}
                                                    {listing.totalArea ? <span>{Icons.area()} {listing.totalArea} м²</span> : null}
                                                    {listing.numberOfFloor ? <span>{Icons.layers()} {listing.numberOfFloor}</span> : null}
                                                </div>
                                                <div className="dm-my-comment-card__location">
                                                    {Icons.pin()} <span>{listing.location}</span>
                                                </div>
                                                {isAdmin && listing.owner ? (
                                                    <div className="dm-my-comment-card__owner">Власник: {listing.owner}</div>
                                                ) : null}
                                            </>
                                        ) : null}

                                        {isAdmin ? (
                                            <div className="dm-my-comment-card__author">
                                                Автор коментаря: <span>@{comment.commentsAuthor || 'user'}</span>
                                            </div>
                                        ) : null}

                                        <form className="dm-my-comment-editor" onSubmit={(event) => handleSubmitEdit(event, comment._id)}>
                                            <textarea
                                                value={editable.comment}
                                                onChange={(event) => handleCommentChange(comment._id, 'comment', event.target.value)}
                                                placeholder="Текст коментаря"
                                                rows={3}
                                            />
                                            <div className="dm-my-comment-editor__bar">
                                                <select
                                                    value={editable.rating}
                                                    onChange={(event) => handleCommentChange(comment._id, 'rating', event.target.value)}
                                                    aria-label="Оцінка"
                                                >
                                                    {STAR_OPTIONS.map((value, index) => (
                                                        <option key={value || 'empty'} value={value}>
                                                            {STAR_LABELS[index]}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div>
                                                    <button className="dm-btn dm-btn--ghost dm-btn--sm" type="submit">
                                                        Зберегти
                                                    </button>
                                                    <button
                                                        className="dm-btn dm-btn--danger dm-btn--sm"
                                                        type="button"
                                                        onClick={() => handleDelete(comment._id)}
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
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

export default MyComments;
