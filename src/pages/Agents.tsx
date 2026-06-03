import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useLanguage } from '../LanguageProvider';
import { fetchAgents, getAgentImage, type Agent } from '../services/AgentService';

const formatOptional = (value: string | undefined, fallback: string) => {
    const text = value?.trim();
    return text && text !== 'undefined' && text !== 'null' ? text : fallback;
};

const AgentSkeleton = () => (
    <li className="dm-agent-card is-loading">
        <div className="dm-agent-card__photo" />
        <div className="dm-agent-card__body">
            <span />
            <span />
            <span />
            <div className="dm-agent-card__stats">
                <i />
                <i />
                <i />
            </div>
            <b />
        </div>
    </li>
);

const AgentIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
);

const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6.3 6.3l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9z" />
    </svg>
);

export default function Agents() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadAgents = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await fetchAgents();
                if (!cancelled) setAgents(data);
            } catch {
                if (!cancelled) {
                    setError(isEnglish ? 'Failed to load agents.' : 'Не вдалося завантажити рієлторів.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadAgents();

        return () => {
            cancelled = true;
        };
    }, [isEnglish]);

    const handleEmailAgent = (email: string, name: string) => {
        const subject = encodeURIComponent(isEnglish ? `Property consultation with ${name}` : `Консультація з нерухомості: ${name}`);
        const body = encodeURIComponent(
            isEnglish
                ? 'Hello, I would like to discuss real estate options on Dim Mrii.'
                : 'Добрий день. Хочу обговорити варіанти нерухомості на платформі Дім мрії.',
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    const averageRating = useMemo(() => {
        const ratings = agents.map((agent) => Number.parseFloat(agent.rating || '')).filter((value) => Number.isFinite(value));
        if (ratings.length === 0) return '';
        return (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1);
    }, [agents]);

    return (
        <main className="dm-agents-page">
            <section className="dm-section">
                <div className="dm-agents-hero">
                    <div>
                        <div className="dm-eyebrow">{isEnglish ? 'Agents' : 'Рієлтори'}</div>
                        <h1 className="dm-h2">
                            {isEnglish ? 'Verified local experts for your next move' : 'Перевірені експерти для купівлі, продажу й оренди'}
                        </h1>
                    </div>
                    <p>
                        {isEnglish
                            ? 'Browse agent profiles, compare experience, and contact the specialist who best fits your property request.'
                            : 'Переглядайте профілі рієлторів, порівнюйте досвід і швидко зв’язуйтеся зі спеціалістом під вашу задачу.'}
                    </p>
                </div>

                <div className="dm-agents-summary" aria-label={isEnglish ? 'Agents summary' : 'Зведення по рієлторах'}>
                    <div>
                        <strong>{agents.length}</strong>
                        <span>{isEnglish ? 'agents in catalog' : 'рієлторів у каталозі'}</span>
                    </div>
                    <div>
                        <strong>{agents.reduce((sum, agent) => sum + (Number.parseInt(agent.totalDeal || '0', 10) || 0), 0)}</strong>
                        <span>{isEnglish ? 'completed deals' : 'угод в анкетах'}</span>
                    </div>
                    <div>
                        <strong>{averageRating || '—'}</strong>
                        <span>{isEnglish ? 'average rating' : 'середній рейтинг'}</span>
                    </div>
                </div>

                {loading ? <ul className="dm-agents-grid">{Array.from({ length: 6 }).map((_, index) => <AgentSkeleton key={index} />)}</ul> : null}
                {error ? <div className="dm-listings-status is-error">{error}</div> : null}
                {!loading && !error && agents.length === 0 ? (
                    <div className="dm-agents-empty">
                        <span>{AgentIcon()}</span>
                        <h2>{isEnglish ? 'No agents yet' : 'Поки немає рієлторів'}</h2>
                        <p>{isEnglish ? 'Agent profiles will appear here after admin publication.' : 'Профілі з’являться тут після додавання адміністратором.'}</p>
                    </div>
                ) : null}

                {!loading && !error && agents.length > 0 ? (
                    <ul className="dm-agents-grid">
                        {agents.map((agent) => {
                            const image = getAgentImage(agent.image);
                            const jobTitle = formatOptional(agent.jobTitle, isEnglish ? 'Real estate agent' : 'Рієлтор з нерухомості');
                            const saleVolume = formatOptional(agent.saleVolume, '—');
                            const totalDeal = formatOptional(agent.totalDeal, '—');
                            const rating = formatOptional(agent.rating, '—');
                            const license = formatOptional(agent.license, '—');

                            return (
                                <li className="dm-agent-card" key={agent._id}>
                                    <div className="dm-agent-card__photo">
                                        {image ? <img src={image} alt={isEnglish ? `${agent.name} profile photo` : `Фото рієлтора ${agent.name}`} loading="lazy" /> : <span>{AgentIcon()}</span>}
                                    </div>
                                    <div className="dm-agent-card__body">
                                        <div className="dm-agent-card__head">
                                            <div>
                                                <h2>{agent.name}</h2>
                                                <p>{jobTitle}</p>
                                            </div>
                                            <span>{rating} ★</span>
                                        </div>

                                        <div className="dm-agent-card__stats">
                                            <span>
                                                <strong>{saleVolume}</strong>
                                                {isEnglish ? 'sales volume' : 'обсяг продажів'}
                                            </span>
                                            <span>
                                                <strong>{totalDeal}</strong>
                                                {isEnglish ? 'deals' : 'угод'}
                                            </span>
                                            <span>
                                                <strong>{license}</strong>
                                                {isEnglish ? 'license' : 'ліцензія'}
                                            </span>
                                        </div>

                                        <div className="dm-agent-card__contacts">
                                            {agent.phone ? (
                                                <a href={`tel:${agent.phone}`}>
                                                    {PhoneIcon()}
                                                    {agent.phone}
                                                </a>
                                            ) : null}
                                            <a href={`mailto:${agent.email}`}>{agent.email}</a>
                                        </div>

                                        <button type="button" className="dm-agent-card__cta" onClick={() => handleEmailAgent(agent.email, agent.name)}>
                                            {isEnglish ? 'Contact agent' : 'Зв’язатися з рієлтором'}
                                            {Icons.arrow()}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}

                <div className="dm-agents-next-step">
                    <span>{isEnglish ? 'Agent profile' : 'Профіль рієлтора'}</span>
                    <p>
                        {isEnglish
                            ? 'Premium users and admins can create, edit, or hide their agent profile from the catalog.'
                            : 'Premium-користувачі та адміністратори можуть створити, редагувати або приховати свій профіль у каталозі.'}
                    </p>
                    <Link to="/my-agent">{isEnglish ? 'My profile' : 'Мій профіль'}</Link>
                </div>
            </section>
        </main>
    );
}
