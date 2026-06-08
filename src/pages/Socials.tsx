import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';

const socialLinks = [
    {
        name: 'Instagram',
        href: 'https://www.instagram.com/dimMryi',
        handle: '@dimMryi',
        tone: 'instagram',
        titleUk: 'Візуальні добірки та новини сервісу',
        titleEn: 'Visual selections and service updates',
        textUk: 'Публікуємо добірки об’єктів, анонси сервісів, корисні підказки для власників, покупців, орендарів і рієлторів.',
        textEn: 'We publish property selections, service updates, and useful notes for owners, buyers, tenants, and agents.',
    },
    {
        name: 'TikTok',
        href: 'https://www.tiktok.com/@dimMryi',
        handle: '@dimMryi',
        tone: 'tiktok',
        titleUk: 'Короткі відео про нерухомість',
        titleEn: 'Short real estate videos',
        textUk: 'Плануємо короткі рекламні відео, огляди об’єктів, поради з пошуку та зрозумілі пояснення можливостей платформи.',
        textEn: 'We plan short promo videos, property highlights, search tips, and clear explanations of platform features.',
    },
];

const SocialIcon = ({ type }: { type: string }) => {
    if (type === 'instagram') {
        return (
            <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M14 4v10.5a4.5 4.5 0 1 1-4.5-4.5" />
            <path d="M14 6c1.2 2.2 2.9 3.6 5 4" />
        </svg>
    );
};

export default function Socials() {
    const { language } = useLanguage();
    const isEnglish = language === 'en';

    return (
        <main className="dm-socials-page">
            <section className="dm-socials-hero">
                <div>
                    <div className="dm-eyebrow">{isEnglish ? 'Social media' : 'Соцмережі'}</div>
                    <h1>{isEnglish ? 'Follow Dream Home where property stories become shorter and clearer' : 'Слідкуйте за Дім мрії там, де історії про нерухомість стають коротшими й зрозумілішими'}</h1>
                    <p>
                        {isEnglish
                            ? 'Our social pages are a lighter way to follow new offers, useful service updates, and practical real estate content.'
                            : 'Наші сторінки в соцмережах — це легший спосіб стежити за новими пропозиціями, корисними оновленнями сервісу та практичним контентом про нерухомість.'}
                    </p>
                    <div className="dm-socials-hero__actions">
                        <Link className="dm-btn dm-btn--accent" to="/listings">
                            {isEnglish ? 'Browse listings' : 'Перейти до оголошень'}
                        </Link>
                        <Link className="dm-btn dm-btn--ghost" to="/services">
                            {isEnglish ? 'View services' : 'Переглянути сервіси'}
                        </Link>
                    </div>
                </div>
                <aside className="dm-socials-note">
                    <span>{isEnglish ? 'Why follow' : 'Навіщо підписуватись'}</span>
                    <strong>{isEnglish ? 'Shorter format, faster updates, more visual context.' : 'Коротший формат, швидші оновлення, більше візуального контексту.'}</strong>
                    <p>
                        {isEnglish
                            ? 'The website remains the main place for search and services; social media adds quick highlights, reminders, and advertising posts.'
                            : 'Сайт залишається головним місцем для пошуку й сервісів, а соцмережі додають швидкі добірки, нагадування та рекламні пости.'}
                    </p>
                </aside>
            </section>

            <section className="dm-socials-grid" aria-label={isEnglish ? 'Social media links' : 'Посилання на соцмережі'}>
                {socialLinks.map((item) => (
                    <article className={`dm-social-card is-${item.tone}`} key={item.name}>
                        <div className="dm-social-card__icon">
                            <SocialIcon type={item.tone} />
                        </div>
                        <div>
                            <span>{item.handle}</span>
                            <h2>{item.name}</h2>
                            <h3>{isEnglish ? item.titleEn : item.titleUk}</h3>
                            <p>{isEnglish ? item.textEn : item.textUk}</p>
                        </div>
                        <a className="dm-btn dm-btn--accent" href={item.href} target="_blank" rel="noreferrer">
                            {isEnglish ? `Open ${item.name}` : `Відкрити ${item.name}`}
                        </a>
                    </article>
                ))}
            </section>

            <section className="dm-socials-cta">
                <div>
                    <span>{isEnglish ? 'Prefer the website?' : 'Зручніше на сайті?'}</span>
                    <h2>{isEnglish ? 'Use the full search, map, alerts, and agent profiles here' : 'Користуйтесь повним пошуком, картою, сповіщеннями та профілями рієлторів тут'}</h2>
                </div>
                <Link className="dm-btn dm-btn--accent" to="/notification">
                    {isEnglish ? 'Set up alerts' : 'Налаштувати сповіщення'}
                </Link>
            </section>
        </main>
    );
}
