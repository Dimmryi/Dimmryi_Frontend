import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ListingCard, { type Listing } from '../components/ListingCard';
import Pagination from '../components/Pagination';
import { fetchListings } from '../services/ListingService';
import { useLanguage } from '../LanguageProvider';
import { useCurrency } from '../CurrencyProvider';

const PAGE_SIZE = 18;

const parseNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const includesText = (source: string | undefined, search: string) =>
  !search || String(source || '').toLowerCase().includes(search.toLowerCase());

const getTodayStart = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart.getTime();
};

const isPublishedToday = (date: number | string | undefined) => {
  const published = Number(date || 0);
  return Number.isFinite(published) && published >= getTodayStart();
};

export default function Listings() {
  const { translate } = useLanguage();
  const { convertPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentPage = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const filters = useMemo(
    () => ({
      listingType: searchParams.get('listingType') || '',
      propertyType: searchParams.get('propertyType') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      novelty: searchParams.get('novelty') || 'newToOld',
      location: searchParams.get('location') || '',
      rooms: searchParams.get('rooms') || '',
      minArea: searchParams.get('minArea') || '',
      maxArea: searchParams.get('maxArea') || '',
      typeOfNovelty: searchParams.get('typeOfNovelty') || '',
      today: searchParams.get('today') === '1' ? '1' : '',
    }),
    [searchParams],
  );

  useEffect(() => {
    let alive = true;

    fetchListings()
      .then((data) => {
        if (alive) setListings(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setError('Не вдалося завантажити оголошення.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filteredListings = useMemo(() => {
    const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Number.POSITIVE_INFINITY;
    const minArea = filters.minArea ? Number(filters.minArea) : 0;
    const maxArea = filters.maxArea ? Number(filters.maxArea) : Number.POSITIVE_INFINITY;

    return listings
      .filter((listing) => {
        const price = convertPrice(parseNumber(listing.price), listing.currency);
        const area = Number(listing.totalArea || 0);
        const rooms = Number(listing.numbersOfRooms || 0);
        const targetRooms = filters.rooms === '5+' ? 5 : Number(filters.rooms || 0);

        return (
          price >= minPrice &&
          price <= maxPrice &&
          area >= minArea &&
          area <= maxArea &&
          (!filters.listingType || listing.listingType === filters.listingType) &&
          (!filters.propertyType || listing.propertyType === filters.propertyType) &&
          (!filters.typeOfNovelty || listing.typeOfNovelty === filters.typeOfNovelty) &&
          (!filters.today || isPublishedToday(listing.date)) &&
          (!filters.rooms || (filters.rooms === '5+' ? rooms >= targetRooms : rooms === targetRooms)) &&
          includesText(listing.location, filters.location)
        );
      })
      .sort((a, b) => {
        const aDate = Number(a.date || 0);
        const bDate = Number(b.date || 0);
        return filters.novelty === 'oldToNew' ? aDate - bDate : bDate - aDate;
      });
  }, [convertPrice, filters, listings]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const displayedListings = useMemo(
    () => filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredListings],
  );

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value && !(key === 'novelty' && value === 'newToOld')).length;

  const handleTodayToggle = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    if (filters.today) {
      nextParams.delete('today');
    } else {
      nextParams.set('today', '1');
    }
    setSearchParams(nextParams);
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(nextPage));
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="dm-listings-page">
      <section className="dm-section">
        <div className="dm-section__head">
          <div>
            <div className="dm-eyebrow">Listings</div>
            <h1 className="dm-h2">{translate('featured.allRecommendations')}</h1>
          </div>
          {!loading && !error && (
            <div className="dm-listings-summary">
              <strong>{filteredListings.length}</strong>
              <span>{activeFilterCount ? `за вибраними фільтрами: ${activeFilterCount}` : 'усього доступно'}</span>
              <button className={'dm-listings-today ' + (filters.today ? 'is-active' : '')} type="button" onClick={handleTodayToggle}>
                Оголошення за сьогодні
              </button>
            </div>
          )}
        </div>

        {loading && <div className="dm-listings-status">Завантаження...</div>}
        {error && <div className="dm-listings-status is-error">{error}</div>}
        {!loading && !error && filteredListings.length === 0 && (
          <div className="dm-listings-status">За цими фільтрами оголошень поки немає.</div>
        )}
        {!loading && !error && filteredListings.length > 0 && (
          <>
            <ul className="dm-listings-grid">
              {displayedListings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  scrollY={window.scrollY}
                  onSaveScroll={() => localStorage.setItem('scrollPosition', String(window.scrollY))}
                />
              ))}
            </ul>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </section>
    </main>
  );
}
