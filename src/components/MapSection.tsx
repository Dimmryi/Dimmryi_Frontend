import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PROPERTIES } from '../constants';
import { Icons } from './Icons';
import { PlaceholderImage } from './PlaceholderImage';
import type { Property } from '../types';
import { useLanguage } from '../LanguageProvider';
import type { Listing } from './ListingCard';
import { fetchListings } from '../services/ListingService';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { resetMapFilter, setFilterFeatures } from '../features/filterMap/filterMapSlice';
import { useFavorites } from '../hooks/useFavorites';
import { useCurrency } from '../CurrencyProvider';

const LeafletListingsMap = lazy(() => import('./LeafletListingsMap'));

interface MapSectionProps {
    accent: string;
}

type FilterMode = 'all' | 'sale' | 'rent';
type MapCommandType = 'zoomIn' | 'zoomOut' | 'locate';
type MapCommand = { type: MapCommandType; id: number };

const MAP_ROOM_OPTIONS = [0, 1, 2, 3, 4, '5+'] as const;
const PRICE_RANGE_MAX_BY_MODE_USD: Record<FilterMode, number> = {
    all: 500000,
    sale: 500000,
    rent: 5000,
};
const PRICE_RANGE_STEP_BY_MODE_USD: Record<FilterMode, number> = {
    all: 1000,
    sale: 1000,
    rent: 50,
};
const PRICE_SLIDER_MAX = 100;
const PRICE_TANGENT_MAX_RADIANS = (85 * Math.PI) / 180;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sliderToPriceRatio = (value: number) => {
    const normalized = clamp(value, 0, PRICE_SLIDER_MAX) / PRICE_SLIDER_MAX;

    return Math.tan(normalized * PRICE_TANGENT_MAX_RADIANS) / Math.tan(PRICE_TANGENT_MAX_RADIANS);
};

const priceRatioToSlider = (value: number) => {
    const ratio = clamp(value, 0, 1);

    return (Math.atan(ratio * Math.tan(PRICE_TANGENT_MAX_RADIANS)) / PRICE_TANGENT_MAX_RADIANS) * PRICE_SLIDER_MAX;
};

const mockListingFromProperty = (property: Property): Listing => ({
    _id: `mock-${property.id}`,
    date: Date.now(),
    listingType: property.status,
    propertyType: property.type.includes('Буд') ? 'private house' : 'flat',
    price: property.price.replace(/[^\d.]/g, '') || property.price,
    location: property.district,
    numbersOfRooms: property.beds,
    totalArea: property.area,
    title: property.title,
    typeOfNovelty: property.id % 2 === 0 ? 'newBuilding' : 'secondaryHousing',
} as Listing & { title: string });

const getListingTitle = (listing?: Listing) =>
    ((listing as Listing & { title?: string })?.title || listing?.description?.slice(0, 72) || "Об'єкт нерухомості");

const getListingCover = (listing?: Listing) => listing?.image?.find((item): item is string => Boolean(item)) || '';

const getTodayStart = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return todayStart.getTime();
};

const isPublishedToday = (date: number | string | undefined) => {
    const published = Number(date || 0);
    return Number.isFinite(published) && published >= getTodayStart();
};

export const MapSection = ({ accent }: MapSectionProps) => {
    const { translate } = useLanguage();
    const dispatch = useAppDispatch();
    const mapFilter = useAppSelector((state) => state.filterMap);
    const { favoriteIds, toggleFavorite } = useFavorites();
    const { displayCurrency, convertPrice, formatPrice } = useCurrency();

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [active, setActive] = useState<string>('');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(0);
    const [priceMinSlider, setPriceMinSlider] = useState(0);
    const [priceMaxSlider, setPriceMaxSlider] = useState(PRICE_SLIDER_MAX);
    const [beds, setBeds] = useState(0);
    const [areaMin, setAreaMin] = useState('');
    const [areaMax, setAreaMax] = useState('');
    const [showMoreChips, setShowMoreChips] = useState(false);
    const [newBuildOnly, setNewBuildOnly] = useState(false);
    const [todayOnly, setTodayOnly] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [mapCommand, setMapCommand] = useState<MapCommand | null>(null);
    const [mapListings, setMapListings] = useState<Listing[]>([]);
    const [mapError, setMapError] = useState('');

    const fallbackListings = useMemo(() => PROPERTIES.map(mockListingFromProperty), []);
    const listingsForMap = mapListings.length > 0 ? mapListings : fallbackListings;
    const priceRangeMaxUsd = PRICE_RANGE_MAX_BY_MODE_USD[filterMode];
    const priceRangeStepUsd = PRICE_RANGE_STEP_BY_MODE_USD[filterMode];
    const absoluteMaxPrice = useMemo(() => convertPrice(priceRangeMaxUsd, 'USD'), [convertPrice, priceRangeMaxUsd]);
    const priceStep = useMemo(() => Math.max(1, Math.round(convertPrice(priceRangeStepUsd, 'USD'))), [convertPrice, priceRangeStepUsd]);
    const priceSliderStep = 0.5;

    const sliderToDisplayPrice = (value: number) => Math.round(sliderToPriceRatio(value) * absoluteMaxPrice);
    const displayPriceToSlider = (value: number) =>
        priceRatioToSlider(absoluteMaxPrice ? value / absoluteMaxPrice : 0);

    const filtered = useMemo(() => {
        const selectedRoom = MAP_ROOM_OPTIONS[beds];
        const minAreaValue = areaMin === '' ? 0 : Number(areaMin);
        const maxAreaValue = areaMax === '' ? Infinity : Number(areaMax);

        return listingsForMap.filter((listing) => {
            const rooms = Number(listing.numbersOfRooms || 0);
            const area = Number(listing.totalArea || 0);
            const price = convertPrice(listing.price, listing.currency);

            const matchesMode = filterMode === 'all' || listing.listingType === filterMode;
            const matchesRooms = selectedRoom === 0 || (selectedRoom === '5+' ? rooms >= 5 : rooms === selectedRoom);
            const matchesArea =
                (!Number.isFinite(minAreaValue) || area >= minAreaValue) &&
                (!Number.isFinite(maxAreaValue) || area <= maxAreaValue);
            const matchesPrice = price >= priceMin && price <= priceMax;
            const matchesPropertyType = !mapFilter.propertyType || listing.propertyType === mapFilter.propertyType;
            const matchesNovelty = !newBuildOnly || listing.typeOfNovelty === 'newBuilding';
            const matchesToday = !todayOnly || isPublishedToday(listing.date);

            return matchesMode && matchesRooms && matchesArea && matchesPrice && matchesPropertyType && matchesNovelty && matchesToday;
        });
    }, [areaMax, areaMin, beds, convertPrice, filterMode, listingsForMap, mapFilter.propertyType, newBuildOnly, priceMax, priceMin, todayOnly]);

    const activeListing = useMemo(
        () => (active ? filtered.find((listing) => listing._id === active) : undefined),
        [active, filtered],
    );

    const coverImage = getListingCover(activeListing);
    const isFavorite = favoriteIds.includes(activeListing?._id || '');

    useEffect(() => {
        let cancelled = false;

        fetchListings()
            .then((data) => {
                if (cancelled) return;
                setMapListings(Array.isArray(data) ? data : []);
                setMapError('');
            })
            .catch(() => {
                if (!cancelled) setMapError("Не вдалося завантажити оголошення для карти, показуємо демо-об'єкти.");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setFilterMode(mapFilter.listingType === 'rent' || mapFilter.listingType === 'sale' ? mapFilter.listingType : 'all');
    }, [mapFilter.listingType]);

    useEffect(() => {
        if (absoluteMaxPrice <= 0) return;
        setPriceMin(0);
        setPriceMax(absoluteMaxPrice);
        setPriceMinSlider(0);
        setPriceMaxSlider(PRICE_SLIDER_MAX);
    }, [absoluteMaxPrice]);

    const chipOptions = [
        { k: 'all' as const, l: translate('mapSection.filters.all'), n: listingsForMap.length },
        { k: 'sale' as const, l: translate('mapSection.filters.sale'), n: listingsForMap.filter((p) => p.listingType === 'sale').length },
        { k: 'rent' as const, l: translate('mapSection.filters.rent'), n: listingsForMap.filter((p) => p.listingType === 'rent').length },
    ];

    const topChipCounts = {
        newBuilding: listingsForMap.filter((listing) => listing.typeOfNovelty === 'newBuilding').length,
        today: listingsForMap.filter((listing) => isPublishedToday(listing.date)).length,
        flat: listingsForMap.filter((listing) => listing.propertyType === 'flat').length,
        privateHouse: listingsForMap.filter((listing) => listing.propertyType === 'private house').length,
        commercial: listingsForMap.filter((listing) => listing.propertyType === 'commercial real estate').length,
    };

    const roomLabels = MAP_ROOM_OPTIONS.map((value) => (value === 0 ? translate('mapSection.filters.zero') : String(value)));
    const currencySymbol = displayCurrency === 'UAH' ? '₴' : '$';

    const handleFilterModeChange = (nextMode: FilterMode) => {
        setFilterMode(nextMode);
        dispatch(setFilterFeatures({ listingType: nextMode === 'all' ? '' : nextMode }));
    };

    const handleMapFilterChange = (field: 'destination' | 'rangeValue' | 'propertyType', value: string | number) => {
        dispatch(setFilterFeatures({ [field]: value }));
    };

    const handleToggleFavorite = () => {
        if (!activeListing?._id) return;
        toggleFavorite(activeListing._id);
    };

    const sendMapCommand = (type: MapCommandType) => {
        setMapCommand({ type, id: Date.now() });
    };

    const handleResetMapFilter = () => {
        setFilterMode('all');
        setPriceMin(0);
        setPriceMax(absoluteMaxPrice);
        setPriceMinSlider(0);
        setPriceMaxSlider(PRICE_SLIDER_MAX);
        setBeds(0);
        setAreaMin('');
        setAreaMax('');
        setNewBuildOnly(false);
        setTodayOnly(false);
        setShowMoreChips(false);
        dispatch(resetMapFilter());
    };

    return (
        <section id="map" className={'dm-map-section ' + (expanded ? 'is-expanded' : '')}>
            <div style={{ backgroundColor: accent, width: 0, height: 0, overflow: 'hidden' }} />

            <div className="dm-map-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('mapSection.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('mapSection.title')}</h2>
                </div>
                <p className="dm-map-section__lede">
                    {translate('mapSection.lede', { count: filtered.length })}
                    {mapError ? <span className="dm-map-section__warn">{mapError}</span> : null}
                </p>
            </div>

            <div className="dm-map">
                <div className="dm-map__canvas">
                    <Suspense fallback={<div className="dm-leaflet-fallback">Завантажую інтерактивну карту...</div>}>
                        <LeafletListingsMap
                            listings={filtered}
                            filter={mapFilter}
                            activeId={active}
                            expanded={expanded}
                            command={mapCommand}
                            onPick={(listing) => {
                                setActive(listing._id);
                                setInfoOpen(true);
                            }}
                        />
                    </Suspense>

                    <div className="dm-map__chips">
                        <ChipGroup value={filterMode} onChange={handleFilterModeChange} options={chipOptions} />
                        <div className="dm-map__chip-divider" />
                        <button
                            className={'dm-chip dm-chip--solid ' + (newBuildOnly ? 'is-on' : '')}
                            onClick={() => setNewBuildOnly((current) => !current)}
                        >
                            Новобудова <em>{topChipCounts.newBuilding}</em>
                        </button>
                        <button
                            className={'dm-chip dm-chip--solid ' + (todayOnly ? 'is-on' : '')}
                            onClick={() => setTodayOnly((current) => !current)}
                        >
                            Сьогодні <em>{topChipCounts.today}</em>
                        </button>
                        <button
                            className={'dm-chip dm-chip--solid ' + (mapFilter.propertyType === 'flat' ? 'is-on' : '')}
                            onClick={() => handleMapFilterChange('propertyType', mapFilter.propertyType === 'flat' ? '' : 'flat')}
                        >
                            Квартира <em>{topChipCounts.flat}</em>
                        </button>
                        <button
                            className={'dm-chip dm-chip--solid ' + (mapFilter.propertyType === 'private house' ? 'is-on' : '')}
                            onClick={() =>
                                handleMapFilterChange('propertyType', mapFilter.propertyType === 'private house' ? '' : 'private house')
                            }
                        >
                            Приватний будинок <em>{topChipCounts.privateHouse}</em>
                        </button>
                        {showMoreChips ? (
                            <button
                                className={'dm-chip dm-chip--solid ' + (mapFilter.propertyType === 'commercial real estate' ? 'is-on' : '')}
                                onClick={() =>
                                    handleMapFilterChange(
                                        'propertyType',
                                        mapFilter.propertyType === 'commercial real estate' ? '' : 'commercial real estate',
                                    )
                                }
                            >
                                Комерційна <em>{topChipCounts.commercial}</em>
                            </button>
                        ) : (
                            <button className="dm-chip dm-chip--ghost" onClick={() => setShowMoreChips(true)}>
                                +ще {topChipCounts.commercial}
                            </button>
                        )}
                    </div>

                    <div className="dm-map__controls">
                        <button
                            className="dm-mctl"
                            type="button"
                            title={translate('mapSection.controls.expand')}
                            onClick={() => setExpanded((current) => !current)}
                        >
                            {Icons.expand()}
                        </button>
                        <div className="dm-mctl-stack">
                            <button className="dm-mctl" type="button" onClick={() => sendMapCommand('zoomIn')}>
                                {Icons.plus()}
                            </button>
                            <div className="dm-mctl__divider" />
                            <button className="dm-mctl" type="button" onClick={() => sendMapCommand('zoomOut')}>
                                {Icons.minus()}
                            </button>
                        </div>
                        <button className="dm-mctl" type="button" title={translate('mapSection.controls.position')} onClick={() => sendMapCommand('locate')}>
                            {Icons.loc()}
                        </button>
                    </div>

                    {!filtersOpen && !infoOpen && (
                        <button className="dm-map__tab dm-map__tab--left" onClick={() => setFiltersOpen(true)}>
                            {Icons.filter()}
                            <span>{translate('mapSection.tabs.filters')}</span>
                            <span className="dm-map__tab-badge">{filtered.length}</span>
                        </button>
                    )}

                    {!infoOpen && !filtersOpen && (
                        <button className="dm-map__tab dm-map__tab--right" onClick={() => setInfoOpen(true)}>
                            {Icons.info()}
                            <span>{translate('mapSection.tabs.info')}</span>
                        </button>
                    )}

                    <aside className={'dm-panel dm-panel--left ' + (filtersOpen ? 'is-open' : '')}>
                        <div className="dm-panel__head">
                            <div className="dm-panel__title">
                                <span className="dm-panel__icon">{Icons.filter()}</span>
                                <div>
                                    <div className="dm-panel__h">{translate('mapSection.panel.title')}</div>
                                    <div className="dm-panel__sub">
                                        {translate('mapSection.panel.sub', { active: filtered.length, count: filtered.length })}
                                    </div>
                                </div>
                            </div>
                            <button className="dm-iconbtn" onClick={() => setFiltersOpen(false)}>
                                {Icons.close()}
                            </button>
                        </div>

                        <div className="dm-panel__body">
                            <FilterGroup label={translate('mapSection.filters.transaction')}>
                                <SegRow
                                    value={filterMode}
                                    onChange={handleFilterModeChange}
                                    opts={[
                                        { k: 'all', l: translate('mapSection.filters.all') },
                                        { k: 'sale', l: translate('mapSection.filters.sale') },
                                        { k: 'rent', l: translate('mapSection.filters.rent') },
                                    ]}
                                />
                            </FilterGroup>

                            <FilterGroup label="Свіжість">
                                <div className="dm-pills">
                                    <button
                                        type="button"
                                        className={'dm-pill ' + (!todayOnly ? 'is-on' : '')}
                                        onClick={() => setTodayOnly(false)}
                                    >
                                        Усі
                                    </button>
                                    <button
                                        type="button"
                                        className={'dm-pill ' + (todayOnly ? 'is-on' : '')}
                                        onClick={() => setTodayOnly(true)}
                                    >
                                        За сьогодні
                                    </button>
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.price')}>
                                <div className="dm-twoinput">
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.from')}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={priceMax}
                                            step={priceStep}
                                            value={priceMin}
                                            onChange={(event) => {
                                                const nextPrice = clamp(Number(event.target.value || 0), 0, priceMax);
                                                setPriceMin(nextPrice);
                                                setPriceMinSlider(Math.min(displayPriceToSlider(nextPrice), priceMaxSlider));
                                            }}
                                        />
                                        <em>{currencySymbol}</em>
                                    </div>
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.to')}</span>
                                        <input
                                            type="number"
                                            min={priceMin}
                                            max={absoluteMaxPrice}
                                            step={priceStep}
                                            value={priceMax}
                                            onChange={(event) => {
                                                const nextPrice = clamp(Number(event.target.value || 0), priceMin, absoluteMaxPrice);
                                                setPriceMax(nextPrice);
                                                setPriceMaxSlider(Math.max(displayPriceToSlider(nextPrice), priceMinSlider));
                                            }}
                                        />
                                        <em>{currencySymbol}</em>
                                    </div>
                                </div>
                                <div className="dm-range dm-range--dual">
                                    <div className="dm-range__bar">
                                        <div
                                            className="dm-range__fill"
                                            style={{
                                                left: `${priceMinSlider}%`,
                                                width: `${priceMaxSlider - priceMinSlider}%`,
                                            }}
                                        />
                                        <div className="dm-range__handle" style={{ left: `${priceMinSlider}%` }} />
                                        <div className="dm-range__handle" style={{ left: `${priceMaxSlider}%` }} />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={PRICE_SLIDER_MAX}
                                        step={priceSliderStep}
                                        value={priceMinSlider}
                                        onChange={(event) => {
                                            const nextSlider = Math.min(Number(event.target.value), priceMaxSlider);
                                            setPriceMinSlider(nextSlider);
                                            setPriceMin(Math.min(sliderToDisplayPrice(nextSlider), priceMax));
                                        }}
                                        className="dm-range__native dm-range__native--min"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={PRICE_SLIDER_MAX}
                                        step={priceSliderStep}
                                        value={priceMaxSlider}
                                        onChange={(event) => {
                                            const nextSlider = Math.max(Number(event.target.value), priceMinSlider);
                                            setPriceMaxSlider(nextSlider);
                                            setPriceMax(Math.max(sliderToDisplayPrice(nextSlider), priceMin));
                                        }}
                                        className="dm-range__native dm-range__native--max"
                                    />
                                    <div className="dm-range__labels">
                                        <span>{formatPrice(0, displayCurrency)}</span>
                                        <span className="dm-range__val">
                                            {translate('mapSection.filters.from')} {formatPrice(priceMin, displayCurrency)} - {formatPrice(priceMax, displayCurrency)}
                                        </span>
                                        <span>{formatPrice(absoluteMaxPrice, displayCurrency)}</span>
                                    </div>
                                </div>
                            </FilterGroup>

                            <FilterGroup label="Локація">
                                <div className="dm-mininput dm-mininput--wide">
                                    <span>місто</span>
                                    <input
                                        value={mapFilter.destination}
                                        onChange={(event) => handleMapFilterChange('destination', event.target.value)}
                                        placeholder="Київ, Поділ"
                                    />
                                </div>
                                <div className="dm-range dm-range--compact">
                                    <div className="dm-range__bar">
                                        <div className="dm-range__fill" style={{ width: `${(mapFilter.rangeValue / 40) * 100}%` }} />
                                        <div className="dm-range__handle" style={{ left: `${(mapFilter.rangeValue / 40) * 100}%` }} />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="40"
                                        value={mapFilter.rangeValue}
                                        onChange={(event) => handleMapFilterChange('rangeValue', Number(event.target.value))}
                                        className="dm-range__native"
                                    />
                                    <div className="dm-range__labels">
                                        <span>0 км</span>
                                        <span className="dm-range__val">{mapFilter.rangeValue} км</span>
                                        <span>40 км</span>
                                    </div>
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.rooms')}>
                                <div className="dm-pills">
                                    {MAP_ROOM_OPTIONS.map((_, index) => (
                                        <button
                                            key={index}
                                            className={'dm-pill ' + (beds === index ? 'is-on' : '')}
                                            onClick={() => setBeds(index)}
                                        >
                                            {roomLabels[index]}
                                        </button>
                                    ))}
                                </div>
                            </FilterGroup>

                            <FilterGroup label={translate('mapSection.filters.area')}>
                                <div className="dm-twoinput">
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.from')}</span>
                                        <input
                                            type="number"
                                            value={areaMin}
                                            onChange={(event) => setAreaMin(event.target.value)}
                                            placeholder="40"
                                        />
                                        <em>m²</em>
                                    </div>
                                    <div className="dm-mininput">
                                        <span>{translate('mapSection.filters.to')}</span>
                                        <input
                                            type="number"
                                            value={areaMax}
                                            onChange={(event) => setAreaMax(event.target.value)}
                                            placeholder="280"
                                        />
                                        <em>m²</em>
                                    </div>
                                </div>
                            </FilterGroup>

                            <FilterGroup label="Тип нерухомості">
                                <div className="dm-pills">
                                    {[
                                        { value: '', label: 'Усі' },
                                        { value: 'flat', label: 'Квартира' },
                                        { value: 'private house', label: 'Будинок' },
                                        { value: 'commercial real estate', label: 'Комерційна' },
                                    ].map((option) => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            className={'dm-pill ' + (mapFilter.propertyType === option.value ? 'is-on' : '')}
                                            onClick={() => handleMapFilterChange('propertyType', option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </FilterGroup>
                        </div>

                        <div className="dm-panel__foot">
                            <button className="dm-btn dm-btn--ghost dm-btn--sm" onClick={handleResetMapFilter}>
                                {translate('mapSection.buttons.reset')}
                            </button>
                            <button className="dm-btn dm-btn--accent dm-btn--sm" onClick={() => setFiltersOpen(false)}>
                                {translate('mapSection.buttons.show', { count: filtered.length })} {Icons.arrow()}
                            </button>
                        </div>
                    </aside>

                    <aside className={'dm-panel dm-panel--right ' + (infoOpen ? 'is-open' : '')}>
                        <div className="dm-panel__head">
                            <div className="dm-panel__title">
                                <span className="dm-panel__icon">{Icons.info()}</span>
                                <div>
                                    <div className="dm-panel__h">{translate('mapSection.tabs.info')}</div>
                                    <div className="dm-panel__sub">{activeListing?.location || 'Оберіть об’єкт на мапі'}</div>
                                </div>
                            </div>
                            <button className="dm-iconbtn" onClick={() => setInfoOpen(false)}>
                                {Icons.close()}
                            </button>
                        </div>

                        <div className="dm-panel__body dm-panel__body--info">
                            {activeListing ? (
                                <>
                            <div className="dm-prop-card">
                                <div className="dm-prop-card__media">
                                    <Link className="dm-prop-card__media-link" to={`/details/${activeListing._id}`} aria-label="Детальніше">
                                        {coverImage ? (
                                            <img className="dm-prop-card__img" src={coverImage} alt={getListingTitle(activeListing)} />
                                        ) : (
                                            <PlaceholderImage label={activeListing.propertyType || 'property'} tone="warm" />
                                        )}
                                    </Link>
                                    <button
                                        className={'dm-prop-card__fav ' + (isFavorite ? 'is-active' : '')}
                                        type="button"
                                        onClick={handleToggleFavorite}
                                        aria-label={isFavorite ? 'Прибрати зі збережених' : 'Зберегти оголошення'}
                                    >
                                        {Icons.heart()}
                                    </button>
                                    <div className="dm-prop-card__badge">
                                        {activeListing.listingType === 'rent'
                                            ? translate('mapSection.status.rent')
                                            : translate('mapSection.status.sale')}
                                    </div>
                                </div>
                                <div className="dm-prop-card__body">
                                    <div className="dm-prop-card__price">
                                        {formatPrice(activeListing.price, activeListing.currency)}
                                        {activeListing.listingType === 'rent' && <em>{translate('mapSection.properties.perMonth')}</em>}
                                    </div>
                                    <div className="dm-prop-card__title">{getListingTitle(activeListing)}</div>
                                    <div className="dm-prop-card__loc">
                                        {Icons.pin()} {activeListing.location}
                                    </div>
                                    <div className="dm-prop-card__specs">
                                        {activeListing.numbersOfRooms ? (
                                            <span>
                                                {Icons.bed()}
                                                {translate('mapSection.properties.rooms', { value: activeListing.numbersOfRooms })}
                                            </span>
                                        ) : null}
                                        {activeListing.numberOfFloor ? (
                                            <span>
                                                {Icons.bath()}
                                                {activeListing.numberOfFloor} поверх
                                            </span>
                                        ) : null}
                                        {activeListing.totalArea ? (
                                            <span>
                                                {Icons.area()}
                                                {translate('mapSection.properties.area', { value: activeListing.totalArea })}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="dm-info-block">
                                <div className="dm-info-block__h">Опис об'єкта</div>
                                <p className="dm-info-note">
                                    {activeListing.apartmentDetails ||
                                        "Деталі планування ще не додані. Повний опис об'єкта буде на сторінці Details."}
                                </p>
                            </div>

                            <div className="dm-info-actions">
                                <button className="dm-btn dm-btn--ghost dm-btn--sm" type="button" onClick={handleToggleFavorite}>
                                    {isFavorite ? 'Збережено' : 'Зберегти'}
                                </button>
                                <Link className="dm-btn dm-btn--accent dm-btn--sm" to={`/details/${activeListing._id}`}>
                                    Детальніше
                                </Link>
                            </div>
                                </>
                            ) : (
                                <div className="dm-info-empty" aria-live="polite">
                                    <div className="dm-info-empty__icon">{Icons.info()}</div>
                                    <div className="dm-info-empty__title">Об’єкт не вибрано</div>
                                    <p>Натисніть на маркер на карті, щоб побачити деталі оголошення.</p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            <div className="dm-map-strip">
                {filtered.slice(0, 6).map((listing) => (
                    <button
                        key={listing._id}
                        className={'dm-map-strip__item ' + (listing._id === active ? 'is-active' : '')}
                        onClick={() => {
                            setActive(listing._id);
                            setInfoOpen(true);
                        }}
                    >
                        <span className="dm-map-strip__price">{formatPrice(listing.price, listing.currency)}</span>
                        <span className="dm-map-strip__title">{getListingTitle(listing)}</span>
                        <span className="dm-map-strip__sub">
                            {listing.numbersOfRooms
                                ? translate('mapSection.properties.rooms', { value: listing.numbersOfRooms })
                                : listing.propertyType}{' '}
                            · {listing.totalArea ? translate('mapSection.properties.area', { value: listing.totalArea }) : listing.location}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
};

interface FilterGroupProps {
    label: string;
    children?: ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
    return (
        <div className="dm-fgroup">
            <div className="dm-fgroup__l">{label}</div>
            {children}
        </div>
    );
}

interface SegRowProps {
    value: FilterMode;
    onChange: (value: FilterMode) => void;
    opts: Array<{ k: FilterMode; l: string }>;
}

function SegRow({ value, onChange, opts }: SegRowProps) {
    return (
        <div className="dm-seg">
            {opts.map((option) => (
                <button
                    key={option.k}
                    className={'dm-seg__btn ' + (value === option.k ? 'is-on' : '')}
                    onClick={() => onChange(option.k)}
                >
                    {option.l}
                </button>
            ))}
            <div
                className="dm-seg__pip"
                style={{
                    transform: `translateX(${opts.findIndex((option) => option.k === value) * 100}%)`,
                    width: `${100 / opts.length}%`,
                }}
            />
        </div>
    );
}

interface ChipGroupProps {
    value: FilterMode;
    onChange: (value: FilterMode) => void;
    options: Array<{ k: FilterMode; l: string; n: number }>;
}

function ChipGroup({ value, onChange, options }: ChipGroupProps) {
    return (
        <div className="dm-chip-grp">
            {options.map((option) => (
                <button
                    key={option.k}
                    className={'dm-chip dm-chip--solid ' + (value === option.k ? 'is-on' : '')}
                    onClick={() => onChange(option.k)}
                >
                    {option.l} <em>{option.n}</em>
                </button>
            ))}
        </div>
    );
}
