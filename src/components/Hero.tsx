import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaceholderImage } from './PlaceholderImage';
import { Icons } from './Icons';
import { useLanguage } from '../LanguageProvider';
import { fetchListings } from '../services/ListingService';
import { fetchAgents } from '../services/AgentService';

interface HeroProps {
    accent: string;
}

type HeroTab = 'buy' | 'rent' | 'comm' | 'new';

const propertyOptions = [
    { value: '', label: 'Будь-який' },
    { value: 'flat', label: 'Квартира' },
    { value: 'private house', label: 'Будинок' },
    { value: 'commercial real estate', label: 'Комерційна' },
];

const roomOptions = [
    { value: '', label: 'Будь-яка' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5+', label: '5+' },
];

const sortOptions = [
    { value: 'newToOld', label: 'Спочатку нові' },
    { value: 'oldToNew', label: 'Спочатку старі' },
];

export const Hero = ({ accent }: HeroProps) => {
    const { translate } = useLanguage();
    const navigate = useNavigate();
    const [tab, setTab] = useState<HeroTab>('buy');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [listingCount, setListingCount] = useState<number | null>(null);
    const [todayListingCount, setTodayListingCount] = useState<number | null>(null);
    const [agentCount, setAgentCount] = useState<number | null>(null);
    const [form, setForm] = useState({
        location: '',
        listingType: 'sale',
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        novelty: 'newToOld',
        rooms: '',
        minArea: '',
        maxArea: '',
        typeOfNovelty: '',
    });

    useEffect(() => {
        let alive = true;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        fetchListings()
            .then((data) => {
                if (!alive) return;
                const listings = Array.isArray(data) ? data : [];
                setListingCount(listings.length);
                setTodayListingCount(
                    listings.filter((listing) => {
                        const published = Number(listing.date);
                        return Number.isFinite(published) && published >= todayStart.getTime();
                    }).length,
                );
            })
            .catch(() => {
                if (!alive) return;
                setListingCount(null);
                setTodayListingCount(null);
            });

        fetchAgents()
            .then((data) => {
                if (alive) setAgentCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => {
                if (alive) setAgentCount(null);
            });

        return () => {
            alive = false;
        };
    }, []);

    const tabs = [
        { k: 'buy' as const, l: translate('hero.tabs.buy') },
        { k: 'rent' as const, l: translate('hero.tabs.rent') },
        { k: 'comm' as const, l: translate('hero.tabs.comm') },
        { k: 'new' as const, l: translate('hero.tabs.new') },
    ];

    const stats = [
        { n: listingCount === null ? '...' : listingCount.toLocaleString('uk-UA'), l: translate('hero.stats.offers') },
        { n: agentCount === null ? '...' : agentCount.toLocaleString('uk-UA'), l: translate('hero.stats.agents') },
        { n: '98%', l: translate('hero.stats.satisfied') },
        { n: '24 год', l: translate('hero.stats.response') },
    ];
    const heroEyebrow =
        listingCount === null
            ? translate('hero.eyebrow')
            : `${listingCount.toLocaleString('uk-UA')} актуальних пропозицій · ${(todayListingCount ?? 0).toLocaleString('uk-UA')} додано сьогодні`;

    const tabDefaults = useMemo(
        () => ({
            buy: { listingType: 'sale', propertyType: '', typeOfNovelty: '' },
            rent: { listingType: 'rent', propertyType: '', typeOfNovelty: '' },
            comm: { listingType: '', propertyType: 'commercial real estate', typeOfNovelty: '' },
            new: { listingType: 'sale', propertyType: '', typeOfNovelty: 'newBuilding' },
        }),
        [],
    );

    const handleTabChange = (nextTab: HeroTab) => {
        setTab(nextTab);
        setForm((prev) => ({ ...prev, ...tabDefaults[nextTab] }));
    };

    const updateForm = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const params = new URLSearchParams();

        Object.entries(form).forEach(([key, value]) => {
            if (value && value !== 'newToOld') params.set(key, value);
        });

        navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleMapScroll = () => {
        document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section className="dm-hero">
            <div className="dm-hero__bg" aria-hidden>
                <div className="dm-hero__bg-grad" />
                <PlaceholderImage label={translate('hero.placeholders.hero')} tone="dark" />
            </div>

            <div className="dm-hero__inner">
                <div className="dm-hero__eyebrow">
                    <span className="dm-dot" style={{ backgroundColor: accent }} /> {heroEyebrow}
                </div>

                <h1 className="dm-hero__title">
                    <span>{translate('hero.title1')}</span>
                    <span className="dm-hero__title-it">{translate('hero.title2')}</span>
                    <span>{translate('hero.title3')}</span>
                </h1>

                <p className="dm-hero__lede">{translate('hero.lede')}</p>

                <form className="dm-search" onSubmit={handleSubmit}>
                    <div className="dm-search__tabs">
                        {tabs.map((item) => (
                            <button
                                key={item.k}
                                type="button"
                                className={'dm-search__tab ' + (tab === item.k ? 'is-active' : '')}
                                onClick={() => handleTabChange(item.k)}
                            >
                                {item.l}
                            </button>
                        ))}
                    </div>

                    <div className="dm-search__row">
                        <div className="dm-search__field dm-search__field--wide">
                            <label>{translate('hero.search.location')}</label>
                            <div className="dm-search__input">
                                {Icons.loc()}
                                <input
                                    placeholder={translate('hero.search.placeholder')}
                                    value={form.location}
                                    onChange={(event) => updateForm('location', event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="dm-search__field dm-search__field--choices">
                            <label>{translate('hero.search.type')}</label>
                            <ChoiceGroup
                                options={propertyOptions}
                                value={form.propertyType}
                                onChange={(value) => updateForm('propertyType', value)}
                            />
                        </div>
                        <div className="dm-search__field">
                            <label>Ціна від</label>
                            <div className="dm-search__input">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={form.minPrice}
                                    onChange={(event) => updateForm('minPrice', event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="dm-search__field">
                            <label>Ціна до</label>
                            <div className="dm-search__input">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Будь-яка"
                                    value={form.maxPrice}
                                    onChange={(event) => updateForm('maxPrice', event.target.value)}
                                />
                            </div>
                        </div>
                        <button className="dm-search__go" type="submit">
                            {Icons.search()}
                            <span>{translate('hero.search.go')}</span>
                        </button>
                    </div>

                    <div className="dm-search__more">
                        <button type="button" onClick={() => setShowMoreFilters((value) => !value)}>
                            {Icons.filter()}
                            <span>{showMoreFilters ? 'Менше фільтрів' : 'Більше фільтрів'}</span>
                        </button>
                    </div>

                    {showMoreFilters && (
                        <div className="dm-search__advanced">
                            <div className="dm-search__field dm-search__field--choices">
                                <label>Кімнат</label>
                                <ChoiceGroup options={roomOptions} value={form.rooms} onChange={(value) => updateForm('rooms', value)} />
                            </div>
                            <div className="dm-search__field">
                                <label>Площа від</label>
                                <div className="dm-search__input">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="м²"
                                        value={form.minArea}
                                        onChange={(event) => updateForm('minArea', event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="dm-search__field">
                                <label>Площа до</label>
                                <div className="dm-search__input">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="м²"
                                        value={form.maxArea}
                                        onChange={(event) => updateForm('maxArea', event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="dm-search__field dm-search__field--choices">
                                <label>Сортування</label>
                                <ChoiceGroup
                                    options={sortOptions}
                                    value={form.novelty}
                                    onChange={(value) => updateForm('novelty', value)}
                                />
                            </div>
                        </div>
                    )}
                </form>

                <div className="dm-hero__stats">
                    {stats.map((s) => (
                        <Stat key={s.l} n={s.n} l={s.l} />
                    ))}
                </div>
            </div>

            <button className="dm-hero__scroll" type="button" onClick={handleMapScroll}>
                <div className="dm-hero__scroll-line" />
                <span>{translate('hero.scroll')}</span>
            </button>
        </section>
    );
};

interface ChoiceGroupProps {
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
}

function ChoiceGroup({ options, value, onChange }: ChoiceGroupProps) {
    return (
        <div className="dm-choice-group">
            {options.map((option) => (
                <button
                    key={option.value || 'any'}
                    type="button"
                    className={value === option.value ? 'is-active' : ''}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

interface StatProps {
    n: string;
    l: string;
}

function Stat({ n, l }: StatProps) {
    return (
        <div className="dm-stat">
            <div className="dm-stat__n">{n}</div>
            <div className="dm-stat__l">{l}</div>
        </div>
    );
}
