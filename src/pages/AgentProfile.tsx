import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ListingCard, { type Listing } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import { useLanguage } from '../LanguageProvider';
import { fetchAgentListings, getAgentImage, type Agent } from '../services/AgentService';

const formatOptional = (value: string | undefined, fallback: string) => {
    const text = value?.trim();
    return text && text !== 'undefined' && text !== 'null' ? text : fallback;
};

const AgentAvatar = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
);

const copy = {
    uk: {
        eyebrow: 'Профіль рієлтора',
        back: 'Усі рієлтори',
        contact: 'Зв’язатися',
        listingsTitle: 'Оголошення рієлтора',
        listingsText: 'Об’єкти, які зараз представлені цим спеціалістом на Дім мрії.',
        emptyTitle: 'Поки немає активних оголошень',
        emptyText: 'Коли рієлтор додасть або відновить свої об’єкти, вони з’являться на цій сторінці.',
        loading: 'Завантажуємо профіль рієлтора...',
        error: 'Не вдалося завантажити профіль рієлтора.',
        notFound: 'Профіль рієлтора не знайдено.',
        deals: 'угод',
        rating: 'рейтинг',
        license: 'ліцензія',
        saleVolume: 'обсяг продажів',
        emailSubject: 'Консультація з нерухомості',
        emailBody: 'Добрий день. Хочу обговорити об’єкти, які ви рекламуєте на платформі Дім мрії.',
    },
    en: {
        eyebrow: 'Agent profile',
        back: 'All agents',
        contact: 'Contact',
        listingsTitle: 'Agent listings',
        listingsText: 'Properties currently represented by this specialist on Dim Mrii.',
        emptyTitle: 'No active listings yet',
        emptyText: 'When the agent adds or restores properties, they will appear on this page.',
        loading: 'Loading agent profile...',
        error: 'Failed to load agent profile.',
        notFound: 'Agent profile was not found.',
        deals: 'deals',
        rating: 'rating',
        license: 'license',
        saleVolume: 'sales volume',
        emailSubject: 'Property consultation',
        emailBody: 'Hello. I would like to discuss the properties you advertise on Dim Mrii.',
    },
};

export default function AgentProfile() {
    const { agentId } = useParams<{ agentId: string }>();
    const { language } = useLanguage();
    const t = copy[language === 'en' ? 'en' : 'uk'];
    const [agent, setAgent] = useState<Agent | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadAgentListings = async () => {
            if (!agentId) {
                setError(t.notFound);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = await fetchAgentListings(agentId);
                if (!cancelled) {
                    setAgent(data.agent);
                    setListings(data.listings);
                }
            } catch (err) {
                if (!cancelled) {
                    setAgent(null);
                    setListings([]);
                    setError(t.error);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadAgentListings();

        return () => {
            cancelled = true;
        };
    }, [agentId, t.error, t.notFound]);

    const image = agent ? getAgentImage(agent.image) : '';
    const mailTo = useMemo(() => {
        if (!agent?.email) return '';
        const subject = encodeURIComponent(`${t.emailSubject}: ${agent.name}`);
        const body = encodeURIComponent(t.emailBody);
        return `mailto:${agent.email}?subject=${subject}&body=${body}`;
    }, [agent?.email, agent?.name, t.emailBody, t.emailSubject]);

    if (loading) {
        return (
            <main className="dm-agent-public-page">
                <section className="dm-section">
                    <div className="dm-listings-status">{t.loading}</div>
                </section>
            </main>
        );
    }

    if (error || !agent) {
        return (
            <main className="dm-agent-public-page">
                <section className="dm-section">
                    <div className="dm-agent-public-empty">
                        <h1>{t.notFound}</h1>
                        <p>{error || t.error}</p>
                        <Link to="/agents">{t.back}</Link>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="dm-agent-public-page">
            <section className="dm-section">
                <div className="dm-agent-public-hero">
                    <div className="dm-agent-public-photo">
                        {image ? <img src={image} alt={agent.name} /> : <AgentAvatar />}
                    </div>
                    <div className="dm-agent-public-copy">
                        <div className="dm-eyebrow">{t.eyebrow}</div>
                        <h1 className="dm-h2">{agent.name}</h1>
                        <p>{formatOptional(agent.jobTitle, language === 'en' ? 'Real estate agent' : 'Рієлтор з нерухомості')}</p>
                        <div className="dm-agent-public-actions">
                            <Link to="/agents" className="dm-agent-public-button is-secondary">
                                {t.back}
                            </Link>
                            {mailTo ? (
                                <a href={mailTo} className="dm-agent-public-button">
                                    {t.contact}
                                    {Icons.arrow()}
                                </a>
                            ) : null}
                        </div>
                    </div>
                    <div className="dm-agent-public-stats" aria-label={t.eyebrow}>
                        <span>
                            <strong>{formatOptional(agent.rating, '—')}</strong>
                            {t.rating}
                        </span>
                        <span>
                            <strong>{formatOptional(agent.totalDeal, '—')}</strong>
                            {t.deals}
                        </span>
                        <span>
                            <strong>{formatOptional(agent.license, '—')}</strong>
                            {t.license}
                        </span>
                        <span>
                            <strong>{formatOptional(agent.saleVolume, '—')}</strong>
                            {t.saleVolume}
                        </span>
                    </div>
                </div>

                <div className="dm-agent-public-listings-head">
                    <div>
                        <span>{listings.length}</span>
                        <h2>{t.listingsTitle}</h2>
                    </div>
                    <p>{t.listingsText}</p>
                </div>

                {listings.length > 0 ? (
                    <ul className="dm-agent-public-grid">
                        {listings.map((listing) => (
                            <ListingCard key={listing._id} listing={listing} />
                        ))}
                    </ul>
                ) : (
                    <div className="dm-agent-public-empty">
                        <h2>{t.emptyTitle}</h2>
                        <p>{t.emptyText}</p>
                    </div>
                )}
            </section>
        </main>
    );
}