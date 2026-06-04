import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons, CatIcon } from './Icons';
import { useLanguage } from '../LanguageProvider';
import { fetchListings } from '../services/ListingService';
import { fetchAgents } from '../services/AgentService';
import type { Listing } from './ListingCard';

type CategoryIcon = 'key' | 'bed' | 'office' | 'crane';

interface QuickCategory {
    key: string;
    label: string;
    href: string;
    icon: CategoryIcon;
    count: number | null;
}

const getTodayStart = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return todayStart.getTime();
};

const isPublishedToday = (listing: Listing) => {
    const published = Number(listing.date || 0);
    return Number.isFinite(published) && published >= getTodayStart();
};

export const Categories = () => {
    const { translate } = useLanguage();
    const [listings, setListings] = useState<Listing[]>([]);
    const [agentCount, setAgentCount] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;

        fetchListings()
            .then((data) => {
                if (alive) setListings(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (alive) setListings([]);
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

    const categories = useMemo<QuickCategory[]>(
        () => [
            {
                key: 'flat',
                label: 'Квартири',
                href: '/listings?propertyType=flat',
                icon: 'key',
                count: listings.filter((listing) => listing.propertyType === 'flat').length,
            },
            {
                key: 'rent',
                label: 'Оренда',
                href: '/listings?listingType=rent',
                icon: 'bed',
                count: listings.filter((listing) => listing.listingType === 'rent').length,
            },
            {
                key: 'sale',
                label: 'Продаж',
                href: '/listings?listingType=sale',
                icon: 'key',
                count: listings.filter((listing) => listing.listingType === 'sale').length,
            },
            {
                key: 'new',
                label: 'Новобудови',
                href: '/listings?typeOfNovelty=newBuilding',
                icon: 'crane',
                count: listings.filter((listing) => listing.typeOfNovelty === 'newBuilding').length,
            },
            {
                key: 'today',
                label: 'Свіжі сьогодні',
                href: '/listings?today=1',
                icon: 'bed',
                count: listings.filter(isPublishedToday).length,
            },
            {
                key: 'house',
                label: 'Будинки',
                href: '/listings?propertyType=private+house',
                icon: 'key',
                count: listings.filter((listing) => listing.propertyType === 'private house').length,
            },
            {
                key: 'commercial',
                label: 'Комерційна',
                href: '/listings?propertyType=commercial+real+estate',
                icon: 'office',
                count: listings.filter((listing) => listing.propertyType === 'commercial real estate').length,
            },
            {
                key: 'agents',
                label: 'Рієлтори',
                href: '/agents',
                icon: 'office',
                count: agentCount,
            },
        ],
        [agentCount, listings],
    );

    return (
        <section className="dm-section">
            <div className="dm-section__head">
                <div>
                    <div className="dm-eyebrow">{translate('categories.eyebrow')}</div>
                    <h2 className="dm-h2">{translate('categories.title')}</h2>
                </div>
            </div>
            <div className="dm-cats">
                {categories.map((category) => (
                    <Link key={category.key} to={category.href} className="dm-cat">
                        <div className="dm-cat__icon">
                            <CatIcon kind={category.icon} />
                        </div>
                        <div className="dm-cat__body">
                            <div className="dm-cat__label">{category.label}</div>
                            <div className="dm-cat__count">
                                {category.count === null
                                    ? 'завантаження...'
                                    : translate('categories.objectsCount', { count: category.count })}
                            </div>
                        </div>
                        <div className="dm-cat__arrow">{Icons.arrow()}</div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
