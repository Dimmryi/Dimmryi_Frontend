import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from './Icons';
import { PlaceholderImage } from './PlaceholderImage';
import { useLanguage } from '../LanguageProvider';
import { useCurrency } from '../CurrencyProvider';
import { useFavorites } from '../hooks/useFavorites';
import { fetchFeaturedListings, fetchListings, type FeaturedListingSlot } from '../services/ListingService';
import type { Listing } from './ListingCard';

type FeaturedSlotKey = FeaturedListingSlot['slot'];

interface FeaturedCard {
    slot: FeaturedSlotKey;
    listing: Listing;
}

const slotOrder: FeaturedSlotKey[] = ['new', 'premium', 'rent', 'top'];

const labels = {
    uk: {
        tags: {
            new: 'Новинка',
            premium: 'Преміум',
            rent: 'Оренда',
            top: 'Топ-вибір',
        },
        property: {
            flat: 'Квартира',
            house: 'Будинок',
            commercial: 'Комерційна нерухомість',
            other: 'Нерухомість',
        },
        rooms: 'кімн',
        area: 'м²',
        floor: 'поверх',
        perMonth: '/ міс',
        saved: 'збережень',
        noListings: 'Поки немає достатньо оголошень для актуальної підбірки.',
        save: 'Зберегти оголошення',
        savedListing: 'Збережене оголошення',
        promoted: 'просування',
    },
    en: {
        tags: {
            new: 'New',
            premium: 'Premium',
            rent: 'Rent',
            top: 'Top pick',
        },
        property: {
            flat: 'Apartment',
            house: 'House',
            commercial: 'Commercial property',
            other: 'Property',
        },
        rooms: 'rooms',
        area: 'm²',
        floor: 'floor',
        perMonth: '/ mo',
        saved: 'saves',
        noListings: 'There are not enough listings for the current picks yet.',
        save: 'Save listing',
        savedListing: 'Saved listing',
        promoted: 'promotion',
    },
};

const toTimestamp = (value: unknown) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;

    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

const toNumber = (value: unknown) => {
    const numberValue = Number(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(numberValue) ? numberValue : 0;
};

const hasPublicImage = (listing: Listing) =>
    Array.isArray(listing.image) && listing.image.some((image) => typeof image === 'string' && image.trim() !== '');

const hasPublicLocation = (listing: Listing) => typeof listing.location === 'string' && listing.location.trim() !== '';

const isEligibleListing = (listing: Listing) =>
    Boolean(listing._id) && hasPublicImage(listing) && hasPublicLocation(listing) && toNumber(listing.price) > 0;

const isActivePromotion = (listing: Listing) => {
    if (listing.isPromoted) return true;
    if (listing.promotionStatus !== 'active') return false;
    if (!listing.promotionExpiresAt) return true;
    return new Date(listing.promotionExpiresAt).getTime() > Date.now();
};

const isPaidOwner = (listing: Listing) => {
    if (listing.ownerHasActivePaidSubscription) return true;
    if (listing.ownerSubscribeType !== 'Standard' && listing.ownerSubscribeType !== 'Premium') return false;
    if (!listing.ownerSubscribeExpired) return false;
    return new Date(listing.ownerSubscribeExpired).getTime() > Date.now();
};

const getFavoriteCount = (listing: Listing) => {
    const extended = listing as Listing & { favoritesCount?: number; savedCount?: number };
    return Number(listing.favoriteCount || extended.favoritesCount || extended.savedCount || 0);
};

const getQualityScore = (listing: Listing) => {
    const imageCount = Array.isArray(listing.image) ? listing.image.filter(Boolean).length : 0;
    return [
        Math.min(imageCount, 6) * 3,
        listing.description ? 3 : 0,
        listing.apartmentDetails ? 2 : 0,
        listing.totalArea ? 2 : 0,
        listing.numbersOfRooms ? 1 : 0,
        listing.typeOfNovelty === 'newBuilding' ? 1 : 0,
        isPaidOwner(listing) ? 3 : 0,
        isActivePromotion(listing) ? 8 : 0,
    ].reduce((sum, value) => sum + value, 0);
};

const sortByDateDesc = (a: Listing, b: Listing) => toTimestamp(b.date) - toTimestamp(a.date);

const sortByPaidQuality = (a: Listing, b: Listing) => {
    const paidWeight = (listing: Listing) => listing.ownerSubscribeType === 'Premium' ? 2 : listing.ownerSubscribeType === 'Standard' ? 1 : 0;
    return paidWeight(b) - paidWeight(a) || getQualityScore(b) - getQualityScore(a) || sortByDateDesc(a, b);
};

const sortByPromotion = (a: Listing, b: Listing) => (
    Number(isActivePromotion(b)) - Number(isActivePromotion(a)) ||
    toNumber(b.promotionPriority) - toNumber(a.promotionPriority) ||
    getQualityScore(b) - getQualityScore(a) ||
    sortByDateDesc(a, b)
);

const sortByFavorites = (a: Listing, b: Listing) => (
    getFavoriteCount(b) - getFavoriteCount(a) ||
    getQualityScore(b) - getQualityScore(a) ||
    sortByDateDesc(a, b)
);

const pickListing = (candidates: Listing[], usedIds: Set<string>) => {
    const listing = candidates.find((candidate) => !usedIds.has(candidate._id));
    if (listing) usedIds.add(listing._id);
    return listing || null;
};

const buildFeaturedFallback = (listings: Listing[]): FeaturedCard[] => {
    const eligible = listings.filter(isEligibleListing);
    const usedIds = new Set<string>();
    const paid = eligible.filter(isPaidOwner);
    const promoted = eligible.filter(isActivePromotion);
    const rent = eligible.filter((listing) => listing.listingType === 'rent');
    const withFavorites = eligible.filter((listing) => getFavoriteCount(listing) > 0);

    const newest = pickListing([...paid].sort(sortByDateDesc).concat([...eligible].sort(sortByDateDesc)), usedIds);
    const premium = pickListing(
        [...promoted].sort(sortByPromotion)
            .concat([...paid].sort(sortByPaidQuality))
            .concat([...eligible].sort(sortByPaidQuality)),
        usedIds,
    );
    const rentPick = pickListing(
        [...rent.filter(isPaidOwner)].sort(sortByDateDesc).concat([...rent].sort(sortByDateDesc)),
        usedIds,
    );
    const top = pickListing([...withFavorites].sort(sortByFavorites).concat([...eligible].sort(sortByFavorites)), usedIds);

    return [
        newest ? { slot: 'new', listing: newest } : null,
        premium ? { slot: 'premium', listing: premium } : null,
        rentPick ? { slot: 'rent', listing: rentPick } : null,
        top ? { slot: 'top', listing: top } : null,
    ].filter((item): item is FeaturedCard => Boolean(item));
};

const getPropertyLabel = (listing: Listing, language: 'uk' | 'en') => {
    const t = labels[language].property;
    if (listing.propertyType === 'flat') return t.flat;
    if (listing.propertyType === 'private house') return t.house;
    if (listing.propertyType === 'commercial real estate') return t.commercial;
    return t.other;
};

const getSpec = (listing: Listing, slot: FeaturedSlotKey, language: 'uk' | 'en') => {
    const t = labels[language];
    const parts = [getPropertyLabel(listing, language)];

    if (listing.numbersOfRooms) parts.push(`${listing.numbersOfRooms} ${t.rooms}`);
    if (listing.totalArea) parts.push(`${listing.totalArea} ${t.area}`);
    if (listing.numberOfFloor) parts.push(`${listing.numberOfFloor} ${t.floor}`);
    if (slot === 'top' && getFavoriteCount(listing) > 0) parts.push(`${getFavoriteCount(listing)} ${t.saved}`);
    if (slot === 'premium' && isActivePromotion(listing)) parts.push(t.promoted);

    return parts.join(' · ');
};

export const Featured = () => {
    const { language, translate } = useLanguage();
    const { formatPrice } = useCurrency();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [cards, setCards] = useState<FeaturedCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentLanguage = language === 'en' ? 'en' : 'uk';
    const t = labels[currentLanguage];

    useEffect(() => {
        let alive = true;

        const loadFeatured = async () => {
            setIsLoading(true);

            try {
                const featured = await fetchFeaturedListings();
                if (alive) {
                    setCards(featured.map((item) => ({ slot: item.slot, listing: item.listing })));
                }
            } catch {
                try {
                    const listings = await fetchListings();
                    if (alive) setCards(buildFeaturedFallback(Array.isArray(listings) ? listings : []));
                } catch {
                    if (alive) setCards([]);
                }
            } finally {
                if (alive) setIsLoading(false);
            }
        };

        loadFeatured();

        return () => {
            alive = false;
        };
    }, []);

    const orderedCards = useMemo(
        () => slotOrder
            .map((slot) => cards.find((card) => card.slot === slot))
            .filter((card): card is FeaturedCard => Boolean(card)),
        [cards],
    );

    return (
        <section className="dm-section">
            <div className="dm-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('featured.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('featured.title')}</h2>
                </div>
                <Link to="/listings" className="dm-link">
                    {translate('featured.allRecommendations')} {Icons.arrow()}
                </Link>
            </div>

            {orderedCards.length > 0 ? (
                <div className="dm-feat">
                    {orderedCards.map(({ listing, slot }, index) => {
                        const coverImage = listing.image?.find((image): image is string => Boolean(image)) || null;
                        const saved = isFavorite(listing._id);
                        const detailsPath = `/details/${listing._id}`;
                        const price = `${formatPrice(listing.price, listing.currency, { compact: index !== 0 })}${listing.listingType === 'rent' ? ` ${t.perMonth}` : ''}`;

                        return (
                            <article key={`${slot}-${listing._id}`} className={`dm-feat__card ${index === 0 ? 'is-large' : ''}`}>
                                <Link to={detailsPath} className="dm-feat__media" aria-label={listing.location}>
                                    {coverImage ? (
                                        <img src={coverImage} alt={getPropertyLabel(listing, currentLanguage)} />
                                    ) : (
                                        <PlaceholderImage label={getPropertyLabel(listing, currentLanguage)} tone="warm" />
                                    )}
                                    <div className={`dm-feat__tag is-${slot}`}>{t.tags[slot]}</div>
                                </Link>
                                <button
                                    className={`dm-feat__fav ${saved ? 'is-active' : ''}`}
                                    type="button"
                                    onClick={() => toggleFavorite(listing._id)}
                                    aria-label={saved ? t.savedListing : t.save}
                                    title={saved ? t.savedListing : t.save}
                                >
                                    {Icons.heart()}
                                </button>
                                <Link to={detailsPath} className="dm-feat__body">
                                    <div className="dm-feat__price">{price}</div>
                                    <div className="dm-feat__title">{listing.location}</div>
                                    <div className="dm-feat__spec">{getSpec(listing, slot, currentLanguage)}</div>
                                </Link>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="dm-feat__empty" aria-busy={isLoading}>
                    {isLoading ? <span /> : <p>{t.noListings}</p>}
                </div>
            )}
        </section>
    );
};
