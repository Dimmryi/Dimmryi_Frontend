import { useEffect, useMemo, useState } from 'react';
import ListingCard, { type Listing } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import { useFavorites } from '../hooks/useFavorites';
import { useAppSelector } from '../app/hooks';
import { fetchFavoriteListings } from '../services/FavoritesService';
import { fetchListings } from '../services/ListingService';
import { useLanguage } from '../LanguageProvider';

const Favorites = () => {
    const { language } = useLanguage();
    const { favoriteIds } = useFavorites();
    const isRegistered = useAppSelector((state) => state.registration.isRegistered);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadFavorites = async () => {
            setLoading(true);
            setError('');

            try {
                const data = isRegistered ? await fetchFavoriteListings() : await fetchListings();
                if (cancelled) return;
                setListings(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setError(language === 'en' ? 'Failed to load saved listings.' : 'Не вдалося завантажити збережені оголошення.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadFavorites();

        return () => {
            cancelled = true;
        };
    }, [favoriteIds, isRegistered, language]);

    const visibleListings = useMemo(
        () => (isRegistered ? listings : listings.filter((listing) => favoriteIds.includes(listing._id))),
        [favoriteIds, isRegistered, listings],
    );

    const title = language === 'en' ? 'Saved Listings' : 'Обране';
    const subtitle =
        language === 'en'
            ? 'Listings you saved for a closer look.'
            : 'Оголошення, які ви зберегли для детальнішого перегляду.';

    return (
        <main className="dm-favorites-page">
            <section className="dm-section">
                <div className="dm-section__head">
                    <div>
                        <div className="dm-eyebrow">{language === 'en' ? 'Account' : 'Кабінет'}</div>
                        <h1 className="dm-h2">{title}</h1>
                        <p className="dm-favorites-lede">{subtitle}</p>
                    </div>
                    {!loading && !error ? (
                        <div className="dm-listings-summary">
                            <strong>{visibleListings.length}</strong>
                            <span>{language === 'en' ? 'saved' : 'збережено'}</span>
                        </div>
                    ) : null}
                </div>

                {loading ? <div className="dm-listings-status">{language === 'en' ? 'Loading...' : 'Завантаження...'}</div> : null}
                {error ? <div className="dm-listings-status is-error">{error}</div> : null}
                {!loading && !error && visibleListings.length === 0 ? (
                    <div className="dm-favorites-empty">
                        <span>{Icons.heart()}</span>
                        <h2>{language === 'en' ? 'No saved listings yet' : 'Поки немає збережених оголошень'}</h2>
                        <p>
                            {language === 'en'
                                ? 'Use the heart button on listings, map cards, or details pages to save interesting options.'
                                : 'Натискайте серце на картках, мапі або сторінці Details, щоб зберегти цікаві варіанти.'}
                        </p>
                    </div>
                ) : null}
                {!loading && !error && visibleListings.length > 0 ? (
                    <ul className="dm-listings-grid">
                        {visibleListings.map((listing) => (
                            <ListingCard key={listing._id} listing={listing} />
                        ))}
                    </ul>
                ) : null}
            </section>
        </main>
    );
};

export default Favorites;
