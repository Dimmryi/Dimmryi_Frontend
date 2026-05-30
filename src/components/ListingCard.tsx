import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

export interface Listing {
  _id: string;
  date: number | string;
  listingNumber?: number;
  listingType: string;
  propertyType: string;
  apartmentDetails?: string;
  description?: string;
  price: number | string;
  image?: Array<string | null>;
  contact?: string;
  location: string;
  numbersOfRooms?: number;
  totalArea?: number;
  numberOfFloor?: number;
  numberOfStoreysOfBuilding?: number;
  typeOfNovelty?: string;
}

interface ListingCardProps {
  listing: Listing;
  scrollY?: number;
  onSaveScroll?: () => void;
}

const labels = {
  uk: {
    rent: 'Оренда',
    sale: 'Продаж',
    flat: 'Квартира',
    house: 'Будинок',
    other: 'Нерухомість',
    rooms: 'кімн',
    area: 'м²',
    floor: 'поверх з',
    newBuilding: 'Новобудова',
    noImage: 'Фото відсутнє',
    details: 'Детальніше',
    perMonth: '/ міс',
  },
  en: {
    rent: 'Rent',
    sale: 'Sale',
    flat: 'Apartment',
    house: 'House',
    other: 'Property',
    rooms: 'rooms',
    area: 'm²',
    floor: 'floor of',
    newBuilding: 'New build',
    noImage: 'No photo',
    details: 'View details',
    perMonth: '/ mo',
  },
};

const ListingCard = ({ listing, scrollY = 0, onSaveScroll = () => undefined }: ListingCardProps) => {
  const { language } = useLanguage();
  const t = labels[language === 'en' ? 'en' : 'uk'];

  const coverImage = listing.image?.find((img): img is string => Boolean(img)) ?? null;
  const isRent = listing.listingType === 'rent';
  const isFlat = listing.propertyType === 'flat';
  const isPrivateHouse = listing.propertyType === 'private house';
  const propertyLabel = isFlat ? t.flat : isPrivateHouse ? t.house : t.other;
  const showRooms = (isFlat || isPrivateHouse) && listing.numbersOfRooms;
  const showFloor = listing.numberOfFloor && listing.numberOfStoreysOfBuilding;
  const formattedDate = new Date(Number(listing.date)).toLocaleDateString(language === 'en' ? 'en-GB' : 'uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <li className="dm-listing-card">
      <Link
        to={`/details/${listing._id}`}
        state={{ fromHomeScroll: scrollY }}
        onClick={onSaveScroll}
        className="dm-listing-card__media"
      >
        {coverImage ? <img src={coverImage} alt={propertyLabel} /> : <div className="dm-listing-card__empty">{t.noImage}</div>}
        <span className={`dm-listing-card__badge ${isRent ? 'is-rent' : 'is-sale'}`}>{isRent ? t.rent : t.sale}</span>
        {listing.typeOfNovelty === 'newBuilding' && <span className="dm-listing-card__new">{t.newBuilding}</span>}
      </Link>

      <div className="dm-listing-card__body">
        <div className="dm-listing-card__meta">
          <span>{propertyLabel}</span>
          {listing.listingNumber ? <em>#{listing.listingNumber}</em> : null}
        </div>
        <div className="dm-listing-card__price">
          ₴{listing.price}
          {isRent && <span>{t.perMonth}</span>}
        </div>
        <div className="dm-listing-card__chips">
          {showRooms ? <span>{listing.numbersOfRooms} {t.rooms}</span> : null}
          {listing.totalArea ? <span>{listing.totalArea} {t.area}</span> : null}
          {showFloor ? <span>{listing.numberOfFloor} {t.floor} {listing.numberOfStoreysOfBuilding}</span> : null}
        </div>
        <p className="dm-listing-card__location">{listing.location}</p>
        <div className="dm-listing-card__footer">
          <span>{formattedDate}</span>
          <Link to={`/details/${listing._id}`} state={{ fromHomeScroll: scrollY }} onClick={onSaveScroll}>
            {t.details}
          </Link>
        </div>
      </div>
    </li>
  );
};

export default ListingCard;
