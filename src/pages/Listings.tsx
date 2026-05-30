import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ListingCard, { type Listing } from '../components/ListingCard';
import Pagination from '../components/Pagination';
import { fetchListings } from '../services/ListingService';
import { useLanguage } from '../LanguageProvider';

const PAGE_SIZE = 18;

export default function Listings() {
  const { translate } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentPage = Math.max(1, Number(searchParams.get('page') ?? '1'));

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

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const displayedListings = useMemo(
    () => listings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, listings],
  );

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
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
        </div>

        {loading && <div className="dm-listings-status">Завантаження...</div>}
        {error && <div className="dm-listings-status is-error">{error}</div>}
        {!loading && !error && (
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
